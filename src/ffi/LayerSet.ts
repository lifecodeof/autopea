import { ArtLayers } from "./ArtLayer"
import { FFICollection, PhotopeaFFI } from "./base/PhotopeaFFI"

export class LayerSet extends PhotopeaFFI {
  get artLayers() {
    return this.$(ArtLayers)`.artLayers`
  }

  get layerSets() {
    return this.$(LayerSets)`.layerSets`
  }

  duplicate() {
    return this.$evalHandle(LayerSet)`.duplicate()`
  }
}

export class LayerSets extends FFICollection<LayerSet> {
  protected itemType = () => LayerSet
}
