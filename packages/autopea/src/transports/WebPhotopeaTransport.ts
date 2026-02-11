import type { PhotopeaCapabilities } from "@/capabilities/PhotopeaCapabilities"
import type {
  PhotopeaTransport,
  PhotopeaTransportEventMap,
} from "./PhotopeaTransport"

export class WebPhotopeaTransport implements PhotopeaTransport {
  constructor(public contentWindow: Window) {}

  on<K extends keyof PhotopeaTransportEventMap>(
    _event: K,
    _handler: PhotopeaTransportEventMap[K],
  ): () => void {
    throw new Error("Method not implemented.")
  }

  sendMessage(_message: string): Promise<void> {
    throw new Error("Method not implemented.")
  }

  get capabilities(): PhotopeaCapabilities {
    throw new Error("Method not implemented.")
  }
}
