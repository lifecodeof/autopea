import { chromium } from "playwright"
import { PhotopeaPage } from "@lifecodeof/autopea-pw"
import { App } from "@lifecodeof/autopea/contracts/App"
import { SaveFormat } from "@lifecodeof/autopea"

const browser = await chromium.launch()
const page = await PhotopeaPage.openFromBrowser(browser)

// Initialize the App contract
const app = App.of(page)

// Open example document
await app.openFile("example.psd")

// Note that `layer` variable hold expression, not real layer reference.
// If you want to assign it to a stable global variable
// inside photopea realm use `.$ref()`.
//
// And since it holds expression rather than a value you cannot null check it
// directly. You should use `.$eq(undefined)`
const layer = app.activeDocument.artLayers.getByName("example-text")

// Change "hello world" to "bye world"
await layer.textItem.contents.$set("bye world")

// This is a helper method that does not exists in photopea extendscript
// environment. It will center the text layer both horizontally and vertically.
await layer.position({ horizontal: "center", vertical: "center" })

// Get png buffer to use or write it to somewhere else.
const pngBuffer = await app.saveToBuffer(SaveFormat.PNG)
console.log("PNG buffer length:", pngBuffer.length)

// Close the browser
await browser.close()
