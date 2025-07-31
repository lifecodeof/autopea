import type { Handleable, PhotopeaChannel } from "@/PhotopeaChannel"
import { PhotopeaFFI } from "./base/PhotopeaFFI"
import { PDocument, PDocuments } from "./PDocument"
import z from "zod"
import { Preferences } from "./Preferences"
import { PFile } from "./PFile"
import { SolidColor } from "./SolidColor"
import { PhotopeaUtils, type SaveFormat } from "@/PhotopeaUtils"

export class App extends PhotopeaFFI {
  static get(channel: PhotopeaChannel) {
    return new App(channel, "app")
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
  utils = () => new PhotopeaUtils(this.channel)
  uploadFont = (font: Buffer, name: string) =>
    this.utils().uploadFont(font, name)
  openFile = (path: string) => this.utils().openFile(path)
  saveToBuffer = (format: SaveFormat, document?: Handleable) =>
    this.utils().saveToBuffer(format, document)
  pause = () => this.channel.page.page.pause()
}
