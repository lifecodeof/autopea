import z from "zod"
import { App } from "./App"
import { ContractCollection, Contract } from "./base/Contract"
import { LayerKind, type AnchorPosition, type ElementPlacement } from "./enums"
import changeLayerSolidFill from "./extendscripts/changeLayerSolidFill.txt"
import { PDocument } from "./PDocument"
import { UnitRect, type UnitRectLocal } from "./UnitRect"

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
  async centerHorizontally({
    targetBounds
  }: {
    targetBounds?: UnitRectLocal // Default to document bounds
  } = {}) {
    const doc = App.of(this.channel).activeDocument
    const targetCenter = targetBounds
      ? targetBounds.centerX
      : (await doc.width.$get()) / 2

    const layerCenter = await this.bounds.centerX.$get()
    const offset = targetCenter - layerCenter
    if (offset !== 0) {
      await this.translate(offset, 0)
    }
  }

  async centerVertically({
    targetBounds
  }: {
    targetBounds?: UnitRectLocal // Default to document bounds
  } = {}) {
    const doc = App.of(this.channel).activeDocument
    const targetCenter = targetBounds
      ? targetBounds.centerY
      : (await doc.height.$get()) / 2

    const layerCenter = await this.bounds.centerY.$get()
    const offset = targetCenter - layerCenter
    if (offset !== 0) {
      await this.translate(0, offset)
    }
  }

  private hexToRgb(hex: string) {
    const pattern = /^#?([0-9A-Fa-f]{6})$/

    const parsedHex = hex.match(pattern)
    if (!parsedHex) {
      throw new Error(`Invalid hex color: ${hex}`)
    }

    const bigint = parseInt(parsedHex[1], 16)
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

  /** Shrink or grow layer and transform so it does not overflow document bounds */
  async fitToBounds({
    targetBounds,
    grow = false,
    preserveAspect = true
  }: {
    targetBounds?: UnitRectLocal // Default to document bounds
    grow?: boolean // If true, will also grow the layer if needed
    preserveAspect?: boolean // If true, will preserve aspect ratio (default: true)
  } = {}) {
    const doc = App.of(this.channel).activeDocument
    targetBounds ??= await doc.makeBounds()
    const bounds = await this.bounds.$fetch()

    const layerWidth = bounds.right - bounds.left
    const layerHeight = bounds.bottom - bounds.top
    const docWidth = targetBounds.right - targetBounds.left
    const docHeight = targetBounds.bottom - targetBounds.top

    const scaleX = docWidth / layerWidth
    const scaleY = docHeight / layerHeight

    let finalScaleX: number
    let finalScaleY: number

    if (preserveAspect) {
      // Preserve aspect ratio - use the smaller scale for both dimensions
      const uniformScale = grow
        ? Math.min(scaleX, scaleY)
        : Math.min(scaleX, scaleY, 1)
      finalScaleX = uniformScale
      finalScaleY = uniformScale
    } else {
      // Allow non-uniform scaling - scale each dimension independently
      finalScaleX = grow ? scaleX : Math.min(scaleX, 1)
      finalScaleY = grow ? scaleY : Math.min(scaleY, 1)
    }

    // Resize if we need to shrink or if we need to grow (when grow is enabled)
    if (finalScaleX !== 1 || finalScaleY !== 1) {
      await this.resize(finalScaleX * 100, finalScaleY * 100)
    }

    // Recalculate bounds and move if needed to fit within doc
    const newBounds = await this.bounds.$fetch()
    let deltaX = 0
    let deltaY = 0
    if (newBounds.left < targetBounds.left) {
      deltaX = targetBounds.left - newBounds.left
    } else if (newBounds.right > targetBounds.right) {
      deltaX = targetBounds.right - newBounds.right
    }
    if (newBounds.top < targetBounds.top) {
      deltaY = targetBounds.top - newBounds.top
    } else if (newBounds.bottom > targetBounds.bottom) {
      deltaY = targetBounds.bottom - newBounds.bottom
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
