import { ArtLayers } from "./ArtLayer"
import { ContractCollection } from "./base/Contract"
import { Layer, Layers } from "./Layer"

export class LayerSet extends Layer {
  get artLayers() {
    return this.$(ArtLayers)`.artLayers`
  }

  get layerSets() {
    return this.$(LayerSets)`.layerSets`
  }

  get layers() {
    return this.$(Layers)`.layers`
  }

  override duplicate() {
    return this.$evalHandle(LayerSet)`.duplicate()`
  }
}

export class LayerSets extends ContractCollection<LayerSet> {
  protected itemType = () => LayerSet

  getByName(name: string) {
    return this.$(LayerSet)`.getByName(${name})`
  }
}
