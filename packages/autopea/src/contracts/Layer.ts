import z from "zod"
import { App } from "./App"
import { Contract, ContractCollection, Dynamic } from "./Contract"
import { type AnchorPosition, type ElementPlacement, LayerKind } from "./enums"
import changeLayerSolidFill from "./extendscripts/changeLayerSolidFill.txt"
import { PDocument } from "./PDocument"
import { UnitRect, UnitRectLocal } from "./UnitRect"

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

  get parent() {
    return this.$(Dynamic)`.parent`
  }

  duplicate(relativeObject?: Layer, insertionLocation?: ElementPlacement) {
    return this.$evalHandle(
      Layer,
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

  /** More reliable than `this.bounds.$fetch()`
   * Implementors may override this method to provide a more accurate bounding box.
   */
  fetchBounds(): Promise<UnitRectLocal> {
    return this.bounds.$fetch()
  }

  // Utils
  // TODO: don't rely on activeDocument
  /**
   * Position the layer relative to a target area.
   * @param options Options for positioning the layer.
   * @param options.targetBounds The target bounds to position relative to (default: document bounds).
   * @param options.horizontal Horizontal alignment: "center", "left", or "right" (default: undefined).
   * @param options.vertical Vertical alignment: "center", "top", or "bottom" (default: undefined).
   */
  async position({
    bounds,
    horizontal,
    vertical,
  }: {
    bounds?: UnitRectLocal // Default to document bounds
    horizontal?: "center" | "left" | "right" // Horizontal alignment
    vertical?: "center" | "top" | "bottom" // Vertical alignment
  } = {}) {
    const doc = App.of(this).activeDocument
    bounds ??= await doc.makeBounds()

    const layerBounds = await this.fetchBounds()
    let deltaX = 0
    let deltaY = 0

    if (horizontal) {
      const targetCenterX = bounds.centerX
      const layerCenterX = layerBounds.centerX
      if (horizontal === "center") {
        deltaX = targetCenterX - layerCenterX
      } else if (horizontal === "left") {
        deltaX = bounds.left - layerBounds.left
      } else if (horizontal === "right") {
        deltaX = bounds.right - layerBounds.right
      }
    }

    if (vertical) {
      const targetCenterY = bounds.centerY
      const layerCenterY = layerBounds.centerY
      if (vertical === "center") {
        deltaY = targetCenterY - layerCenterY
      } else if (vertical === "top") {
        deltaY = bounds.top - layerBounds.top
      } else if (vertical === "bottom") {
        deltaY = bounds.bottom - layerBounds.bottom
      }
    }

    if (deltaX !== 0 || deltaY !== 0) {
      await this.translate(deltaX, deltaY)
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
      blue: bigint & 255,
    }
  }

  async setSolidFill(hex: string) {
    const { red, green, blue } = this.hexToRgb(hex)
    await this.$script(changeLayerSolidFill, {
      layer: this,
      red,
      green,
      blue,
    })
  }

  // TODO: don't rely on activeDocument and rename targetBounds to bounds
  // TODO: Refactor this method to use new UnitRectLocal getters/setters or even add new ones
  /** Shrink or grow layer and transform so it does not overflow document bounds */
  async fitToBounds({
    targetBounds,
    grow = false,
    growVertical = false,
    growHorizontal = false,
    preserveAspect = true,
    padding = 0,
  }: {
    // TODO: indicate mutually exclusive options as types
    targetBounds?: UnitRectLocal // Default to document bounds
    grow?: boolean // If true, will also grow the layer if needed
    growVertical?: boolean // If true, will also grow the layer vertically if needed
    growHorizontal?: boolean // If true, will also grow the layer horizontally if needed
    preserveAspect?: boolean // If true, will preserve aspect ratio (default: true)
    padding?: number // Padding to apply (default: 0)
  } = {}) {
    targetBounds ??= await App.of(this).activeDocument.makeBounds()

    // Apply padding to target bounds
    if (padding) {
      targetBounds = new UnitRectLocal(
        targetBounds.left + padding,
        targetBounds.top + padding,
        targetBounds.right - padding,
        targetBounds.bottom - padding,
      )
    }

    const bounds = await this.fetchBounds()

    const layerWidth = bounds.right - bounds.left
    const layerHeight = bounds.bottom - bounds.top
    const docWidth = targetBounds.right - targetBounds.left
    const docHeight = targetBounds.bottom - targetBounds.top

    const scaleX = docWidth / layerWidth
    const scaleY = docHeight / layerHeight

    let finalScaleX: number
    let finalScaleY: number

    if (preserveAspect) {
      if (growVertical || growHorizontal) {
        throw new Error(
          "growVertical or growHorizontal is not supported when preserving aspect ratio",
        )
      }

      // Preserve aspect ratio - use the smaller scale for both dimensions
      const uniformScale = grow
        ? Math.min(scaleX, scaleY)
        : Math.min(scaleX, scaleY, 1)
      finalScaleX = uniformScale
      finalScaleY = uniformScale
    } else {
      // Allow non-uniform scaling - scale each dimension independently
      finalScaleX = grow || growHorizontal ? scaleX : Math.min(scaleX, 1)
      finalScaleY = grow || growVertical ? scaleY : Math.min(scaleY, 1)
    }

    // Resize if we need to shrink or if we need to grow (when grow is enabled)
    if (finalScaleX !== 1 || finalScaleY !== 1) {
      await this.resize(finalScaleX * 100, finalScaleY * 100)
    }

    // Recalculate bounds and move if needed to fit within doc
    const newBounds = await this.fetchBounds()
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

  async isVisibleToUser(): Promise<boolean> {
    if (!(await this.visible.$get())) {
      return false
    }

    const parentTypeName = await this.parent.typename.$get()
    if (parentTypeName === "LayerSet") {
      // Lazy import to avoid circular dependency
      const { LayerSet } = await import("./LayerSet")
      return this.parent.$cast(LayerSet).isVisibleToUser()
    } else if (parentTypeName === "Document") {
      return true
    } else {
      throw new Error(`Unknown parent type: ${parentTypeName}`)
    }
  }

  /** Make all parent layers visible so user can see this layer
   * @returns Layers that were made visible
   */
  async makeVisibleToUser(): Promise<Layer[]> {
    const madeVisibleLayers: Layer[] = []

    if (!(await this.visible.$get())) {
      await this.visible.$set(true)
      madeVisibleLayers.push(this)
    }

    const parentTypeName = await this.parent.typename.$get()
    if (parentTypeName === "LayerSet") {
      // Lazy import to avoid circular dependency
      const { LayerSet } = await import("./LayerSet")
      const madeVisible = await this.parent.$cast(LayerSet).makeVisibleToUser()
      madeVisibleLayers.push(...madeVisible)
    }

    return madeVisibleLayers
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
