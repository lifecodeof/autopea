import { EventEmitter } from "events"

export const timeoutAbortSignal = (timeout: number): AbortSignal => {
  const controller = new AbortController()
  setTimeout(
    () => controller.abort(new Error(`Operation timed out after ${timeout}ms`)),
    timeout
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
  timeout: number
) => {
  if (timeout > 0) {
    const timeoutId = setTimeout(() => {
      if (!abortController.signal.aborted) {
        abortController.abort(new TimeoutError(timeout))
      }
    }, timeout)

    abortController.signal.addEventListener("abort", () => {
      clearTimeout(timeoutId)
    })
  }
}

// Got from built-in Node.js EventEmitter
type DefaultEventMap = [never]
type Listener<K, T, F> = T extends DefaultEventMap
  ? F
  : K extends keyof T
  ? T[K] extends unknown[]
    ? (...args: T[K]) => void
    : never
  : never
type Key<K, T> = T extends DefaultEventMap ? string | symbol : K | keyof T
type Listener1<K, T> = Listener<K, T, (...args: any[]) => void>

export const waitForEvent = async <
  T,
  Event,
  EventMap extends Record<string, any[]> | DefaultEventMap
>(
  emitter: EventEmitter<EventMap>,
  event: Key<Event, EventMap>,
  selector: (...eventArgs: Parameters<Listener1<Event, EventMap>>) => T,
  signal?: AbortSignal,
  predicate?: (...eventArgs: Parameters<Listener1<Event, EventMap>>) => boolean
) => {
  return await new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      emitter.off(event, listener)
      signal?.removeEventListener("abort", abortListener)
    }

    // @ts-expect-error
    const listener: Listener1<Event, EventMap> = (...params) => {
      // @ts-expect-error
      if (predicate ? predicate(...params) : true) {
        cleanup()
        // @ts-expect-error
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
