import z from "zod"
import { ContractCollection, Contract } from "./base/Contract"
import { LayerKind, type ElementPlacement, type RasterizeType } from "./enums"
import { Layer } from "./Layer"
import { SolidColor } from "./SolidColor"
import { UnitValue } from "./UnitValue"
import { App } from "./App"
import { PDocument } from "./PDocument"

export class ArtLayer extends Layer {
  get id() {
    return this.$value(z.number())`.id`
  }
  get fillOpacity() {
    return this.$value(z.number())`.fillOpacity`
  }
  get grouped() {
    return this.$value(z.boolean())`.grouped`
  }
  get textItem() {
    return this.$(TextItem)`.textItem`
  }
  get parent() {
    return this.$(PDocument)`.parent`
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
  async openSmartObject() {
    const isSmartObject = (await this.kind.$get()) === LayerKind.SMARTOBJECT

    if (!isSmartObject) {
      const layerName = await this.name.$get()
      throw new Error(`Layer "${layerName}" is not a smart object.`)
    }

    await App.of(this).activeDocument.activeLayer.$set(this)

    await this.$eval({
      absolute: true
    })`executeAction(stringIDToTypeID("placedLayerEditContents"), null, DialogModes.NO)`
  }

  // Utils

  //! BUG: Race condition if used outside of withFocus (focusMutex)
  //! BUG: Unknown behavior if called when document has no active layer
  private async withDocumentFocus<T>(
    callback: (layer: this) => Promise<T>
  ): Promise<T> {
    const oldFocus = await this.parent.activeLayer.$ref()
    try {
      await this.parent.activeLayer.$set(this)
      return await callback(this)
    } finally {
      await this.parent.activeLayer.$set(oldFocus)
    }
  }

  async withFocus<T>(callback: (layer: this) => Promise<T>): Promise<T> {
    return this.parent.withFocus(async () => {
      return await this.withDocumentFocus(callback)
    })
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
