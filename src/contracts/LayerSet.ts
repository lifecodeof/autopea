import { ArtLayers } from "./ArtLayer"
import { ContractCollection } from "./base/Contract"
import { Layer, Layers } from "./Layer"
import { UnitRectLocal } from "./UnitRect"

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

  override async fetchBounds(): Promise<UnitRectLocal> {
    const bounds = new UnitRectLocal()

    const childBounds = (
      await Promise.all([
        this.artLayers
          .toArray()
          .then((layers) =>
            Promise.all(layers.map((layer) => layer.fetchBounds()))
          ),
        this.layerSets
          .toArray()
          .then((sets) => Promise.all(sets.map((set) => set.fetchBounds())))
      ])
    ).flat()

    for (const element of childBounds) {
      bounds.union(element)
    }

    return bounds
  }
}

export class LayerSets extends ContractCollection<LayerSet> {
  protected itemType = () => LayerSet

  add() {
    return this.$evalHandle(LayerSet)`.add()`
  }

  getByName(name: string) {
    return this.$(LayerSet)`.getByName(${name})`
  }
}
