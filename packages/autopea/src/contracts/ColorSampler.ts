import z from "zod"
import { Contract, ContractCollection } from "./Contract"
import { PDocument } from "./PDocument"
import { SolidColor } from "./SolidColor"

export class ColorSampler extends Contract {
  get color() {
    return this.$(SolidColor)`.color`
  }

  get position() {
    return this.$value(z.tuple([z.number(), z.number()] as const))`.position`
  }

  get parent() {
    return this.$(PDocument)`.parent`
  }

  move(position: [number, number]) {
    return this.$eval()`.move(${position})`
  }

  remove() {
    return this.$eval()`.remove()`
  }
}

export class ColorSamplers extends ContractCollection<ColorSampler> {
  protected itemType = () => ColorSampler

  get parent() {
    return this.$(PDocument)`.parent`
  }

  add(x: number, y: number) {
    return this.$evalHandle(ColorSampler)`.add(${[x, y]})`
  }

  removeAll() {
    return this.$eval()`.removeAll()`
  }
}
