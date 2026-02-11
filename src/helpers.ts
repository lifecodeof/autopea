import type { EventEmitter } from "node:events"

export const timeoutAbortSignal = (timeout: number): AbortSignal => {
  const controller = new AbortController()
  setTimeout(
    () => controller.abort(new Error(`Operation timed out after ${timeout}ms`)),
    timeout,
  )
  return controller.signal
}

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

export const waitForEvent = async <T, EE extends EventEmitter>(
  emitter: EE,
  event: Parameters<EE["on"]>[0],
  selector: (...args: unknown[]) => T,
  signal?: AbortSignal,
  predicate?: (...args: unknown[]) => boolean,
) => {
  return await new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      emitter.off(event, listener)
      signal?.removeEventListener("abort", abortListener)
    }

    const listener = (...params: unknown[]) => {
      let passed = false

      try {
        passed = predicate ? predicate(...params) : true
      } catch {}

      if (passed) {
        cleanup()
        resolve(selector(...params))
      }
    }

    const abortListener = () => {
      cleanup()
      reject(signal?.reason)
    }

    emitter.on(event, listener)
    signal?.addEventListener("abort", abortListener)
  })
}
