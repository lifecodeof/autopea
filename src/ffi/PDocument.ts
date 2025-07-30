import { FFICollection, PhotopeaFFI } from "./base/PhotopeaFFI"
import { ArtLayer, ArtLayers } from "./ArtLayer"
import { LayerSets } from "./LayerSet"
import { Layers } from "./Layer"
import z from "zod"
import { UnitRectLocal, type UnitRect } from "./UnitRect"
import type { UnitValue } from "./UnitValue"
import type { SaveFormat } from "@/PhotopeaUtils"
import type { AnchorPosition, ResampleMethod, TrimType } from "./enums"

export class PDocument extends PhotopeaFFI {
  // FFI object properties
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

  // Value properties
  get name() {
    return this.$value(z.string())`.name`
  }
  get width() {
    return this.$value(z.number())`.width`
  }
  get height() {
    return this.$value(z.number())`.height`
  }
  get resolution() {
    return this.$value(z.number())`.resolution`
  }
  get mode() {
    return this.$value(z.string())`.mode`
  }
  get saved() {
    return this.$value(z.boolean())`.saved`
  }

  // Methods
  crop(
    bounds: UnitRect,
    angle?: number,
    width?: UnitValue,
    height?: UnitValue
  ) {
    return this.$eval()`.crop(${bounds},${angle},${width},${height})`
  }
  resizeImage(
    width?: UnitValue,
    height?: UnitValue,
    resolution?: number,
    resampleMethod?: ResampleMethod
  ) {
    return this.$eval()`.resizeImage(${width},${height},${resolution},${resampleMethod})`
  }
  resizeCanvas(width: UnitValue, height: UnitValue, anchor?: AnchorPosition) {
    return this.$eval()`.resizeCanvas(${width},${height},${anchor})`
  }
  rotateCanvas(angle: number) {
    return this.$eval()`.rotateCanvas(${angle})`
  }
  flipCanvas(direction: string) {
    return this.$eval()`.flipCanvas(${direction})`
  }
  trim(
    trimType?: TrimType,
    top?: boolean,
    left?: boolean,
    bottom?: boolean,
    right?: boolean
  ) {
    return this.$eval()`.trim(${trimType},${top},${left},${bottom},${right})`
  }
  close(saveOptions?: string) {
    return this.$eval()`.close(${saveOptions})`
  }
  flatten() {
    return this.$eval()`.flatten()`
  }
  mergeVisibleLayers() {
    return this.$eval()`.mergeVisibleLayers()`
  }
  rasterizeAllLayers() {
    return this.$eval()`.rasterizeAllLayers()`
  }
  paste() {
    return this.$eval()`.paste()`
  }

  // Extra Utils
  saveToBuffer(format: SaveFormat): Promise<Buffer> {
    return this.channel.utils.saveToBuffer(format, this)
  }
  async makeBounds() {
    const width = await this.width.$get()
    const height = await this.height.$get()

    return new UnitRectLocal(0, 0, width, height)
  }
}

export class PDocuments extends FFICollection<PDocument> {
  itemType = () => PDocument

  getByName(name: string) {
    return this.$(PDocument)`.getByName(${name})`
  }

  add(width?: number, height?: number, resolution?: number, name?: string) {
    return this.$evalHandle(
      PDocument
    )`.add(${width},${height},${resolution},${name})`
  }
}
