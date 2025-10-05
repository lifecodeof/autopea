import { toMatchImageSnapshot } from "jest-image-snapshot"
import { chromium, type BrowserContext } from "playwright"
import { expect, test } from "vitest"
import { App } from "./contracts/App"
import { PhotopeaChannel } from "./Channel"
import { PhotopeaPage } from "./PhotopeaPage"

export const browserTest = test.extend<{
  browserCtx: BrowserContext
}>({
  browserCtx: [
    async ({}, use) => {
      const browser = await chromium.launch({ headless: true })

      const context = await browser.newContext()
      await use(context)
      await browser.close()
    },
    { scope: "worker" }
  ]
})

const pageFixture =
  (shared: boolean) =>
  async ({ browserCtx }: any, use: any) => {
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

expect.extend({ toMatchImageSnapshot })

export const appTest = channelTest.extend<{
  app: App
}>({
  app: async ({ channel }, use) => {
    const app = new App(channel, "app")
    await use(app)
  }
})
