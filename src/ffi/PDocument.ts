import { PhotopeaFFI } from "./base/PhotopeaFFI"
import { ArtLayer, ArtLayers } from "./ArtLayer"
import {  LayerSets } from "./LayerSet"
import { Layers } from "./Layer"
import z from "zod"

export class PDocument extends PhotopeaFFI {
  get layers() {
    return this.$(Layers)`.layers`
  }

  get artLayers() {
    return this.$(ArtLayers)`.artLayers`
  }

  get layerSets() {
    return this.$(LayerSets)`.layerSets`
  }

  get activeLayer() {
    return this.$(ArtLayer)`.activeLayer`
  }

  trim() {
    return this.$eval()`.trim()`
  }

  get width() {
    return this.$value(z.number())`.width`
  }

  get height() {
    return this.$value(z.number())`.height`
  }
}
