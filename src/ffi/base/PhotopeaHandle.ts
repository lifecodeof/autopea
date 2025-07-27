import { PP } from "@/PhotopeaTypes"
import {
  randomId,
  type EvaluateOptions,
  type PhotopeaChannel
} from "@/PhotopeaChannel"
import {
  createHandleProxy,
  ProxyRecordsSymbol,
  type ProxyPathPart,
  type HandleProxy
} from "./HandleProxy"
import invariant from "tiny-invariant"

type ProxyPathPartWithSet = ProxyPathPart | { set: any }

/**
 * Represents a handle to a Photopea object, allowing remote property access and method calls.
 * Provides proxy-based evaluation and handle management.
 * @template T The type of the object this handle represents.
 */
export class PhotopeaHandle<T> {
  /**
   * @param channel The PhotopeaChannel instance for communication.
   * @param handle The unique handle ID for the Photopea object.
   */
  constructor(
    protected readonly channel: PhotopeaChannel,
    public readonly handle: string
  ) {}

  /**
   * Gets a handle to the Photopea app object.
   * @param channel The PhotopeaChannel instance.
   * @returns Promise resolving to a PhotopeaHandle for the app.
   */
  static async getApp(channel: PhotopeaChannel) {
    const appHandle = await channel.evaluateHandle("return app;")
    return new PhotopeaHandle<PP.Application>(channel, appHandle)
  }

  /**
   * Disposes of the handle in the Photopea context.
   * @returns Promise resolving to true if disposed, false otherwise.
   */
  dispose() {
    return this.channel.disposeHandle(this.handle)
  }

  /**
   * Asynchronous disposal for use with Symbol.asyncDispose.
   * @returns Promise resolving to the result of dispose().
   */
  [Symbol.asyncDispose]() {
    return this.dispose()
  }

  /**
   * Sets a property or value on the remote Photopea object using a proxy path.
   * @param fn Function that selects the property to set using a proxy.
   * @param value The value to set.
   * @returns Promise resolving when the set operation is complete.
   */
  async $set(
    fn: (proxy: HandleProxy<T>) => HandleProxy<unknown>,
    value: any
  ): Promise<void> {
    const proxy = createHandleProxy<T>()
    const result = fn(proxy)

    const records = result[ProxyRecordsSymbol]
    invariant(records, "Expected a proxy")
    const [code, handleVars] = await this.proxyPathToCode([
      ...records,
      { set: value }
    ])

    return await this.channel.evaluate<void>(code, handleVars)
  }

  /**
   * Evaluates a property or method on the remote Photopea object using a proxy path.
   * @param fn Function that selects the property or method using a proxy.
   * @param options
   * @returns Promise resolving to the result of the evaluation.
   */
  async $eval<R>(
    fn: (proxy: HandleProxy<T>) => HandleProxy<R>,
    options?: EvaluateOptions
  ): Promise<R> {
    const proxy = createHandleProxy<T>()
    const result = fn(proxy)
    const records = result[ProxyRecordsSymbol]
    invariant(records, "Expected a proxy")
    const [code, handleVars] = await this.proxyPathToCode(records)

    return await this.channel.evaluate<R>(code, handleVars, options)
  }

  /**
   * Evaluates a property or method and returns a new PhotopeaHandle for the result.
   * @param fn Function that selects the property or method using a proxy.
   * @param options
   * @returns Promise resolving to a PhotopeaHandle for the result.
   */
  async $evalHandle<R>(
    fn: (proxy: HandleProxy<T>) => HandleProxy<R>,
    options?: EvaluateOptions
  ): Promise<PhotopeaHandle<R>> {
    const proxy = createHandleProxy<T>()
    const result = fn(proxy)
    const records = result[ProxyRecordsSymbol]
    invariant(records, "Expected a proxy")
    const [code, handleVars] = await this.proxyPathToCode(records)
    const handle = await this.channel.evaluateHandle(code, handleVars, options)

    return new PhotopeaHandle<R>(this.channel, handle)
  }

  private async proxyPathToCode(proxyPath: ProxyPathPartWithSet[]) {
    const isValidIdentifier = (value: any) =>
      typeof value === "string" && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value)
    const isNumeric = (value: any) =>
      typeof value === "number" ||
      (typeof value === "string" && !isNaN(Number(value)))

    const handleVars: Record<string, string> = { $self: this.handle }

    const transfer = (value: any) => {
      if (value instanceof PhotopeaHandle) {
        const handleVar = "h_" + randomId()
        handleVars[handleVar] = value.handle
        return handleVar
      } else {
        return JSON.stringify(value)
      }
    }

    const code = proxyPath.reduce((acc, segment) => {
      if ("get" in segment) {
        let get = segment.get
        if (isNumeric(get)) get = Number(get)

        if (isValidIdentifier(get)) {
          return `${acc}.${get}`
        } else {
          return `${acc}[${transfer(get)}]`
        }
      } else if ("call" in segment) {
        return `${acc}(${segment.call.map(transfer).join(", ")})`
      } else {
        return `${acc} = ${transfer(segment.set)}`
      }
    }, "return $self")

    return [code + ";", handleVars] as const
  }

  async $value(): Promise<T> {
    return this.channel.getHandleValue<T>(this.handle)
  }
}
