import { PhotopeaFFI } from "./base/PhotopeaFFI"

export class SolidColor extends PhotopeaFFI {
  get cmyk() { return this.$(CMYKColor)`.cmyk` }
  get gray() { return this.$(GrayColor)`.gray` }
  get hsb() { return this.$(HSBColor)`.hsb` }
  get lab() { return this.$(LabColor)`.lab` }
  get rgb() { return this.$(RGBColor)`.rgb` }
}

export class CMYKColor extends PhotopeaFFI {
  get black() { return this.$value(this.z.number())`.black` }
  get cyan() { return this.$value(this.z.number())`.cyan` }
  get magenta() { return this.$value(this.z.number())`.magenta` }
  get yellow() { return this.$value(this.z.number())`.yellow` }
}

export class GrayColor extends PhotopeaFFI {
  get gray() { return this.$value(this.z.number())`.gray` }
}

export class HSBColor extends PhotopeaFFI {
  get brightness() { return this.$value(this.z.number())`.brightness` }
  get hue() { return this.$value(this.z.number())`.hue` }
  get saturation() { return this.$value(this.z.number())`.saturation` }
}

export class LabColor extends PhotopeaFFI {
  get a() { return this.$value(this.z.number())`.a` }
  get b() { return this.$value(this.z.number())`.b` }
  get l() { return this.$value(this.z.number())`.l` }
}

export class RGBColor extends PhotopeaFFI {
  get blue() { return this.$value(this.z.number())`.blue` }
  get green() { return this.$value(this.z.number())`.green` }
  get red() { return this.$value(this.z.number())`.red` }
  get hexValue() { return this.$value(this.z.string())`.hexValue` }
}
