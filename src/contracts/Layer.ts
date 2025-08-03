import z from "zod"
import { App } from "./App"
import { ContractCollection, Contract } from "./base/Contract"
import { LayerKind, type AnchorPosition, type ElementPlacement } from "./enums"
import changeLayerSolidFill from "./extendscripts/changeLayerSolidFill.txt"
import { PDocument } from "./PDocument"
import { UnitRect } from "./UnitRect"

export class Layer extends Contract {
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

  get isBackgroundLayer() {
    return this.$value(z.boolean())`.isBackgroundLayer`
  }

  get kind() {
    return this.$value(z.enum(LayerKind))`.kind`
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

  /**
   * Resize the layer.
   * @param horizontal The horizontal scale factor (percentage).
   * @param vertical The vertical scale factor (percentage).
   * @param anchor The anchor position for the resize.
   * @returns A promise that resolves when the resize is complete.
   */
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

  // Shrink layer (preserve aspect and center) and transform so it does not overflow document bounds
  async fitToBounds() {
    const doc = App.get(this.channel).activeDocument
    const docBounds = await doc.makeBounds()
    const bounds = await this.bounds.$fetch()

    const layerWidth = bounds.right - bounds.left
    const layerHeight = bounds.bottom - bounds.top
    const docWidth = docBounds.right - docBounds.left
    const docHeight = docBounds.bottom - docBounds.top

    const scaleX = docWidth / layerWidth
    const scaleY = docHeight / layerHeight
    const scale = Math.min(scaleX, scaleY, 1)

    if (scale < 1) {
      await this.resize(scale * 100, scale * 100)
    }

    // Recalculate bounds and move if needed to fit within doc
    const newBounds = await this.bounds.$fetch()
    let deltaX = 0
    let deltaY = 0
    if (newBounds.left < docBounds.left) {
      deltaX = docBounds.left - newBounds.left
    } else if (newBounds.right > docBounds.right) {
      deltaX = docBounds.right - newBounds.right
    }
    if (newBounds.top < docBounds.top) {
      deltaY = docBounds.top - newBounds.top
    } else if (newBounds.bottom > docBounds.bottom) {
      deltaY = docBounds.bottom - newBounds.bottom
    }
    if (deltaX !== 0 || deltaY !== 0) {
      await this.translate(deltaX, deltaY)
    }
  }
}

export class Layers extends ContractCollection<Layer> {
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
