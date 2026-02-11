import z from "zod"
import { Contract } from "./Contract"

export class Preferences extends Contract {
  get additionalPluginFolder() {
    return this.$value(z.string())`.additionalPluginFolder`
  }
  get askBeforeSavingLayeredTIFF() {
    return this.$value(z.boolean())`.askBeforeSavingLayeredTIFF`
  }
  get autoUpdateOpenDocuments() {
    return this.$value(z.boolean())`.autoUpdateOpenDocuments`
  }
  get beepWhenDone() {
    return this.$value(z.boolean())`.beepWhenDone`
  }
  get colorPicker() {
    return this.$value(z.string())`.colorPicker`
  }
  get dynamicColorSliders() {
    return this.$value(z.boolean())`.dynamicColorSliders`
  }
  get exportClipboard() {
    return this.$value(z.boolean())`.exportClipboard`
  }
  get keyboardZoomResizesWindows() {
    return this.$value(z.boolean())`.keyboardZoomResizesWindows`
  }
  get maximizeCompatibility() {
    return this.$value(z.boolean())`.maximizeCompatibility`
  }
  get recentFileListLength() {
    return this.$value(z.number())`.recentFileListLength`
  }
  get rulerUnits() {
    return this.$value(z.string())`.rulerUnits`
  }
  get typeUnits() {
    return this.$value(z.string())`.typeUnits`
  }
  get useLowerCaseExtension() {
    return this.$value(z.boolean())`.useLowerCaseExtension`
  }
  get savePaletteLocations() {
    return this.$value(z.boolean())`.savePaletteLocations`
  }
  get showToolTips() {
    return this.$value(z.boolean())`.showToolTips`
  }
  get smartQuotes() {
    return this.$value(z.boolean())`.smartQuotes`
  }
  get showSliceNumber() {
    return this.$value(z.boolean())`.showSliceNumber`
  }
  get textFontSize() {
    return this.$value(z.number())`.textFontSize`
  }
  get useShiftKeyForToolSwitch() {
    return this.$value(z.boolean())`.useShiftKeyForToolSwitch`
  }
  get useVideoAlpha() {
    return this.$value(z.boolean())`.useVideoAlpha`
  }
  get windowsThumbnail() {
    return this.$value(z.boolean())`.windowsThumbnail`
  }
}
