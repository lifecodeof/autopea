import { PhotopeaPage, waitForEvent } from "autopea-playwright"
import { expect, vi } from "vitest"
import { browserTest } from "./testFixtures"

browserTest(
  "PhotopeaPage - should open Photopea page successfully",
  async ({ browserCtx }) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx)

    expect(page).toBeInstanceOf(PhotopeaPage)
    expect(page.page).toBeDefined()
    await page.close()
  },
)

browserTest.concurrent.for([
  { message: "Hello World" },
  { message: "" },
  { message: "Hello\n\tWorld\r\n\"quotes\"'single'" },
])(
  "PhotopeaPage - should echo messages %#",
  async ({ message }, { browserCtx }) => {
    await using page = await PhotopeaPage.openFromBrowser(browserCtx)

    let receivedMessage: string | undefined
    page.on("message", (msg) => {
      receivedMessage = msg
    })

    const jsonEncodedMessage = JSON.stringify(message)
    await page.sendMessage(`app.echoToOE(${jsonEncodedMessage});`)

    await vi.waitUntil(() => receivedMessage !== undefined, {
      timeout: 5000,
    })

    expect(receivedMessage).toBe(message)
  },
)

browserTest(
  "PhotopeaPage - should emit page errors",
  async ({ browserCtx }) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx)

    let receivedError: Error | undefined
    page.on("pageerror", (error) => {
      receivedError = error
    })

    // Trigger a page error
    await page.page.evaluate(() => {
      // Playwright captures errors inside page.evaluate() so we need to use setTimeout to throw indirectly
      setTimeout(() => {
        throw new Error("Test error")
      }, 1)
    })

    await vi.waitUntil(() => receivedError !== undefined, {
      timeout: 5000,
    })

    expect(receivedError).toBeInstanceOf(Error)
    expect(receivedError?.message).toContain("Test error")
    await page.close()
  },
)

browserTest(
  "PhotopeaPage - should wait for blank done message",
  async ({ browserCtx }) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx)
    const blankDonePromise = waitForEvent(page.on, {
      event: "blankMessage",
      signal: AbortSignal.timeout(5000),
    })

    // Send a script that doesn't produce output
    await page.sendMessage('app.echoToOE("");')

    // Wait for the blank done message
    await blankDonePromise

    await page.close()
  },
)

browserTest(
  "PhotopeaPage - should handle multiple messages in order",
  async ({ browserCtx }) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx)

    const receivedMessages: string[] = []
    page.on("message", (message) => {
      receivedMessages.push(message)
    })

    // Send multiple messages
    await page.sendMessage('app.echoToOE("First");')
    await page.sendMessage('app.echoToOE("Second");')
    await page.sendMessage('app.echoToOE("Third");')

    // Wait for all messages
    await vi.waitUntil(() => receivedMessages.length >= 3, {
      timeout: 5000,
    })

    expect(receivedMessages).toEqual(["First", "Second", "Third"])
    await page.close()
  },
)

browserTest(
  "PhotopeaPage - should handle concurrent operations",
  async ({ browserCtx }) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx)

    const results: string[] = []
    const promises: Promise<void>[] = []

    for (let i = 0; i < 5; i++) {
      promises.push(
        new Promise<void>((resolve) => {
          const cleanup = page.on("message", (message: string) => {
            if (message === `response${i}`) {
              results.push(message)
              cleanup()
              resolve()
            }
          })
          page.sendMessage(`app.echoToOE("response${i}");`)
        }),
      )
    }

    await Promise.all(promises)
    expect(results.sort()).toEqual([
      "response0",
      "response1",
      "response2",
      "response3",
      "response4",
    ])
    await page.close()
  },
)

browserTest(
  "PhotopeaPage - should close page properly",
  async ({ browserCtx }) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx)

    // Verify page is open
    expect(page.page.isClosed()).toBe(false)

    // Close the page
    await page.close()

    // Verify page is closed
    expect(page.page.isClosed()).toBe(true)
  },
)
