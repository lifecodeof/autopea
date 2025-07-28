import z from "zod"
import { PhotopeaFFI, FFICollection, FFIEither } from "./base/PhotopeaFFI"
import { LayerSet } from "./LayerSet"
import { PDocument } from "./PDocument"
import { UnitRect } from "./UnitRect"
import type { AnchorPosition, ElementPlacement } from "./enums"
import { App } from "./App"
import changeLayerSolidFill from "./extendscripts/changeLayerSolidFill.txt"

export class Layer extends PhotopeaFFI {
  get name() {
    return this.$value(z.string())`.name`
  }

  get visible() {
    return this.$value(z.boolean())`.visible`
  }

  get opacity() {
    return this.$value(z.number())`.opacity`
  }

  get blendMode() {
    return this.$value(z.string())`.blendMode`
  }

  get parent() {
    return this.$(FFIEither.for(LayerSet, PDocument))`.parent`
  }

  get isBackgroundLayer() {
    return this.$value(z.boolean())`.isBackgroundLayer`
  }

  get kind() {
    return this.$value(
      z.enum([
        "any",
        "normal",
        "textLayer",
        "solidFill",
        "gradientFill",
        "patternFill",
        "smartObject",
        "video",
        "adjustmentLayer"
      ] as const)
    )`.kind`
  }

  get allLocked() {
    return this.$value(z.boolean())`.allLocked`
  }

  get pixelsLocked() {
    return this.$value(z.boolean())`.pixelsLocked`
  }

  get positionLocked() {
    return this.$value(z.boolean())`.positionLocked`
  }

  get transparentPixelsLocked() {
    return this.$value(z.boolean())`.transparentPixelsLocked`
  }

  get bounds() {
    return this.$(UnitRect)`.bounds`
  }

  duplicate(relativeObject?: Layer, insertionLocation?: ElementPlacement) {
    return this.$evalHandle(
      Layer
    )`.duplicate(${relativeObject}, ${insertionLocation})`
  }

  move(relativeObject: Layer, insertionLocation: ElementPlacement) {
    return this.$eval()`.move(${relativeObject}, ${insertionLocation})`
  }

  remove() {
    return this.$eval()`.remove()`
  }

  resize(horizontal: number, vertical: number, anchor?: AnchorPosition) {
    return this.$eval()`.resize(${horizontal}, ${vertical}, ${anchor})`
  }

  rotate(angle: number, anchor?: AnchorPosition) {
    return this.$eval()`.rotate(${angle}, ${anchor})`
  }

  translate(deltaX: number, deltaY: number) {
    return this.$eval()`.translate(${deltaX}, ${deltaY})`
  }

  link(layer: Layer) {
    return this.$eval()`.link(${layer})`
  }

  unlink() {
    return this.$eval()`.unlink()`
  }

  merge() {
    return this.$(Layer)`.merge()`
  }

  // Utils
  async centerHorizontally() {
    const doc = App.get(this.channel).activeDocument
    const docCenter = (await doc.width.$get()) / 2
    const layerCenter = await this.bounds.centerX.$get()
    const offset = docCenter - layerCenter
    if (offset !== 0) {
      await this.translate(offset, 0)
    }
  }

  async centerVertically() {
    const doc = App.get(this.channel).activeDocument
    const docCenter = (await doc.height.$get()) / 2
    const layerCenter = await this.bounds.centerY.$get()
    const offset = docCenter - layerCenter
    if (offset !== 0) {
      await this.translate(0, offset)
    }
  }

  private hexToRgb(hex: string) {
    const parsedHex = z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/i)
      .parse(hex)

    const bigint = parseInt(parsedHex.slice(1), 16)
    return {
      red: (bigint >> 16) & 255,
      green: (bigint >> 8) & 255,
      blue: bigint & 255
    }
  }

  async setSolidFill(hex: string) {
    const { red, green, blue } = this.hexToRgb(hex)
    await this.$script(changeLayerSolidFill, {
      layer: this,
      red,
      green,
      blue
    })
  }
}

export class Layers extends FFICollection<Layer> {
  protected itemType = () => Layer

  get parent() {
    return this.$(PDocument)`.parent`
  }

  getByName(name: string) {
    return this.$(Layer)`.getByName(${name})`
  }

  removeAll() {
    return this.$eval()`.removeAll()`
  }
}
