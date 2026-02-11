import type { PhotopeaCapabilities } from "../capabilities/PhotopeaCapabilities"

type EventMap = {
  message: (message: string) => void
  bufferMessage: (buffer: Buffer) => void
  pageerror: (error: Error) => void
  response: (url: string, method: string, data: unknown) => void
}

export type PhotopeaTransport = {
  on<K extends keyof EventMap>(event: K, handler: EventMap[K]): () => void

  sendMessage(message: string): Promise<void>

  get capabilities(): PhotopeaCapabilities
}
