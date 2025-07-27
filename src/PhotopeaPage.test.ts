import { expect, vi } from "vitest"
import { PhotopeaPage } from "./PhotopeaPage"
import { browserTest } from "./testFixtures"

browserTest("should send and receive messages", async ({ browserCtx }) => {
  const page = await PhotopeaPage.openFromBrowser(browserCtx)

  // Listen for messages
  let receivedMessage: string | undefined
  page.on("message", (message) => {
    receivedMessage = message
  })

  // Send a message
  await page.sendMessage('app.echoToOE("Hello World");')

  // Wait for receiving the message
  await vi.waitUntil(() => receivedMessage !== undefined, {
    timeout: 500
  })

  // Check if the message was received correctly
  expect(receivedMessage).toBe("Hello World")
})
