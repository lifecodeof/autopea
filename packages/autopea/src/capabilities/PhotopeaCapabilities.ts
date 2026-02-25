import type { App } from "@/contracts/App"
import type { ArtLayer } from "@/contracts/ArtLayer"
import type { Contract } from "@/contracts/Contract"
import type { PDocument, SaveFormat } from "@/contracts/PDocument"
import type { PhotopeaMutexes } from "@/PhotopeaMutexes"

export interface PhotopeaCapabilities {
  getMutexes(this: Contract): PhotopeaMutexes
  openSmartObject(this: ArtLayer): Promise<PDocument>
  openFile(this: App, path: string, timeout?: number): Promise<PDocument>
  uploadFonts(this: App, fonts: Record<string, Uint8Array>): Promise<void>
  pause(): Promise<void>
  saveSmartObject(this: PDocument): Promise<void>
  downloadDocument(this: PDocument, format: SaveFormat): Promise<Uint8Array>
  duplicateDocument(this: PDocument): Promise<PDocument>
}
