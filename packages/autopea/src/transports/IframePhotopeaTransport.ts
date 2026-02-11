import { createNanoEvents } from "nanoevents"
import { createIframeCapabilities } from "@/capabilities/iframeCapabilities"
import type {
  PhotopeaTransport,
  PhotopeaTransportEventMap,
} from "./PhotopeaTransport"

type EventMap = PhotopeaTransportEventMap & {
  message: (message: string) => void
}

export class IframePhotopeaTransport implements PhotopeaTransport {
  public readonly capabilities = createIframeCapabilities()
  private readonly events = createNanoEvents<EventMap>()

  constructor(public contentWindow: Window) {
    this.setupListeners()
  }

  on<K extends keyof EventMap>(event: K, handler: EventMap[K]): () => void {
    return this.events.on(event, handler)
  }

  async sendMessage(message: string): Promise<void> {
    this.contentWindow.postMessage(message, "*")
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

      // Buffer messages until "done" is received
      if (data === "done") {
        if (messageBuffer.length <= 0) this.events.emit("blankMessage")
        this.events.emit("message", messageBuffer)
        messageBuffer = ""
      } else {
        messageBuffer += data
      }
    })
  }
}
