import type { PhotopeaCapabilities } from "../capabilities/PhotopeaCapabilities"

export type PhotopeaTransportEventMap = {
  message: (message: string) => void
  pageerror: (error: Error) => void
  response: (url: string, method: string, data: unknown) => void
}

export type PhotopeaTransport = {
  on<K extends keyof PhotopeaTransportEventMap>(
    event: K,
    handler: PhotopeaTransportEventMap[K],
  ): () => void

  sendMessage(message: string): Promise<void>

  get capabilities(): PhotopeaCapabilities
}
