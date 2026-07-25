import type { App } from "@/contracts/App"
import type { ArtLayer } from "@/contracts/ArtLayer"
import type { Contract } from "@/contracts/Contract"
import type { PDocument, SaveFormat } from "@/contracts/PDocument"
import { waitForEvent } from "@/helpers"
import { PhotopeaMutexes } from "@/PhotopeaMutexes"
import type { IframePhotopeaTransport } from "@/transports/IframePhotopeaTransport"
import type { PhotopeaCapabilities } from "./PhotopeaCapabilities"

const DEFAULT_FILE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

export const createIframeCapabilities = (
  transport: IframePhotopeaTransport,
): PhotopeaCapabilities => {
  const newError = (action: string) =>
    new Error(
      `autopea is not capable of this action (${action}) inside web environment. ` +
        "See `autopea-playwright` package for playwright-based capabilities.",
    )

  return {
    getMutexes(this: Contract): PhotopeaMutexes {
      // contentWindow should always be defined when we can use the app but
      // passing transport itself as reference won't hurt since it is also
      // same reference for null cases which is technically true
      return PhotopeaMutexes.of(transport.contentWindow ?? transport)
    },
    openSmartObject(this: ArtLayer): Promise<PDocument> {
      throw newError("openSmartObject")
    },
    openFile(this: App, _path: string, _timeout?: number): Promise<PDocument> {
      throw newError("openFile")
    },
    openFromUrl(
      this: App,
      url: string,
      timeout = DEFAULT_FILE_TIMEOUT,
    ): Promise<PDocument> {
      return this.mutexes.documentMutex.runExclusive(async () => {
        await Promise.all([
          waitForEvent(transport.on, {
            signal: AbortSignal.timeout(timeout),
            event: "blankMessage",
          }),
          this.channel.evaluate<void>(`app.open(${JSON.stringify(url)});`),
        ])

        return this.activeDocument.$ref()
      })
    },
    openFromBuffer(
      this: App,
      buffer: ArrayBuffer,
      signal?: AbortSignal,
    ): Promise<PDocument> {
      return this.mutexes.documentMutex.runExclusive(async () => {
        await Promise.all([
          waitForEvent(transport.on, {
            signal: signal ?? AbortSignal.timeout(DEFAULT_FILE_TIMEOUT),
            event: "blankMessage",
          }),
          transport.sendMessage(buffer),
        ])

        return this.activeDocument.$ref()
      })
    },
    uploadFonts(this: App, _fonts: Record<string, Uint8Array>): Promise<void> {
      throw newError("uploadFonts")
    },
    pause(): Promise<void> {
      throw newError("pause")
    },
    saveSmartObject(this: PDocument): Promise<void> {
      throw newError("saveSmartObject")
    },
    async downloadDocument(
      this: PDocument,
      format: SaveFormat,
    ): Promise<Uint8Array> {
      const bufferPromise = waitForEvent(transport.on, {
        event: "buffer",
        signal: AbortSignal.timeout(60_000), // 1 minute
        selector: (buffer: Uint8Array) => buffer,
      })

      await this.saveToOE(format)

      return await bufferPromise
    },
    duplicateDocument(this: PDocument): Promise<PDocument> {
      throw newError("duplicateDocument")
    },
  }
}
