export const ProxyRecordsSymbol = Symbol("ProxyRecords")

const ignoredProperties = new Set([
  "constructor",
  "then",
  "catch",
  "finally",
  "toString",
  "valueOf",
])

export type ProxyPathPart = { get: string | number } | { call: any[] }

// The main type to mimic any interface T
export type HandleProxy<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => infer R
    ? (...args: P) => HandleProxy<R>
    : HandleProxy<T[K]>
} & {
  // Read out the recorded paths/calls
  get [ProxyRecordsSymbol](): ProxyPathPart[]
}

// Factory to create a proxy that records property/method accesses
export function createHandleProxy<T>(
  path: ProxyPathPart[] = []
): HandleProxy<T> {
  const handler: ProxyHandler<any> = {
    get(_target, prop, _receiver) {
      if (prop === ProxyRecordsSymbol) {
        return path // Return the recorded path
      }

      // Ignore certain properties
      if (typeof prop === "symbol" || ignoredProperties.has(prop)) {
        return undefined
      }

      // Return a proxy for any property access
      return createHandleProxy([...path, { get: prop }])
    },
    apply(_target, _thisArg, params) {
      return createHandleProxy([...path, { call: params }])
    },
  }

  // Need a dummy function to enable both property and method proxying
  const dummy: any = function () {}
  return new Proxy(dummy, handler) as HandleProxy<T>
}
