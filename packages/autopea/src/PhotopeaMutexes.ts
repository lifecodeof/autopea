import { Mutex } from "async-mutex"
import type { Page } from "playwright"

export class PhotopeaMutexes {
  private static readonly instanceMap = new WeakMap<Page, PhotopeaMutexes>()

  /** For opening chrome native dialogs such as window.confirm() */
  public readonly dialogMutex = new Mutex()

  /** For downloading (required for assocating downloads to resources) */
  public readonly downloadMutex = new Mutex()

  /** For user interactions such as opening menus */
  public readonly interactionMutex = new Mutex()

  /** For opening docuements (required for timing issues) */
  public readonly documentMutex = new Mutex()

  static of(page: Page) {
    let instance = PhotopeaMutexes.instanceMap.get(page)
    if (!instance) {
      instance = new PhotopeaMutexes()
      PhotopeaMutexes.instanceMap.set(page, instance)
    }
    return instance
  }
}
