import z from "zod"
import { Contract, ContractCollection } from "./Contract"
import type { ElementPlacement, RasterizeType } from "./enums"
import { Layer } from "./Layer"
import { SolidColor } from "./SolidColor"
import { UnitValue } from "./UnitValue"

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
    insertionLocation?: ElementPlacement,
  ) {
    return this.$evalHandle(
      ArtLayer,
    )`.duplicate(${relativeObject}, ${insertionLocation})`
  }
  invert() {
    return this.$eval()`.invert()`
  }
  rasterize(type: RasterizeType) {
    return this.$eval()`.rasterize(${type})`
  }

  // Utils
  async openSmartObject() {
    return await this.capabilities.openSmartObject.call(this)
  }

  // Utils
  async getDocument() {
    const { PDocument } = await import("./PDocument") // Lazy import to avoid circular dependency

    let parent = await this.parent.$ref()
    while ((await parent.typename.$get()) !== "Document") {
      parent = await parent.$prop("parent").$ref()
    }

    return parent.$cast(PDocument)
  }
}

export class TextItem extends Contract {
  get contents() {
    return this.$value(z.string())`.contents`
  }

  get color() {
    return this.$(SolidColor)`.color`
  }

  get leading() {
    return this.$(UnitValue)`.leading`
  }

  get font() {
    return this.$value(z.string())`.font`
  }
}

export class ArtLayers extends ContractCollection<ArtLayer> {
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
