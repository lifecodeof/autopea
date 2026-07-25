import { Mutex } from "async-mutex"

/**
 * Named mutexes for coordinating concurrent Photopea operations.
 *
 * Lock ordering (acquire in this order to prevent deadlocks):
 *   dialogMutex → downloadMutex → interactionMutex → documentMutex
 *
 * If two locks are needed simultaneously, always acquire the outer one first.
 * `async-mutex` Mutex is reentrant within the same async context, so nested
 * `runExclusive` calls on the same mutex will not deadlock.
 */
export class PhotopeaMutexes {
  private static readonly instanceMap = new WeakMap<object, PhotopeaMutexes>()

  /** For opening chrome native dialogs such as window.confirm() */
  public readonly dialogMutex = new Mutex()

  /** For downloading (required for associating downloads to resources) */
  public readonly downloadMutex = new Mutex()

  /** For user interactions such as opening menus */
  public readonly interactionMutex = new Mutex()

  /** For opening documents (required for timing issues) */
  public readonly documentMutex = new Mutex()

  static of(referenceObject: object) {
    let instance = PhotopeaMutexes.instanceMap.get(referenceObject)
    if (!instance) {
      instance = new PhotopeaMutexes()
      PhotopeaMutexes.instanceMap.set(referenceObject, instance)
    }
    return instance
  }
}
