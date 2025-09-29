import type { PhotopeaPage } from "@/PhotopeaPage"
import { Mutex } from "async-mutex"
import invariant from "tiny-invariant"
import {
  PhotopeaChannelEvalError,
  PhotopeaChannelLogicError,
  PhotopeaChannelPageError,
  PhotopeaChannelScriptError,
  PhotopeaChannelTimeoutError
} from "./channel-errors"
import { Contract } from "./contracts/base/Contract"
import { abortOnTimeout } from "./helpers"

export type Handleable = Contract | string
export type HandleVars = Record<string, Handleable>
export type EvaluateOptions = {
  timeout?: number
}

/**
 * Generates a random string ID for request identification.
 * @returns A random string.
 */
export const randomId = () => Math.random().toString(36).substring(2, 15)

/** Prefix used for global handle variables in Photopea. */
const handlePrefix = "__ppHandle__"

/**
 * Communication channel for interacting with a PhotopeaPage instance.
 * Provides methods to evaluate scripts, manage handles, and access utilities.
 */
export class PhotopeaChannel {
  /** Default timeout (ms) for script evaluation. */
  public timeout: number = 30_000

  public readonly dialogMutex = new Mutex()

  /** @param page The PhotopeaPage instance to communicate with. */
  constructor(public readonly page: PhotopeaPage) {}

  private makeHandleVarsStatement(handleVars: Record<string, Handleable>) {
    const getExpression = (handleable: Handleable) => {
      if (typeof handleable === "string") {
        return this.getExpressionForHandle(handleable)
      } else if (handleable instanceof Contract) {
        return Contract.getExpression(handleable)
      } else {
        throw new Error(`Unsupported handleable type: ${typeof handleable}.`)
      }
    }

    return Object.entries(handleVars)
      .map(([key, value]) => `const ${key} = ` + getExpression(value) + ";")
      .join("")
  }

  private wrapIIFE(functionBody: string): string {
    return `(function () { ${functionBody} })();`
  }

  private prepareScript(
    requestId: string,
    functionBody: string,
    handleVars: HandleVars = {},
    options: EvaluateOptions = {}
  ) {
    const handleVarsStatement = this.makeHandleVarsStatement(handleVars)
    const resultVarName = `result_${requestId}`

    const evalStatement =
      `const ${resultVarName} = ` + this.wrapIIFE(functionBody)
    const respondStatement = `_pp_sendResponse("${requestId}", "result", ${resultVarName});`

    // banner is used to distinguish between blank done events and script output events
    const banner = 'app.echoToOE("Script started");'

    const script =
      banner + handleVarsStatement + evalStatement + respondStatement

    return script
  }

  async createResultWaiter(
    requestId: string,
    signal: AbortSignal,
    script: string
  ): Promise<any> {
    try {
      const result = await this.page.waitForEvent(
        "response",
        (_rid, reqType, data) => ({ reqType, data }),
        signal,
        (rid) => rid === requestId
      )

      if (result.reqType === "result") {
        return result.data
      } else {
        throw new PhotopeaChannelLogicError(
          `Unknown response type: ${result.reqType}`
        )
      }
    } catch (error) {
      throw new PhotopeaChannelScriptError(script, { cause: error })
    }
  }

  /**
   * Evaluates a script in the Photopea context and returns the result.
   * @param functionBody The JavaScript code to execute.
   * @param handleVars Optional mapping of variable names to handle IDs.
   * @param options Optional settings (e.g., hideBanner).
   * @returns Promise resolving to the result of the script.
   */
  async evaluate<T = any>(
    functionBody: string,
    handleVars: HandleVars = {},
    options: EvaluateOptions = {}
  ): Promise<T> {
    const requestId = randomId()
    const abort = new AbortController()

    const script = this.prepareScript(
      requestId,
      functionBody,
      handleVars,
      options
    )

    // TODO: Promise.all()

    // Wait for response
    const resultPromise = this.createResultWaiter(
      requestId,
      abort.signal,
      script
    ).then(
      (ok) => ({ type: "ok" as const, ok }),
      (error) => ({ type: "error" as const, error })
    )

    // Wait for console errors
    this.page
      .waitForEvent("pageerror", (v) => v, abort.signal)
      .then((msg) => {
        abort.abort(new PhotopeaChannelPageError(msg))
      })
      .catch((_) => {}) // Ignore timeout errors

    // Abort on timeout
    const timeout = options.timeout ?? this.timeout
    abortOnTimeout(
      abort,
      timeout,
      new PhotopeaChannelTimeoutError(
        `Script evaluation timed out (${timeout}ms)`
      )
    )

    try {
      await this.page.sendMessage(script)
      const result = await resultPromise

      if (result.type === "error") {
        throw result.error
      }

      return result.ok
    } catch (error) {
      throw new PhotopeaChannelEvalError(this, script, handleVars, {
        cause: error
      })
    } finally {
      abort.abort() // Clear other listeners
    }
  }

  /**
   * Evaluates a script and stores its result as a handle in the global scope.
   * @param functionBody The JavaScript code to execute.
   * @param handleVars Optional mapping of variable names to handle IDs.
   * @returns Promise resolving to the handle ID string.
   */
  async evaluateHandle(
    functionBody: string,
    handleVars: HandleVars = {},
    options?: EvaluateOptions
  ) {
    const handle = randomId()

    const result = await this.evaluate<"OK">(
      `
      const result = (function () {
        ${functionBody}
      })();

      globalThis["${handlePrefix + handle}"] = result;
      return "OK";
      `,
      handleVars,
      options
    )

    invariant(result === "OK", "Result should be either OK or an error")

    return handle
  }

  /**
   * Sends a value to the Photopea context and returns a handle for it.
   * @param value The value to send.
   * @returns Promise resolving to the handle ID string.
   */
  async createHandle(value: any) {
    const handle = randomId()

    await this.evaluate<void>(
      `globalThis["${handlePrefix + handle}"] = ${JSON.stringify(value)};`
    )

    return handle
  }

  /**
   * Retrieves the value of a handle from the Photopea context.
   * @param handle The handle ID string.
   * @returns Promise resolving to the value of the handle.
   */
  async getHandleValue<T = any>(handle: string) {
    return await this.evaluate<T>("return handleValue;", {
      handleValue: handle
    })
  }

  /**
   * Disposes of a handle in the Photopea context, freeing resources.
   * @param handle The handle ID string.
   * @returns Promise resolving to true if disposed, false otherwise.
   */
  async disposeHandle(handle: string) {
    const identifier = handlePrefix + handle
    const result = await this.evaluate<boolean>(`
      if (globalThis["${identifier}"] !== undefined) {
        globalThis["${identifier}"] = undefined;
        return true;
      } else {
        return false;
      }
    `)

    invariant(typeof result === "boolean", "Result should be a boolean")

    return result
  }

  /**
   * Creates a handle for a large big string value, splitting it into chunks.
   * This is useful for large data that exceeds the maximum size for playwright.
   * @param value The large string value to split into chunks.
   * @param signal Optional AbortSignal to cancel the operation.
   * @returns Promise resolving to a handle for the string.
   */
  async createHandleChunked(value: string, signal?: AbortSignal) {
    const chunkSize = 104_000_000
    const chunks = []

    for (let i = 0; i < value.length; i += chunkSize) {
      signal?.throwIfAborted()
      chunks.push(value.slice(i, i + chunkSize))
    }

    // Create a handle to accumulate the chunks
    const accHandle = await this.createHandle({ ref: "" })

    try {
      for (const i in chunks) {
        signal?.throwIfAborted()
        await this.evaluate<void>(`acc.ref += ${JSON.stringify(chunks[i])};`, {
          acc: accHandle
        })
      }

      const stringHandle = await this.evaluateHandle(`return acc.ref;`, {
        acc: accHandle
      })

      return stringHandle
    } finally {
      await this.disposeHandle(accHandle)
    }
  }

  public getExpressionForHandle(handle: string): string {
    return `globalThis["${handlePrefix + handle}"]`
  }

  async iterHandle(handle: string): Promise<string[]> {
    const expression = this.getExpressionForHandle(handle)
    const result = await this.evaluate<string[]>(`\
var handles = [];
for (var i = 0; i < ${expression}.length; i++) {
  var value = ${expression}[i];
  var handle = Math.random().toString(36).slice(2);
  globalThis["${handlePrefix}" + handle] = value;
  handles.push(handle);
}
return handles;\
`)
    invariant(Array.isArray(result), "Result should be an array of handles")
    return result
  }
}
