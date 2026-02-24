export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`)
  }
}

export const abortOnTimeout = (
  abortController: AbortController,
  timeout: number,
  error: Error,
) => {
  if (timeout <= 0) timeout = 1 // Ensure at least 1ms timeout

  const timeoutId = setTimeout(() => {
    if (!abortController.signal.aborted) {
      abortController.abort(error)
    }
  }, timeout)

  const abortListener = () => {
    clearTimeout(timeoutId)
  }

  abortController.signal.addEventListener("abort", abortListener)

  return () => {
    clearTimeout(timeoutId)
    abortController.signal.removeEventListener("abort", abortListener)
  }
}

export async function waitForEvent<
  TReturn,
  TEvent extends string,
  TEventArgs extends unknown[],
>(
  onFn: (event: TEvent, handler: (...args: TEventArgs) => void) => () => void,
  {
    event,
    selector = (...args) => args as unknown as TReturn,
    signal,
    predicate,
  }: {
    event: TEvent
    selector?: (...args: TEventArgs) => TReturn
    signal?: AbortSignal
    predicate?: (...args: TEventArgs) => boolean
  },
): Promise<TReturn> {
  return new Promise((resolve, reject) => {
    const abortHandler = () => {
      cleanup()
      signal?.removeEventListener("abort", abortHandler)
      reject(new Error("Aborted"))
    }

    const cleanup = onFn(event, (...args: TEventArgs) => {
      // Check predicate if provided
      if (predicate && !predicate(...args)) {
        return
      }

      // Cleanup listeners
      cleanup()
      signal?.removeEventListener("abort", abortHandler)

      // Resolve with selector result OR the raw arguments if no selector exists
      if (selector) {
        resolve(selector(...args))
      } else {
        // Type cast is necessary here because T defaults to Parameters<F>
        resolve(args as unknown as TReturn)
      }
    })

    if (signal) {
      if (signal.aborted) return abortHandler()
      signal.addEventListener("abort", abortHandler)
    }
  })
}

export function invariant(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}
