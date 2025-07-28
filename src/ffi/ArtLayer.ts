import z from "zod"
import { App } from "./App"
import {
  FFICollection,
  FFITypeName,
  PhotopeaFFI
} from "./base/PhotopeaFFI"
import type { ElementPlacement, RasterizeType } from "./enums"
import changeLayerSolidFill from "./extendscripts/changeLayerSolidFill.txt"
import { Layer } from "./Layer"
import { SolidColor } from "./SolidColor"

@FFITypeName("ArtLayer")
export class ArtLayer extends Layer {
  get fillOpacity() {
    return this.$value(z.number())`.fillOpacity`
  }
  get grouped() {
    return this.$value(z.boolean())`.grouped`
  }
  get textItem() {
    return this.$(TextItem)`.textItem`
  }

  applyGaussianBlur(radius: number) {
    return this.$eval()`.applyGaussianBlur(${radius})`
  }
  applySharpen() {
    return this.$eval()`.applySharpen()`
  }
  applyUnSharpMask(amount: number, radius: number, threshold: number) {
    return this.$eval()`.applyUnSharpMask(${amount}, ${radius}, ${threshold})`
  }
  clear() {
    return this.$eval()`.clear()`
  }
  copy() {
    return this.$eval()`.copy()`
  }
  cut() {
    return this.$eval()`.cut()`
  }
  override duplicate(
    relativeObject?: Layer,
    insertionLocation?: ElementPlacement
  ) {
    return this.$evalHandle(
      ArtLayer
    )`.duplicate(${relativeObject}, ${insertionLocation})`
  }
  invert() {
    return this.$eval()`.invert()`
  }
  rasterize(type: RasterizeType) {
    return this.$eval()`.rasterize(${type})`
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

  async changeSolidFill(hex: string) {
    const { red, green, blue } = this.hexToRgb(hex)
    await this.$script(changeLayerSolidFill, {
      layer: this,
      red,
      green,
      blue
    })
  }
}

export class TextItem extends PhotopeaFFI {
  get contents() {
    return this.$value(z.string())`.contents`
  }

  get color() {
    return this.$(SolidColor)`.color`
  }
}

export class ArtLayers extends FFICollection<ArtLayer> {
  protected itemType = () => ArtLayer

  add() {
    return this.$evalHandle(ArtLayer)`.add()`
  }
  getByName(name: string) {
    return this.$(ArtLayer)`.getByName(${name})`
  }
  removeAll() {
    return this.$eval()`.removeAll()`
  }
}
