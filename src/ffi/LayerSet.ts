import { PhotopeaFFI, FFICollection } from "./base/PhotopeaFFI"
import { ArtLayers } from "./ArtLayer"

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
  protected _itemType() {
    return LayerSet
  }
}
