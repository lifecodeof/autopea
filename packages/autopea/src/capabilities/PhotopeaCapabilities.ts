import type { App } from "@/contracts/App"
import type { ArtLayer } from "@/contracts/ArtLayer"
import type { Contract } from "@/contracts/base/Contract"
import type { PDocument } from "@/contracts/PDocument"
import type { PhotopeaMutexes } from "@/PhotopeaMutexes"

export interface PhotopeaCapabilities {
  getMutexes(this: Contract): PhotopeaMutexes
  openSmartObject(this: ArtLayer): Promise<PDocument>
  openFile(this: App, path: string, timeout?: number): Promise<PDocument>
  uploadFonts(this: App, fonts: Record<string, Buffer>): Promise<void>
  pause(this: App): Promise<void>
  saveSmartObject(this: PDocument): Promise<void>
  downloadDocument(this: PDocument, saveFormatCode: string): Promise<Uint8Array>
  duplicateDocument(this: PDocument): Promise<PDocument>
}
