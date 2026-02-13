import { PhotopeaChannel } from "@lifecodeof/autopea"
import { App } from "@lifecodeof/autopea/contracts/App"
import { PhotopeaPage } from "@lifecodeof/autopea-pw"
import { type BrowserContext, chromium } from "playwright"
import { test } from "vitest"

export const browserTest = test.extend<{
  browserCtx: BrowserContext
}>({
  browserCtx: [
    // biome-ignore lint/correctness/noEmptyPattern: vitest requires destruction
    async ({}, use) => {
      const browser = await chromium.launch({ headless: !process.env.PW_SHOW })

      const context = await browser.newContext()
      await use(context)
      await browser.close()
    },
    { scope: "worker" },
  ],
})

const pageFixture =
  (_shared: boolean) =>
  async (
    { browserCtx }: { browserCtx: BrowserContext },
    use: (page: PhotopeaPage) => Promise<void>,
  ) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx, {
      timeout: 60_000,
    })
    await use(page)
    await page.close()
  }

export const pageTest = browserTest.extend<{
  page: PhotopeaPage
}>({
  page: pageFixture(false),
})

export const channelTest = pageTest.extend<{
  channel: PhotopeaChannel
}>({
  channel: async ({ page }, use) => {
    await use(new PhotopeaChannel(page))
  },
})

export const appTest = channelTest.extend<{
  app: App
}>({
  app: async ({ channel }, use) => {
    const app = new App(channel, "app")
    await use(app)
  },
})
