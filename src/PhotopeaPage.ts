import EventEmitter from "events"
import { type Browser, type BrowserContext, type Page } from "playwright"
import { waitForEvent } from "./helpers"
import { makeArrayBufferToBase64FnHandle } from "./playwrightLib"

type EventMap = {
  message: [string]
  bufferMessage: [Buffer]
  pageerror: [Error]
  response: [string, string, any]
}

/**
 * Represents a browser page running Photopea, providing event-driven communication and utility methods.
 * Extends EventEmitter to emit Photopea-specific events.
 */
export class PhotopeaPage extends EventEmitter<EventMap> {
  private messageBuffer: string = ""

  /**
   * @param page The Playwright Page instance.
   * @param iframeHandle The JSHandle for the Photopea iframe.
   */
  private constructor(public readonly page: Page) {
    super()
  }

  /**
   * Opens a new PhotopeaPage from a Playwright Browser or BrowserContext.
   * @param browserOrContext The Playwright Browser or BrowserContext.
   * @returns Promise resolving to a PhotopeaPage instance.
   */
  static async openFromBrowser(browserOrContext: Browser | BrowserContext) {
    return await PhotopeaPage.open(await browserOrContext.newPage())
  }

  /**
   * Opens a new PhotopeaPage from a Playwright Page.
   * @param page The Playwright Page instance.
   * @returns Promise resolving to a PhotopeaPage instance.
   */
  static async open(page: Page) {
    await this.openPhotopeaPage(page)
    const instance = new PhotopeaPage(page)
    await instance.listenEvents()
    return instance
  }

  private handleMessage(message: string, isBase64: boolean) {
    // Buffer messages until "done" is received
    if (message === "done") {
      this.emit("message", this.messageBuffer)
      this.messageBuffer = ""
    } else if (isBase64) {
      this.emit("bufferMessage", Buffer.from(message, "base64"))
    } else {
      this.messageBuffer += message
    }
  }

  private static async openPhotopeaPage(page: Page) {
    // Filter out unwanted scripts
    await page.route("**/*", (route) => {
      const request = route.request()
      if (
        request.resourceType() === "script" &&
        !/^https:\/\/vecpea\.com\/code\//.test(request.url())
      ) {
        // Block disallowed scripts
        route.abort()
      } else {
        route.continue()
      }
    })

    const toBase64Handle = await makeArrayBufferToBase64FnHandle(page)

    await page.addInitScript((toBase64) => {
      const pageWindow = window as any
      pageWindow.__name = (fn: Function) => fn
      pageWindow.isFirstDoneFired = false
      pageWindow.showOpenFilePicker = undefined // Disable file access API

      function listener(event: MessageEvent): void {
        if (event.origin === "https://www.photopea.com") {
          if (event.data === "done") {
            pageWindow.isFirstDoneFired = true
          }

          if (pageWindow.onPhotopeaMessage) {
            let data = event.data
            const isBase64 = data instanceof ArrayBuffer
            if (isBase64) {
              data = toBase64(data)
            }

            pageWindow.onPhotopeaMessage(data, isBase64)
          }
        }
      }

      // Temp compatibility for old iframe solution
      // window.addEventListener("message", listener)

      // Mock parent.postMessage for echoToOE() and saveToOE()
      // Photopea checks window === window.parent
      pageWindow.parent = {
        postMessage(msg: string, _targetOrigin: string) {
          listener(
            new MessageEvent("message", {
              origin: "https://www.photopea.com",
              data: msg
            })
          )
        }
      }

      // Skip landing page
      localStorage.setItem("_ppp", '{"capShown":"false"}')
    }, toBase64Handle)

    await toBase64Handle.dispose()

    // Somehow, #8887 removes ads
    await page.goto("https://www.photopea.com#8887", { timeout: 30_000 })

    // Wait for the first "done" message
    await page.waitForFunction(() => (window as any).isFirstDoneFired, {
      timeout: 500
    })
  }

  private async listenEvents() {
    // Expose a function to get sent messages from Photopea
    await this.page.exposeFunction(
      "onPhotopeaMessage",
      this.handleMessage.bind(this)
    )

    // This function is used in PhotopeaChannel.evaluate()
    await this.page.exposeFunction(
      "_pp_sendResponse",
      (id: string, reqType: string, data: any) => {
        if (typeof id !== "string") return
        if (typeof reqType !== "string") return
        this.emit("response", id, reqType, data)
      }
    )

    this.page.on("console", (msg) => {
      if (msg.text() !== "Failed to load resource: net::ERR_FAILED") return
      if (msg.type() === "error" || msg.text().includes("Error")) {
        this.emit("pageerror", new Error(msg.text()))
      }
    })

    this.page.on("pageerror", (msg) => {
      this.emit("pageerror", msg)
    })
  }

  /**
   * Closes the underlying Playwright page.
   * @returns Promise that resolves when the page is closed.
   */
  close() {
    return this.page.close()
  }

  /**
   * Sends a message to the Photopea iframe.
   * @param message The message string to send.
   * @returns Promise that resolves when the message is sent.
   */
  sendMessage(message: string) {
    return this.page.evaluate((msg) => {
      window.postMessage(msg, "https://www.photopea.com")
    }, message)
  }

  /**
   * Waits for a blank "done" message from Photopea, with optional abort signal.
   * @param signal Optional AbortSignal to cancel waiting.
   * @returns Promise that resolves when the blank message is received.
   */
  waitForBlankDone(signal?: AbortSignal) {
    return this.waitForEvent(
      "message",
      (_) => {},
      signal,
      (message) => message === ""
    )
  }

  /**
   * Waits for a buffer message from Photopea, with optional abort signal.
   * @param signal Optional AbortSignal to cancel waiting.
   * @returns Promise that resolves to the received Buffer.
   */
  waitForBufferMessage(signal?: AbortSignal) {
    return this.waitForEvent("bufferMessage", (buffer) => buffer, signal)
  }

  /**
   * Waits for a specific event on this PhotopeaPage.
   * @param event The event name to wait for.
   * @param selector Function to select the result from the event arguments.
   * @param signal Optional AbortSignal to cancel waiting.
   * @param predicate Optional function to filter event arguments.
   * @returns Promise resolving to the selected result.
   */
  async waitForEvent<T>(
    event: keyof EventMap,
    selector: (...args: any[]) => T,
    signal?: AbortSignal,
    predicate?: (...args: any[]) => boolean
  ): Promise<T> {
    return await waitForEvent(this, event, selector, signal, predicate)
  }

  [Symbol.asyncDispose]() {
    return this.close()
  }
}
