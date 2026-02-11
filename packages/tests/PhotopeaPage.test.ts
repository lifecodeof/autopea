import { expect, vi } from "vitest"
import { PhotopeaPage } from "@lifecodeof/autopea-pw"
import { browserTest } from "./testFixtures"

browserTest(
  "PhotopeaPage - should open Photopea page successfully",
  async ({ browserCtx }) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx)

    expect(page).toBeInstanceOf(PhotopeaPage)
    expect(page.page).toBeDefined()
    await page.close()
  }
)

browserTest(
  "PhotopeaPage - should send and receive messages",
  async ({ browserCtx }) => {
    await using page = await PhotopeaPage.openFromBrowser(browserCtx)

    let receivedMessage: string | undefined
    page.on("message", (message) => {
      receivedMessage = message
    })

    await page.sendMessage('app.echoToOE("Hello World");')

    await vi.waitUntil(() => receivedMessage !== undefined, { timeout: 5000 })

    expect(receivedMessage).toBe("Hello World")
  }
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
      timeout: 5000
    })

    expect(receivedError).toBeInstanceOf(Error)
    expect(receivedError!.message).toContain("Test error")
    await page.close()
  }
)

browserTest(
  "PhotopeaPage - should wait for blank done message",
  async ({ browserCtx }) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx)

    // Send a script that doesn't produce output
    await page.sendMessage('app.echoToOE("");')


    // Wait for the blank done message
    await new Promise<void>((resolve) => page.on("message", (message) => {
      if (message === "") {
        resolve()
      }
    }))

    await page.close()
  }
)

browserTest(
  "PhotopeaPage - should handle message buffering",
  async ({ browserCtx }) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx)

    const messages: string[] = []
    page.on("message", (message) => {
      messages.push(message)
    })

    // Send multiple parts that should be buffered
    await page.sendMessage('app.echoToOE("part1");')
    await page.sendMessage('app.echoToOE("part2");')

    await vi.waitUntil(() => messages.length >= 2, {
      timeout: 5000
    })

    expect(messages).toContain("part1")
    expect(messages).toContain("part2")
    await page.close()
  }
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
          const cleanup = page.on("message", ((message: string) => {
              if (message === `response${i}`) {
                results.push(message)
                cleanup()
                resolve()
              }
            }))
          page.sendMessage(`app.echoToOE("response${i}");`)
        })
      )
    }

    await Promise.all(promises)
    expect(results.sort()).toEqual([
      "response0",
      "response1",
      "response2",
      "response3",
      "response4"
    ])
    await page.close()
  }
)

browserTest(
  "PhotopeaPage - should handle multiple messages",
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
      timeout: 5000
    })

    expect(receivedMessages).toEqual(["First", "Second", "Third"])
    await page.close()
  }
)

browserTest(
  "PhotopeaPage - should handle empty messages",
  async ({ browserCtx }) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx)

    let receivedMessage: string | undefined
    page.on("message", (message) => {
      receivedMessage = message
    })

    // Send empty message
    await page.sendMessage('app.echoToOE("");')

    await vi.waitUntil(() => receivedMessage !== undefined, {
      timeout: 5000
    })

    expect(receivedMessage).toBe("")
    await page.close()
  }
)

browserTest(
  "PhotopeaPage - should handle special characters in messages",
  async ({ browserCtx }) => {
    const page = await PhotopeaPage.openFromBrowser(browserCtx)

    let receivedMessage: string | undefined
    page.on("message", (message) => {
      receivedMessage = message
    })

    const specialMessage = "Hello\n\tWorld\r\n\"quotes\"'single'"
    // Send message with special characters
    const jsonEncodedMessage = JSON.stringify(specialMessage)
    await page.sendMessage(`app.echoToOE(${jsonEncodedMessage});`)

    await vi.waitUntil(() => receivedMessage !== undefined, {
      timeout: 5000
    })

    expect(receivedMessage).toBe(specialMessage)
    await page.close()
  }
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
  }
)
