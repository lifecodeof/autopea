import type { App } from "@/contracts/App"
import type { ArtLayer } from "@/contracts/ArtLayer"
import type { Contract } from "@/contracts/Contract"
import type { PDocument, SaveFormat } from "@/contracts/PDocument"
import { waitForEvent } from "@/helpers"
import { PhotopeaMutexes } from "@/PhotopeaMutexes"
import type { IframePhotopeaTransport } from "@/transports/IframePhotopeaTransport"
import type { PhotopeaCapabilities } from "./PhotopeaCapabilities"

export const createIframeCapabilities = (
  transport: IframePhotopeaTransport,
): PhotopeaCapabilities => {
  const capabilityError = new Error(
    "autopea does not capable of this action inside web environment. " +
      "See `autopea-playwright` package for playwright-based capabilities.",
  )

  return {
    getMutexes(this: Contract): PhotopeaMutexes {
      // contentWindow should allways be defined when we can use the app but
      // passing transport itself as reference won't hurt since it is also
      // same reference for null cases which is technically true
      return PhotopeaMutexes.of(transport.contentWindow ?? transport)
    },
    openSmartObject(this: ArtLayer): Promise<PDocument> {
      throw capabilityError
    },
    openFile(this: App, _path: string, _timeout?: number): Promise<PDocument> {
      throw capabilityError
    },
    uploadFonts(this: App, _fonts: Record<string, Uint8Array>): Promise<void> {
      throw capabilityError
    },
    pause(): Promise<void> {
      throw capabilityError
    },
    saveSmartObject(this: PDocument): Promise<void> {
      throw capabilityError
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
      throw capabilityError
    },
  }
}
