import { chromium, type BrowserContext } from "playwright"
import { test } from "vitest"
import { App } from "./contracts/App"
import { PhotopeaChannel } from "./Channel"
import { PhotopeaPage } from "./PhotopeaPage"

export const browserTest = test.extend<{
  browserCtx: BrowserContext
}>({
  browserCtx: [
    async (_, use) => {
      const browser = await chromium.launch({ headless: !true })

      const context = await browser.newContext()
      await use(context)
      await browser.close()
    },
    { scope: "worker" }
  ]
})

const pageFixture =
  (shared: boolean) =>
  async (
    { browserCtx }: { browserCtx: BrowserContext },
    use: (page: PhotopeaPage) => Promise<void>
  ) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx, {
      timeout: 60_000
    })
    if (shared) page.setMaxListeners(0)
    await use(page)
    await page.close()
  }

export const pageTest = browserTest.extend<{
  page: PhotopeaPage
}>({
  page: pageFixture(false)
})

export const channelTest = pageTest.extend<{
  channel: PhotopeaChannel
}>({
  channel: async ({ page }, use) => {
    await use(new PhotopeaChannel(page))
  }
})

export const appTest = channelTest.extend<{
  app: App
}>({
  app: async ({ channel }, use) => {
    const app = new App(channel, "app")
    await use(app)
  }
})
