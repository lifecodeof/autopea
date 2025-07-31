import z from "zod"
import { Contract } from "./base/Contract"

export class SolidColor extends Contract {
  get cmyk() { return this.$(CMYKColor)`.cmyk` }
  get gray() { return this.$(GrayColor)`.gray` }
  get hsb() { return this.$(HSBColor)`.hsb` }
  get lab() { return this.$(LabColor)`.lab` }
  get rgb() { return this.$(RGBColor)`.rgb` }
}

export class CMYKColor extends Contract {
  get black() { return this.$value(z.number())`.black` }
  get cyan() { return this.$value(z.number())`.cyan` }
  get magenta() { return this.$value(z.number())`.magenta` }
  get yellow() { return this.$value(z.number())`.yellow` }
}

export class GrayColor extends Contract {
  get gray() { return this.$value(z.number())`.gray` }
}

export class HSBColor extends Contract {
  get brightness() { return this.$value(z.number())`.brightness` }
  get hue() { return this.$value(z.number())`.hue` }
  get saturation() { return this.$value(z.number())`.saturation` }
}

export class LabColor extends Contract {
  get a() { return this.$value(z.number())`.a` }
  get b() { return this.$value(z.number())`.b` }
  get l() { return this.$value(z.number())`.l` }
}

export class RGBColor extends Contract {
  get blue() { return this.$value(z.number())`.blue` }
  get green() { return this.$value(z.number())`.green` }
  get red() { return this.$value(z.number())`.red` }
  get hexValue() { return this.$value(z.string())`.hexValue` }
}
