import { createNanoEvents } from "nanoevents"
import { createIframeCapabilities } from "@/capabilities/iframeCapabilities"
import type { PhotopeaCapabilities } from "@/capabilities/PhotopeaCapabilities"
import type {
  PhotopeaTransport,
  PhotopeaTransportEventMap,
} from "./PhotopeaTransport"

type EventMap = PhotopeaTransportEventMap & {
  message: (message: string) => void
}

export class IframePhotopeaTransport implements PhotopeaTransport {
  public readonly capabilities: PhotopeaCapabilities
  private readonly events = createNanoEvents<EventMap>()

  private _contentWindow: Window | null = null

  constructor() {
    this.setupListeners()
    this.capabilities = createIframeCapabilities(this)
  }

  on = <K extends keyof EventMap>(event: K, handler: EventMap[K]) => {
    return this.events.on(event, handler)
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.contentWindow) {
      throw new Error(
        "Content window is not set. Cannot send message to Photopea.",
      )
    }

    this.contentWindow.postMessage(message, "*")
  }

  get contentWindow() {
    return this._contentWindow
  }

  async setContentWindow(newWindow: Window | null) {
    this._contentWindow = newWindow
    if (!newWindow) return
    await this.waitForPhotopea()
    await this.setupForeignRealm()
  }

  private async waitForPhotopea() {
    for (let tries = 0; tries < 50; tries++) {
      const abort = new AbortController()
      const pingPongPromise = new Promise<boolean>((resolve) => {
        const cleanup = this.on("message", (message) => {
          if (message !== "ping-pong") return
          cleanup()
          resolve(true)
        })

        abort.signal.addEventListener("abort", () => {
          cleanup()
          resolve(false)
        })
      })

      await this.sendMessage('app.echoToOE("ping-pong")')
      await new Promise((resolve) => setTimeout(resolve, 100))

      abort.abort()

      const success = await pingPongPromise
      if (success) return
    }

    throw new Error(
      "Failed to set up communication with " +
        "Photopea iframe after multiple attempts.",
    )
  }

  private async setupForeignRealm() {
    // Expose a function to the Photopea iframe's realm
    // for sending responses back to this transport.
    const setupScript = `
      window._pp_sendResponse = function(requestId, reqType, data) {
        const message = JSON.stringify({ 
          messageType: "ift-response",
          requestId,
          reqType,
          data,
        });
        window.parent.postMessage(message, "*");
      }`
      // Remove newlines and extra whitespace
      .replace(/\n|\r/g, "")
      .replace(/\s+/g, " ")

    const wrappedScript = `
console.log("[IframePhotopeaTransport] Setting up foreign realm...");
window._init_ift = Object.getPrototypeOf(window).constructor.constructor('${setupScript}');
window._init_ift();
console.log("[IframePhotopeaTransport] Foreign realm setup complete.");`
    await this.sendMessage(wrappedScript)
  }

  private setupListeners() {
    let messageBuffer = ""

    window.addEventListener("message", ({ data, source }) => {
      if (source !== this.contentWindow) {
        console.warn(
          "[IframePhotopeaTransport] Received message from unknown source. Ignoring.",
        )
        return
      }

      if (typeof data !== "string") return // Can also be ArrayBuffer.

      let jsonData: Record<string, unknown> | undefined
      try {
        jsonData = JSON.parse(data)
      } catch {}

      if (jsonData?.messageType === "ift-response") {
        // Handle structured response messages
        const { requestId, reqType, data: responseData } = jsonData

        if (typeof requestId !== "string")
          throw new Error("Invalid requestId type in response")

        if (typeof reqType !== "string")
          throw new Error("Invalid reqType type in response")

        this.events.emit("response", requestId, reqType, responseData)
      } else {
        // Buffer messages until "done" is received
        if (data === "done") {
          if (messageBuffer.length <= 0) this.events.emit("blankMessage")
          this.events.emit("message", messageBuffer)
          messageBuffer = ""
        } else {
          messageBuffer += data
        }
      }
    })
  }
}
