import { ArtLayers } from "./ArtLayer"
import { FFICollection } from "./base/PhotopeaFFI"
import { Layer } from "./Layer"

export class LayerSet extends Layer {
  get artLayers() {
    return this.$(ArtLayers)`.artLayers`
  }

  get layerSets() {
    return this.$(LayerSets)`.layerSets`
  }

  override duplicate() {
    return this.$evalHandle(LayerSet)`.duplicate()`
  }
}

export class LayerSets extends FFICollection<LayerSet> {
  protected itemType = () => LayerSet

  getByName(name: string) {
    return this.$(LayerSet)`.getByName(${name})`
  }
}
