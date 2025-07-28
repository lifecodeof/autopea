import type { PhotopeaPage } from "@/PhotopeaPage"
import invariant from "tiny-invariant"
import { PhotopeaUtils } from "./PhotopeaUtils"
import { PhotopeaHandle } from "./ffi/base/PhotopeaHandle"
import { abortOnTimeout } from "./helpers"
import { PhotopeaFFI } from "./ffi/base/PhotopeaFFI"

export type Handleable<T = any> = PhotopeaHandle<T> | PhotopeaFFI | string
export type HandleVars = Record<string, Handleable>

/**
 * Generates a random string ID for request identification.
 * @returns A random string.
 */
export const randomId = () => Math.random().toString(36).substring(2, 15)

/** Prefix used for global handle variables in Photopea. */
const handlePrefix = "__ppHandle__"

/** Error class for wrapping errors from the Photopea channel. */
export class PhotopeaChannelError extends Error {
  constructor(
    public error: Error,
    public script: string,
    public throwedOnPage = false
  ) {
    super("Error while executing Photopea script")
  }

  static wrap = (script: string) => (error: any) => {
    if (error instanceof Error) return new PhotopeaChannelError(error, script)
    return new PhotopeaChannelError(new Error(String(error)), script)
  }

  static rethrow = (script: string) => (error: any) => {
    throw PhotopeaChannelError.wrap(script)(error)
  }
}

export type EvaluateOptions = {
  timeout?: number
}

/**
 * Communication channel for interacting with a PhotopeaPage instance.
 * Provides methods to evaluate scripts, manage handles, and access utilities.
 */
export class PhotopeaChannel {
  /** Default timeout (ms) for script evaluation. */
  public timeout: number = 5_000

  /** @param page The PhotopeaPage instance to communicate with. */
  constructor(public readonly page: PhotopeaPage) {}

  private makeHandleVarsStatement(handleVars: Record<string, Handleable>) {
    const getExpression = (handleable: Handleable) => {
      if (typeof handleable === "string") {
        return this.getExpressionForHandle(handleable)
      } else if (handleable instanceof PhotopeaHandle) {
        return this.getExpressionForHandle(handleable.handle)
      } else if (handleable instanceof PhotopeaFFI) {
        return PhotopeaFFI.getExpression(handleable)
      } else {
        throw new Error(`Unsupported handleable type: ${typeof handleable}.`)
      }
    }

    return Object.entries(handleVars)
      .map(([key, value]) => `const ${key} = ` + getExpression(value) + ";")
      .join()
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
  ): Promise<any | PhotopeaChannelError> {
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
        throw new Error(`Unknown response type: ${result.reqType}`)
      }
    } catch (errorOrString) {
      if (errorOrString instanceof PhotopeaChannelError) {
        throw errorOrString
      }

      const error =
        errorOrString instanceof Error
          ? errorOrString
          : new Error(String(errorOrString))
      return new PhotopeaChannelError(error, script)
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

    // Wait for response
    const resultPromise = this.createResultWaiter(
      requestId,
      abort.signal,
      script
    )

    // Wait for console errors
    this.page
      .waitForEvent("pageerror", (v) => v, abort.signal)
      .then((msg) => {
        abort.abort(new PhotopeaChannelError(msg, script, true))
      })
      .catch((_) => {}) // Ignore timeout errors

    // Abort on timeout
    abortOnTimeout(abort, options.timeout ?? this.timeout)

    try {
      await this.page.sendMessage(script)
      const result = await resultPromise

      if (result instanceof PhotopeaChannelError) {
        throw result
      }

      abort.abort() // Clear other listeners
      return result
    } catch (error) {
      throw error
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

  /** Provides utility methods for Photopea operations. */
  get utils() {
    return new PhotopeaUtils(this)
  }

  /** Returns a handle to the Photopea app object. */
  app() {
    return PhotopeaHandle.getApp(this)
  }

  /**
   * Creates a handle for a large big string value, splitting it into chunks.
   * This is useful for large data that exceeds the maximum size for playwright.
   * @param value The large string value to split into chunks.
   * @param signal Optional AbortSignal to cancel the operation.
   * @returns Promise resolving to a handle for the string.
   */
  async createChunkedHandle(value: string, signal?: AbortSignal) {
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
}
