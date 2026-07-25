import { ArtLayers } from "./ArtLayer"
import { ContractCollection } from "./Contract"
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

    const childResults = await Promise.allSettled([
      this.artLayers
        .toArray()
        .then((layers) =>
          Promise.allSettled(layers.map((layer) => layer.fetchBounds())),
        ),
      this.layerSets
        .toArray()
        .then((sets) =>
          Promise.allSettled(sets.map((set) => set.fetchBounds())),
        ),
    ])

    for (const result of childResults) {
      if (result.status !== "fulfilled") continue

      for (const inner of result.value) {
        if (inner.status === "fulfilled") {
          bounds.union(inner.value)
        }
      }
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
