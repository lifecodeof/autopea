import { PhotopeaFFI } from "./base/PhotopeaFFI"
import { ArtLayer, ArtLayers } from "./ArtLayer"
import {  LayerSets } from "./LayerSet"
import { Layers } from "./Layer"
import z from "zod"

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
    bounds: any[], // UnitValue[]
    angle?: number,
    width?: any, // UnitValue
    height?: any // UnitValue
  ) {
    return this.$eval()`.crop(${bounds},${angle},${width},${height})`
  }
  resizeImage(
    width?: any, // UnitValue
    height?: any, // UnitValue
    resolution?: number,
    resampleMethod?: string // ResampleMethod
  ) {
    return this.$eval()`.resizeImage(${width},${height},${resolution},${resampleMethod})`
  }
  resizeCanvas(
    width: any, // UnitValue
    height: any, // UnitValue
    anchor?: string // AnchorPosition
  ) {
    return this.$eval()`.resizeCanvas(${width},${height},${anchor})`
  }
  rotateCanvas(angle: number) {
    return this.$eval()`.rotateCanvas(${angle})`
  }
  flipCanvas(direction: string) {
    return this.$eval()`.flipCanvas(${direction})`
  }
  trim(
    trimType: string, // TrimType
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
  save() {
    return this.$eval()`.save()`
  }
  saveAs(
    file?: any, // File
    options?: any,
    asCopy?: boolean,
    extensionType?: string // Extension
  ) {
    return this.$eval()`.saveAs(${file},${options},${asCopy},${extensionType})`
  }
  duplicate(name?: string, mergeLayersOnly?: boolean) {
    return this.$eval()`.duplicate(${name},${mergeLayersOnly})`
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
  exportDocument(
    file?: any, // File
    exportType?: string, // ExportType
    options?: any
  ) {
    return this.$eval()`.exportDocument(${file},${exportType},${options})`
  }
}
