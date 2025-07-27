import type { PhotopeaChannel } from "@/PhotopeaChannel"
import { PhotopeaFFI } from "./base/PhotopeaFFI"
import { PDocument } from "./PDocument"

export class App extends PhotopeaFFI {
  static get(channel: PhotopeaChannel) {
    return new App(channel, "app")
  }

  get activeDocument() {
    return this.$(PDocument)`.activeDocument`
  }

  get documents() {
    return this.$(PDocument)`.documents`
  }

  // Utils
  uploadFont = this.channel.utils.uploadFont.bind(this.channel.utils)
  openFile = this.channel.utils.openFile.bind(this.channel.utils)
  saveToBuffer = this.channel.utils.saveToBuffer.bind(this.channel.utils)

  pause = this.channel.page.page.pause.bind(this.channel.page.page)
}
