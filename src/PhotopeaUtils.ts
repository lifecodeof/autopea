import { PP } from "./PhotopeaTypes"
import AdmZip from "adm-zip"
import { buffer } from "stream/consumers"
import { PhotopeaHandle } from "./ffi/base/PhotopeaHandle"
import { timeoutAbortSignal } from "./helpers"
import { type PhotopeaChannel } from "./PhotopeaChannel"
import { makeBase64ToArrayBufferFnHandle } from "./playwrightLib"

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

/**
 * Utility class for interacting with Photopea via a communication channel.
 * Provides methods to open files, open smart objects, and save documents.
 */
export class PhotopeaUtils {
  /** @param channel The PhotopeaChannel instance used for communication. */
  constructor(private readonly channel: PhotopeaChannel) {}

  /**
   * Opens an image in Photopea from a given URL.
   * Waits for Photopea to be ready and the file to be loaded.
   * @param url The URL of the image to open.
   * @returns Promise that resolves when the image is loaded.
   */
  async openFromUrl(url: string) {
    const signal = timeoutAbortSignal(10_000)

    const waiterPromise = this.channel.page.waitForBlankDone(signal)
    await this.channel.evaluate<void>(`app.open(${JSON.stringify(url)});`)
    await waiterPromise
  }

  /**
   * Opens an image in Photopea from a Buffer.
   * @param path The path to the image file.
   * @param mimetype The MIME type of the image (default: application/octet-stream).
   * @returns Promise that resolves when the image is loaded.
   */
  async openFile(path: string) {
    const page = this.channel.page.page

    const abort = new AbortController()

    const blankDonePromise = this.channel.page.waitForBlankDone(abort.signal)

    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.waitForTimeout(500) // Wait for the filechooser listener to be ready
    await page.keyboard.press("Control+o")
    const fileChooser = await fileChooserPromise

    await fileChooser.setFiles(path)

    setTimeout(() => abort.abort("waitForBlankDone() timed out"), 10_000)

    await blankDonePromise
  }

  /**
   * Opens the smart object for editing by layer ID.
   * @param layerIdOrHandle The ID or handle of the layer containing the smart object.
   * If not provided, the active layer will be used.
   *
   * @returns Promise that resolves when the smart object is opened.
   */
  async openSmartObject(layer: PhotopeaHandle<PP.Layer>) {
    const isSmartObject =
      (await layer.$eval((layer) => layer.kind)) === PP.LayerKind.SMARTOBJECT

    if (!isSmartObject) {
      const layerName = await layer.$eval((layer) => layer.name)
      throw new Error(`Layer "${layerName}" is not a smart object.`)
    }

    const layerId = await layer.$eval((layer) => layer.id)
    await this.channel.evaluate<void>(
      `
      const desc = new ActionDescriptor();
      const ref = new ActionReference();
      ref.putIdentifier(charIDToTypeID("Lyr "), ${layerId});
      desc.putReference(charIDToTypeID("null"), ref);
      executeAction(stringIDToTypeID("placedLayerEditContents"), desc, DialogModes.NO);
      `
    )
  }

  async convertToSmartObject(layer: PhotopeaHandle<PP.Layer>) {
    const layerId = await layer.$eval((layer) => layer.id)
    const layerHandle = await this.channel.evaluateHandle(
      `
      const desc = new ActionDescriptor();
      const ref = new ActionReference();
      // ref.putIdentifier(charIDToTypeID("Lyr "), ${layerId});
      desc.putReference(charIDToTypeID("null"), ref);
      executeAction(stringIDToTypeID("newPlacedLayer"), desc, DialogModes.NO);
      `
    )

    return new PhotopeaHandle<PP.Layer>(this.channel, layerHandle)
  }

  /**
   * Saves the current or specified document to a buffer in the given format.
   * @param format The format to save as (e.g., 'png', 'jpg').
   * @param document Optional PhotopeaHandle for a specific document. If omitted, uses the active document.
   * @returns Promise that resolves to a Buffer containing the saved file data.
   */
  async saveToBuffer(
    format: SaveFormat,
    document?: PhotopeaHandle<PP.Document>
  ) {
    const saveAs = async () => {
      const documentHandle =
        document?.handle ??
        (await this.channel.evaluateHandle("return app.activeDocument;"))

      const saveFormatCode = saveFormatMap[format as SaveFormat]
      if (!saveFormatCode) {
        throw new Error(`Unsupported save format: ${format}`)
      }

      await this.channel.evaluate<void>(
        `doc.saveAs(new File(""), ${saveFormatCode})`,
        { doc: documentHandle }
      )
    }

    const page = this.channel.page.page

    const downloadPromise = page.waitForEvent("download")
    await saveAs()
    const download = await downloadPromise

    const zipBuffer = await buffer(await download.createReadStream())
    const fileBuffer = extractSingleFileFromZip(zipBuffer)
    return fileBuffer
  }

  uploadFont(font: Buffer, name: string) {
    return this.uploadFonts({ [name]: font })
  }

  async uploadFonts(fonts: Record<string, Buffer>) {
    const page = this.channel.page.page
    const fontsBase64 = Object.entries(fonts).map(([name, buffer]) => ({
      name,
      base64: buffer.toString("base64")
    }))

    const toArrayBuffer = await makeBase64ToArrayBufferFnHandle(page)

    try {
      const dataTransfer = await page.evaluateHandle(
        ([fontsBase64, toArrayBuffer]) => {
          const dataTransfer = new DataTransfer()
          for (const { name, base64 } of fontsBase64) {
            const buffer = toArrayBuffer(base64)
            dataTransfer.items.add(new File([buffer], name))
          }
          return dataTransfer
        },
        [fontsBase64, toArrayBuffer] as const
      )

      const dialogPromise = page.waitForEvent("dialog")
      await page.dispatchEvent(
        ".mainblock > .block > .body",
        "drop",
        { dataTransfer },
        { strict: true }
      )
      const dialog = await dialogPromise

      await dialog.dismiss() // Deny saving to localstorage
    } finally {
      await toArrayBuffer.dispose()
    }
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
