import { PhotopeaFFI } from "./base/PhotopeaFFI"
import { ArtLayer, ArtLayers } from "./ArtLayer"

export class PDocument extends PhotopeaFFI {
  get artLayers() {
    return this.$(ArtLayers)`.artLayers`
  }

  get activeLayer() {
    return this.$(ArtLayer)`.activeLayer`
  }

  trim() {
    return this.$eval()`.trim()`
  }

  get width() {
    return this.$value(this.z.number())`.width`
  }

  get height() {
    return this.$value(this.z.number())`.height`
  }
}
