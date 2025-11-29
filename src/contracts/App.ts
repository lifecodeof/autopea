import { PhotopeaChannel } from "@/Channel"
import { PhotopeaMutexes } from "@/PhotopeaMutexes"
import type { Dialog } from "playwright"
import { errors as pwErrors } from "playwright"
import z from "zod"
import { abortOnTimeout, timeoutAbortSignal } from "../helpers"
import { makeBase64ToArrayBufferFnHandle } from "../playwrightLib"
import { Contract } from "./base/Contract"
import { PDocument, PDocuments, type SaveFormat } from "./PDocument"
import { PFile } from "./PFile"
import { Preferences } from "./Preferences"
import { SolidColor } from "./SolidColor"
import { PhotopeaPage } from "@/PhotopeaPage"
import { clickToolbarButton } from "@/toolbar"

export class App extends Contract {
  static of(obj: PhotopeaChannel | Contract | PhotopeaPage) {
    if (obj instanceof PhotopeaPage) obj = new PhotopeaChannel(obj)
    if (obj instanceof Contract) obj = Contract.getChannel(obj)

    return new App(obj, "app")
  }

  get activeDocument() {
    return this.$(PDocument)`.activeDocument`
  }

  get documents() {
    return this.$(PDocuments)`.documents`
  }

  get version() {
    return this.$value(z.string())`.version`
  }
  get preferences() {
    return this.$(Preferences)`.preferences`
  }
  get backgroundColor() {
    return this.$(SolidColor)`.backgroundColor`
  }
  get foregroundColor() {
    return this.$(SolidColor)`.foregroundColor`
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
    return await this.mutexes.documentMutex.runExclusive(async () => {
      const signal = timeoutAbortSignal(5 * 60 * 1000) // 5 minutes

      await Promise.all([
        this.channel.page.waitForBlankDone(signal),
        this.channel.evaluate<void>(`app.open(${JSON.stringify(url)});`)
      ])

      return this.activeDocument.$ref()
    })
  }

  /**
   * Opens an image in Photopea from a Buffer.
   * @param path The path to the image file.
   * @param mimetype The MIME type of the image (default: application/octet-stream).
   * @returns Promise that resolves when the image is loaded.
   */
  async openFile(path: string, timeout = 5 * 60 * 1000) {
    const page = this.channel.page
    const pwPage = page.page

    const abort = new AbortController()

    return await this.mutexes.interactionMutex.runExclusive(async () => {
      const [fileChooser] = await Promise.all([
        pwPage.waitForEvent("filechooser", { timeout }),
        clickToolbarButton(page.page, [1, 2]) // File > Open
      ])

      return await this.mutexes.documentMutex.runExclusive(async () => {
        // TODO: Promise.all()
        const blankDonePromise = page.waitForBlankDone(abort.signal)
        await fileChooser.setFiles(path)

        const cleanup = abortOnTimeout(
          abort,
          timeout,
          new Error(`openFile() timed out after ${timeout}ms`)
        )

        try {
          await blankDonePromise
          return this.activeDocument.$ref()
        } finally {
          cleanup()
        }
      })
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

        // Photopea no longer logs array with Uint8Array
        const consolePromise = pwPage.waitForEvent("console", async (msg) => {
          const args = msg.args()
          if (args.length == 0) return false
          const firstArg = args[0]

          const message = await firstArg.jsonValue()
          if (
            typeof message === "string" &&
            /Alert: Font .* loaded/.test(message)
          )
            return true

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

        await consolePromise.catch((err) => {
          // Timeouts are fine here
          if (!(err instanceof pwErrors.TimeoutError)) throw err
        })
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
