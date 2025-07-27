import { FFICollection, PhotopeaFFI } from "./base/PhotopeaFFI"
import { PDocument } from "./PDocument"
import { SolidColor } from "./SolidColor"
import { UnitRect } from "./UnitRect"
import changeLayerSolidFill from "./extendscripts/changeLayerSolidFill.txt"

export class ArtLayer extends PhotopeaFFI {
  get id() {
    return this.$value(this.z.number())`.id`
  }

  get textItem() {
    return this.$(TextItem)`.textItem`
  }

  get visible() {
    return this.$value(this.z.boolean())`.visible`
  }

  get bounds() {
    return this.$(UnitRect)`.bounds`
  }

  get parent() {
    return this.$(PDocument)`.parent`
  }

  translate(x: number, y: number) {
    return this.$eval()`.translate(${x}, ${y})`
  }

  async centerHorizontally() {
    const doc = this.parent
    const docCenter = (await doc.width.$get()) / 2
    const layerCenter = await this.bounds.centerX.$get()
    const offset = docCenter - layerCenter
    if (offset !== 0) {
      await this.translate(offset, 0)
    }
  }

  async centerVertically() {
    const doc = this.parent
    const docCenter = (await doc.height.$get()) / 2
    const layerCenter = await this.bounds.centerY.$get()
    const offset = docCenter - layerCenter
    if (offset !== 0) {
      await this.translate(0, offset)
    }
  }

  private hexToRgb(hex: string) {
    const parsedHex = this.z
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

  async changeSolidFill(hex: string) {
    const { red, green, blue } = this.hexToRgb(hex)
    await this.$script(changeLayerSolidFill, {
      layer: this,
      red,
      green,
      blue
    })
  }
}

export class TextItem extends PhotopeaFFI {
  get contents() {
    return this.$value(this.z.string())`.contents`
  }

  get color() {
    return this.$(SolidColor)`.color`
  }
}

export class ArtLayers extends FFICollection<ArtLayer> {
  protected _itemType = () => ArtLayer

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
