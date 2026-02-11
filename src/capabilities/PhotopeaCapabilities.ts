import type { App } from "@/contracts/App"
import type { ArtLayer } from "@/contracts/ArtLayer"
import type { PDocument } from "@/contracts/PDocument"

export interface PhotopeaCapabilities {
  openSmartObject(this: ArtLayer): Promise<PDocument>
}
