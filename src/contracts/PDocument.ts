import AdmZip from "adm-zip"
import { buffer } from "stream/consumers"
import z from "zod"
import { App } from "./App"
import { ArtLayers } from "./ArtLayer"
import { ColorSamplers } from "./ColorSampler"
import { Layer, Layers } from "./Layer"
import { LayerSets } from "./LayerSet"
import { UnitRectLocal, type UnitRect } from "./UnitRect"
import type { UnitValue } from "./UnitValue"
import { Contract, ContractCollection } from "./base/Contract"
import type { AnchorPosition, ResampleMethod, TrimType } from "./enums"

export enum SaveFormat {
  PNG = "png",
  JPG = "jpg",
  PSD = "psd"
}

const saveFormatMap = {
  [SaveFormat.PNG]: "new PNGSaveOptions()",
  [SaveFormat.JPG]: "new JPEGSaveOptions()",
  [SaveFormat.PSD]: "new PhotoshopSaveOptions()"
}

export class PDocument extends Contract {
  get layers() {
    return this.$(Layers)`.layers`
  }
  get artLayers() {
    return this.$(ArtLayers)`.artLayers`
  }
  get layerSets() {
    return this.$(LayerSets)`.layerSets`
  }
  get activeLayer() {
    return this.$(Layer)`.activeLayer`
  }
  get colorSamplers() {
    return this.$(ColorSamplers)`.colorSamplers`
  }

  // Value properties
  get name() {
    return this.$value(z.string())`.name`
  }
  get width() {
    return this.$value(z.number())`.width`
  }
  get height() {
    return this.$value(z.number())`.height`
  }
  get resolution() {
    return this.$value(z.number())`.resolution`
  }
  get mode() {
    return this.$value(z.string())`.mode`
  }
  get saved() {
    return this.$value(z.boolean())`.saved`
  }

  // Methods
  crop(
    bounds: UnitRect,
    angle?: number,
    width?: UnitValue,
    height?: UnitValue
  ) {
    return this.$eval()`.crop(${bounds},${angle},${width},${height})`
  }
  resizeImage(
    width?: UnitValue,
    height?: UnitValue,
    resolution?: number,
    resampleMethod?: ResampleMethod
  ) {
    return this.$eval()`.resizeImage(${width},${height},${resolution},${resampleMethod})`
  }
  resizeCanvas(width: UnitValue, height: UnitValue, anchor?: AnchorPosition) {
    return this.$eval()`.resizeCanvas(${width},${height},${anchor})`
  }
  rotateCanvas(angle: number) {
    return this.$eval()`.rotateCanvas(${angle})`
  }
  flipCanvas(direction: string) {
    return this.$eval()`.flipCanvas(${direction})`
  }
  trim(
    trimType?: TrimType,
    top?: boolean,
    left?: boolean,
    bottom?: boolean,
    right?: boolean
  ) {
    return this.$eval()`.trim(${trimType},${top},${left},${bottom},${right})`
  }
  close(saveOptions?: string) {
    return this.$eval()`.close(${saveOptions})`
  }
  flatten() {
    return this.$eval()`.flatten()`
  }
  mergeVisibleLayers() {
    return this.$eval()`.mergeVisibleLayers()`
  }
  rasterizeAllLayers() {
    return this.$eval()`.rasterizeAllLayers()`
  }
  paste() {
    return this.$eval()`.paste()`
  }
  save() {
    return this.$eval()`.save()`
  }

  // Extra Utils
  /**
   * Saves document and waits for smart object updated message
   */
  async saveSmartObject() {
    const waiter = this.channel.page.page.waitForEvent(
      "console",
      async (msg) => {
        const args = msg.args()
        if (args.length === 0) return false
        const firstArg = args[0]
        return await firstArg.evaluate(
          (arg) => arg === "Alert: Smart Object updated"
        )
      }
    )

    await this.save()
    await waiter
  }

  /**
   * Saves the current or specified document to a buffer in the given format.
   * @param format The format to save as (e.g., 'png', 'jpg').
   * @param document Optional PhotopeaHandle for a specific document. If omitted, uses the active document.
   * @returns Promise that resolves to a Buffer containing the saved file data.
   */
  async saveToBuffer(format: SaveFormat): Promise<Buffer> {
    const saveFormatCode = saveFormatMap[format as SaveFormat]
    if (!saveFormatCode) {
      throw new Error(`Unsupported save format: ${format}`)
    }

    const zipBuffer = await this.mutexes.downloadMutex.runExclusive(
      async () => {
        const page = this.channel.page.page

        const downloadPromise = page.waitForEvent("download")
        await this.channel.evaluate<void>(
          `doc.saveAs(new File(""), ${saveFormatCode})`,
          { doc: this },
          { timeout: 10_000 }
        )
        const download = await downloadPromise

        const downloadStream = await download.createReadStream()
        try {
          return await buffer(downloadStream)
        } finally {
          downloadStream.destroy()
        }
      }
    )

    return extractSingleFileFromZip(zipBuffer)
  }

  async makeBounds() {
    const width = await this.width.$get()
    const height = await this.height.$get()

    return new UnitRectLocal(0, 0, width, height)
  }

  async duplicate() {
    const page = this.channel.page.page
    await page.click(".topbar > span:nth-child(1) > button:nth-child(3)")
    await page.click(".contextpanel > .enab:nth-child(20)")
    return await App.of(this).activeDocument.$ref()
  }
}

export class PDocuments extends ContractCollection<PDocument> {
  itemType = () => PDocument

  getByName(name: string) {
    return this.$(PDocument)`.getByName(${name})`
  }

  add(width?: number, height?: number, resolution?: number, name?: string) {
    return this.$evalHandle(
      PDocument
    )`.add(${width},${height},${resolution},${name})`
  }
}

function extractSingleFileFromZip(zipBuffer: Buffer): Buffer {
  const zip = new AdmZip(zipBuffer)
  const entries = zip.getEntries()

  if (entries.length !== 1) {
    throw new Error(
      `Zip archive must contain exactly one file, found ${entries.length}`
    )
  }

  return entries[0].getData()
}
