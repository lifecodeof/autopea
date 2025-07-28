import z from "zod"
import { PhotopeaFFI, FFICollection, FFIEither } from "./base/PhotopeaFFI"
import { LayerSet } from "./LayerSet"
import { PDocument } from "./PDocument"
import { UnitRect } from "./UnitRect"

type ElementPlacement = "PLACEBEFORE" | "PLACEAFTER" | "INSIDE"

type AnchorPosition =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "middleLeft"
  | "middleCenter"
  | "middleRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight"

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
    return this.$(Layer)`.duplicate(${relativeObject}, ${insertionLocation})`
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
