import z from "zod"
import { Contract, ContractCollection, Dynamic } from "./Contract"
import { type AnchorPosition, type ElementPlacement, LayerKind } from "./enums"
import changeLayerSolidFill from "./extendscripts/changeLayerSolidFill.txt"
import { UnitRect, UnitRectLocal } from "./UnitRect"

export class Layer extends Contract {
  get id() {
    return this.$value(z.number())`.id`
  }

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
    const { App } = await import("./App") // Lazy import to avoid circular dependency

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

  /** Shrink or grow layer and transform it */
  async fitToBounds({
    targetBounds,
    grow = false,
    growVertical = false,
    growHorizontal = false,
    preserveAspect = true,
    padding = 0,
  }: {
    // preserveAspect is incompatible with independent axis growth
    targetBounds?: UnitRectLocal // Default to document bounds
    grow?: boolean // If true, will grow the layer if needed
    growVertical?: boolean // If true, will also grow the layer vertically if needed
    growHorizontal?: boolean // If true, will also grow the layer horizontally if needed
    preserveAspect?: boolean // If true, will preserve aspect ratio (default: true)
    padding?: number // Padding to apply (default: 0)
  } = {}) {
    const { App } = await import("./App")

    const rawTarget =
      targetBounds ?? (await App.of(this).activeDocument.makeBounds())

    // Clamp padding to 50% of the target dimension to prevent inverted bounds (negative width/height).
    // This ensures the safe zone never collapses into a negative coordinate space.
    const safePaddingX = Math.min(padding, rawTarget.width / 2)
    const safePaddingY = Math.min(padding, rawTarget.height / 2)

    const target = new UnitRectLocal(
      /* left: */ rawTarget.left + safePaddingX,
      /* top: */ rawTarget.top + safePaddingY,
      /* right: */ rawTarget.right - safePaddingX,
      /* bottom: */ rawTarget.bottom - safePaddingY,
    )

    const bounds = await this.fetchBounds()

    // Guard against division by zero for collapsed layers (e.g., 0-width lines or empty text).
    // Scaling a zero-dimension object is mathematically undefined in this context.
    if (bounds.width === 0 || bounds.height === 0) return

    const scaleX = target.width / bounds.width
    const scaleY = target.height / bounds.height

    let finalScaleX = 1
    let finalScaleY = 1

    if (preserveAspect) {
      // preserveAspect is incompatible with independent axis growth
      // because it enforces a uniform scale factor.
      if (growVertical || growHorizontal) {
        throw new Error(
          "growVertical or growHorizontal is not supported when preserving aspect ratio",
        )
      }

      const uniformScale = grow
        ? Math.min(scaleX, scaleY)
        : Math.min(scaleX, scaleY, 1)
      finalScaleX = uniformScale
      finalScaleY = uniformScale
    } else {
      // Independent axis scaling. Each dimension is allowed to grow only if its
      // specific directional flag or the global grow flag is set.
      finalScaleX = grow || growHorizontal ? scaleX : Math.min(scaleX, 1)
      finalScaleY = grow || growVertical ? scaleY : Math.min(scaleY, 1)
    }

    if (finalScaleX !== 1 || finalScaleY !== 1) {
      await this.resize(finalScaleX * 100, finalScaleY * 100)
    }

    // Post-resize bounds fetch is necessary because the layer's anchor point
    // (center, top-left, etc.) determines the new coordinate position.
    const newBounds = await this.fetchBounds()

    // Calculate the minimum translation required to bring the layer back
    // within the target's clamped boundaries.
    const deltaX =
      Math.max(0, target.left - newBounds.left) +
      Math.min(0, target.right - newBounds.right)

    const deltaY =
      Math.max(0, target.top - newBounds.top) +
      Math.min(0, target.bottom - newBounds.bottom)

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
   * @returns Layers that made visible
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

  getByName(name: string) {
    return this.$(Layer)`.getByName(${name})`
  }

  removeAll() {
    return this.$eval()`.removeAll()`
  }
}
