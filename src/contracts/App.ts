import { Handleable, PhotopeaChannel } from "@/Channel"
import { PhotopeaMutexes } from "@/PhotopeaMutexes"
import type { Dialog } from "playwright"
import z from "zod"
import { abortOnTimeout, timeoutAbortSignal } from "../helpers"
import { makeBase64ToArrayBufferFnHandle } from "../playwrightLib"
import { Contract } from "./base/Contract"
import { PDocument, PDocuments, type SaveFormat } from "./PDocument"
import { PFile } from "./PFile"
import { Preferences } from "./Preferences"
import { SolidColor } from "./SolidColor"

export class App extends Contract {
  static of(obj: PhotopeaChannel | Contract) {
    if (obj instanceof Contract) obj = Contract.getChannel(obj)
    return new App(obj, "app")
  }

  get activeDocument() {
    return this.$(PDocument)`.activeDocument`
  }

  get documents() {
    return this.$(PDocuments)`.documents`
  }

  get name() {
    return this.$value(z.string())`.name`
  }
  get version() {
    return this.$value(z.string())`.version`
  }
  get build() {
    return this.$value(z.string())`.build`
  }
  get locale() {
    return this.$value(z.string())`.locale`
  }
  get preferences() {
    return this.$(Preferences)`.preferences`
  }
  get freeMemory() {
    return this.$value(z.number())`.freeMemory`
  }
  get recentFiles() {
    return this.$(this.$arrayOf(PFile))`.recentFiles`
  }
  get notifiersEnabled() {
    return this.$value(z.boolean())`.notifiersEnabled`
  }
  get scriptingVersion() {
    return this.$value(z.string())`.scriptingVersion`
  }
  get systemInformation() {
    return this.$value(z.string())`.systemInformation`
  }
  get backgroundColor() {
    return this.$(SolidColor)`.backgroundColor`
  }
  get foregroundColor() {
    return this.$(SolidColor)`.foregroundColor`
  }
  get currentTool() {
    return this.$value(z.string())`.currentTool`
  }
  get displayDialogs() {
    return this.$value(z.string())`.displayDialogs`
  }

  beep() {
    return this.$eval()`.beep()`
  }
  bringToFront() {
    return this.$eval()`.bringToFront()`
  }
  refresh() {
    return this.$eval()`.refresh()`
  }
  refreshFonts() {
    return this.$eval()`.refreshFonts()`
  }
  togglePalettes() {
    return this.$eval()`.togglePalettes()`
  }

  doAction(action: string, from: string) {
    return this.$eval()`.doAction(${action},${from})`
  }
  executeAction(actionID: number, descriptor?: any, display?: string) {
    return this.$eval()`.executeAction(${actionID},${descriptor},${display})`
  }
  executeActionGet(reference: any) {
    return this.$eval()`.executeActionGet(${reference})`
  }
  batch(files: any, action: string, from: string, options?: any) {
    return this.$eval()`.batch(${files},${action},${from},${options})`
  }
  runMenuItem(menuID: number) {
    return this.$eval()`.runMenuItem(${menuID})`
  }
  open(file: any, as?: string, options?: any) {
    return this.$(PDocument)`.open(${file},${as},${options})`
  }
  openDialog() {
    return this.$(PFile)`.openDialog()`
  }
  load(file: any) {
    return this.$eval()`.load(${file})`
  }
  save() {
    return this.$eval()`.save()`
  }
  makeContactSheet() {
    return this.$eval()`.makeContactSheet()`
  }
  makePDFPresentation() {
    return this.$eval()`.makePDFPresentation()`
  }
  makePhotoGallery() {
    return this.$eval()`.makePhotoGallery()`
  }
  makePhotomerge() {
    return this.$eval()`.makePhotomerge()`
  }
  makePicturePackage() {
    return this.$eval()`.makePicturePackage()`
  }

  // Extra Utils
  async restoreActiveDocument<T>(callback: () => Promise<T>) {
    return await this.mutexes.focusMutex.runExclusive(async () => {
      const oldActiveDocument = await this.tryGetActiveDocument()
      try {
        return await callback()
      } finally {
        if (oldActiveDocument) {
          await this.activeDocument.$set(oldActiveDocument)
        }
      }
    })
  }

  async saveToBuffer(format: SaveFormat): Promise<Buffer> {
    return await this.activeDocument.saveToBuffer(format)
  }

  /**
   * Opens an image in Photopea from a given URL.
   * Waits for Photopea to be ready and the file to be loaded.
   * @param url The URL of the image to open.
   * @returns Promise that resolves when the image is loaded.
   */
  async openFromUrl(url: string) {
    return await this.restoreActiveDocument(async () => {
      const signal = timeoutAbortSignal(10_000)

      const waiterPromise = this.channel.page.waitForBlankDone(signal)
      await this.channel.evaluate<void>(`app.open(${JSON.stringify(url)});`)
      await waiterPromise

      return this.activeDocument.$ref()
    })
  }

  /**
   * Opens an image in Photopea from a Buffer.
   * @param path The path to the image file.
   * @param mimetype The MIME type of the image (default: application/octet-stream).
   * @returns Promise that resolves when the image is loaded.
   */
  async openFile(path: string) {
    return await this.restoreActiveDocument(async () => {
      const page = this.channel.page
      const pwPage = page.page

      const abort = new AbortController()

      const blankDonePromise = page.waitForBlankDone(abort.signal)

      const fileChooserPromise = pwPage.waitForEvent("filechooser")
      await pwPage.waitForTimeout(500) // Wait for the filechooser listener to be ready
      await pwPage.keyboard.press("Control+o")
      const fileChooser = await fileChooserPromise

      await fileChooser.setFiles(path)

      const cleanup = abortOnTimeout(
        abort,
        60_000,
        new Error("openFile() timed out")
      )

      try {
        await blankDonePromise
        return this.activeDocument.$ref()
      } finally {
        cleanup()
      }
    })
  }

  async uploadFont(font: Buffer, name: string) {
    return await this.uploadFonts({ [name]: font })
  }

  async uploadFonts(fonts: Record<string, Buffer>) {
    const pwPage = this.channel.page.page
    const fontsBase64 = Object.entries(fonts).map(([name, buffer]) => ({
      name,
      base64: buffer.toString("base64")
    }))

    const toArrayBuffer = await makeBase64ToArrayBufferFnHandle(pwPage)

    await PhotopeaMutexes.of(pwPage).dialogMutex.runExclusive(async () => {
      let dialogListener: ((dialog: Dialog) => void) | null = null
      try {
        const dataTransfer = await pwPage.evaluateHandle(
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

        dialogListener = (dialog: Dialog) => dialog.dismiss()
        pwPage.on("dialog", dialogListener)

        // wait for console message: [{_data: Uint8Array}]
        const consolePromise = pwPage.waitForEvent("console", async (msg) => {
          const args = msg.args()
          if (args.length == 0) return false
          const firstArg = args[0]

          return await firstArg.evaluate(
            (arg) => arg[0]?._data instanceof Uint8Array
          )
        })

        await pwPage.dispatchEvent(
          ".mainblock > .block > .body",
          "drop",
          { dataTransfer },
          { strict: true }
        )

        await consolePromise
      } finally {
        await toArrayBuffer.dispose()
        if (dialogListener) pwPage.off("dialog", dialogListener)
      }
    })
  }

  async pause() {
    return await this.channel.page.page.pause()
  }

  async hasOpenDocument(): Promise<boolean> {
    return await this.channel.evaluate<boolean>(
      "return app.documents.length > 0"
    )
  }

  async tryGetActiveDocument() {
    if (await this.hasOpenDocument()) {
      return await this.activeDocument.$ref()
    }
    return null
  }
}
