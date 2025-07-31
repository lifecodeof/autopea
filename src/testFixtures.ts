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
      const browser = await chromium.launch({
        headless: false
      })

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
    const page = await PhotopeaPage.openFromBrowser(browserCtx)
    if (shared) page.setMaxListeners(0)
    await use(page)
    await page.close()
  }

export const pageTest = browserTest.extend<{
  page: PhotopeaPage
}>({
  page: pageFixture(false)
})

export const sharedPageTest = browserTest.extend<{
  sharedPage: PhotopeaPage
}>({
  sharedPage: [pageFixture(true), { scope: "worker" }]
})

export const channelTest = pageTest.extend<{
  channel: PhotopeaChannel
}>({
  channel: async ({ page, signal }, use) => {
    const channel = new PhotopeaChannel(page)
    channel.timeout = 0 // Disable timeout for tests
    await use(channel)
  }
})

export const sharedChannelTest = sharedPageTest.extend<{
  sharedChannel: PhotopeaChannel
}>({
  sharedChannel: [
    async ({ sharedPage, signal }, use) => {
      await use(new PhotopeaChannel(sharedPage))
    },
    { scope: "worker" }
  ]
})

expect.extend({ toMatchImageSnapshot })

export const ffiTest = channelTest.extend<{
  app: App
}>({
  app: async ({ channel }, use) => {
    const app = new App(channel, "app")
    await use(app)
  }
})
