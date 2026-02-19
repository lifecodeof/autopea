import type { App } from "@/contracts/App"
import type { ArtLayer } from "@/contracts/ArtLayer"
import type { Contract } from "@/contracts/Contract"
import type { PDocument } from "@/contracts/PDocument"
import { PhotopeaMutexes } from "@/PhotopeaMutexes"
import type { IframePhotopeaTransport } from "@/transports/IframePhotopeaTransport"
import type { PhotopeaCapabilities } from "./PhotopeaCapabilities"

export const createIframeCapabilities = (
  transport: IframePhotopeaTransport,
): PhotopeaCapabilities => {
  const capabilityError = new Error(
    "autopea does not capable of this action inside web environment. " +
      "See `@lifecodeof/autopea-pw` package for playwright-based capabilities.",
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
    uploadFonts(this: App, _fonts: Record<string, Buffer>): Promise<void> {
      throw capabilityError
    },
    pause(): Promise<void> {
      throw capabilityError
    },
    saveSmartObject(this: PDocument): Promise<void> {
      throw capabilityError
    },
    downloadDocument(
      this: PDocument,
      _saveFormatCode: string,
    ): Promise<Uint8Array> {
      throw capabilityError
    },
    duplicateDocument(this: PDocument): Promise<PDocument> {
      throw capabilityError
    },
  }
}
