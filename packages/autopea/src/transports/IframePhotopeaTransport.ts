import { createNanoEvents } from "nanoevents"
import { createIframeCapabilities } from "@/capabilities/iframeCapabilities"
import type { PhotopeaCapabilities } from "@/capabilities/PhotopeaCapabilities"
import type {
  PhotopeaTransport,
  PhotopeaTransportEventMap,
} from "./PhotopeaTransport"

type EventMap = PhotopeaTransportEventMap & {
  message: (message: string) => void
  buffer: (buffer: Uint8Array) => void
}

export class IframePhotopeaTransport implements PhotopeaTransport {
  public readonly capabilities: PhotopeaCapabilities
  private readonly events = createNanoEvents<EventMap>()
  private readonly privateEvents = createNanoEvents<{
    newContentWindow: (contentWindow: Window) => void
  }>()

  private static setupPromises = new WeakMap<Window, Promise<void>>()

  private _contentWindow: Window | null = null

  constructor() {
    this.setupListeners()
    this.capabilities = createIframeCapabilities(this)
  }

  on = <K extends keyof EventMap>(event: K, handler: EventMap[K]) => {
    return this.events.on(event, handler)
  }

  private waitForSetup(contentWindow: Window | null): Promise<Window> {
    if (!contentWindow || contentWindow.closed) {
      const newWindowPromise = new Promise<Window>((resolve) => {
        const cleanup = this.privateEvents.on(
          "newContentWindow",
          (newWindow) => {
            resolve(newWindow)
            cleanup()
          },
        )
      })

      return newWindowPromise.then((w) => this.waitForSetup(w))
    }

    const setupPromise =
      IframePhotopeaTransport.setupPromises.get(contentWindow)

    if (setupPromise) return setupPromise.then(() => contentWindow)

    const newSetupPromise = setupContentWindow(contentWindow)
    IframePhotopeaTransport.setupPromises.set(contentWindow, newSetupPromise)
    return newSetupPromise.then(() => contentWindow)
  }

  async sendMessage(message: string): Promise<void> {
    const contentWindow = await this.waitForSetup(this.contentWindow)
    contentWindow.postMessage(message, "*")
  }

  get contentWindow() {
    return this._contentWindow
  }

  // For compatibility with older API. Planned to be removed in the future.
  async setContentWindow(newWindow: Window | null) {
    this._contentWindow = newWindow
    if (newWindow) this.privateEvents.emit("newContentWindow", newWindow)
  }

  private setupListeners() {
    window.addEventListener(
      "message",
      createListener({
        predicate: ({ source }) => source === this.contentWindow,
        onMessage: (message) => {
          if (message.length <= 0) this.events.emit("blankMessage")
          this.events.emit("message", message)
        },
        onBuffer: (buffer) => this.events.emit("buffer", buffer),
        onResponse: (...args) => this.events.emit("response", ...args),
      }),
    )
  }
}

const setupContentWindow = async (contentWindow: Window) => {
  // Wait for photopea to initialize its message listener
  for (let tries = 0; tries < 30; tries++) {
    const abort = AbortSignal.timeout(1_000)
    const pingPongPromise = waitForMessage(
      contentWindow,
      (message) => message === "ping-pong",
      abort,
    )

    contentWindow.postMessage('app.echoToOE("ping-pong")', "*")

    try {
      await pingPongPromise
      break
    } catch (e) {
      if (e instanceof DOMException && e.name === "TimeoutError") {
        continue
      }

      throw e
    }
  }

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

  const wrappedScript = `\
window._init_ift = Object.getPrototypeOf(window).constructor.constructor('${setupScript}');
window._init_ift();`

  contentWindow.postMessage(wrappedScript, "*")
}

const waitForMessage = (
  targetWindow: Window,
  predicate: (message: string) => boolean,
  signal?: AbortSignal,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const handler = createListener({
      predicate: ({ source }) => source === targetWindow,
      onMessage: (message) => {
        if (predicate(message)) {
          window.removeEventListener("message", handler)
          resolve(message)
        }
      },
    })

    window.addEventListener("message", handler)

    signal?.addEventListener("abort", () => {
      window.removeEventListener("message", handler)
      reject(signal.reason)
    })
  })
}

const createListener = ({
  onMessage,
  onResponse,
  onBuffer,
  predicate,
}: {
  onMessage?: (message: string) => void
  onResponse?: (requestId: string, reqType: string, data: unknown) => void
  onBuffer?: (buffer: Uint8Array) => void
  predicate?: (event: MessageEvent) => boolean
}) => {
  let messageBuffer = ""

  return (event: MessageEvent) => {
    if (predicate && !predicate(event)) return
    const { data } = event

    if (data instanceof ArrayBuffer) {
      onBuffer?.(new Uint8Array(data))
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

      onResponse?.(requestId, reqType, responseData)
    } else {
      // Buffer messages until "done" is received
      if (data === "done") {
        onMessage?.(messageBuffer)
        messageBuffer = ""
      } else {
        messageBuffer += data
      }
    }
  }
}
