import { Mutex } from "async-mutex"
import type { Page } from "playwright"

export class PhotopeaMutexes {
  private static readonly instanceMap = new WeakMap<Page, PhotopeaMutexes>()

  public readonly dialogMutex = new Mutex()
  public readonly downloadMutex = new Mutex()

  static of(page: Page) {
    let instance = this.instanceMap.get(page)
    if (!instance) {
      instance = new PhotopeaMutexes()
      this.instanceMap.set(page, instance)
    }
    return instance
  }
}
