import { chromium } from "playwright"
import { PhotopeaPage } from "autopea-playwright"
import { App } from "autopea/contracts/App"
import { SaveFormat } from "autopea"

const browser = await chromium.launch({ headless: false })
const page = await PhotopeaPage.openFromBrowser(browser)

// Initialize the App contract
const app = App.of(page)

// Open example document
await app.openFile("example.psd")

// Note that the 'layer' variable holds an expression, not a direct layer reference.
// To assign this to a stable global variable within the Photopea environment, use `.$ref()`.
// Since it is an expression, use `.$eq(undefined)` for null/existence checks.
const layer = app.activeDocument.artLayers.getByName("example-text")

// Change "hello world" text
await layer.textItem.contents.$set("Photopea\nTime")
// This executes:
// app.activeDocument.artLayers.getByName("example-text").textItem.contents = "Photopea\nTime"

// Center the text layer both horizontally and vertically.
// This helper method does not exist in the Photopea ExtendScript environment.
await layer.position({ horizontal: "center", vertical: "center" })

// Add red solid fill effect to the layer.
// This is a helper method also.
await layer.setSolidFill("#ff0000")

// Get PNG buffer for external processing or storage.
const pngBuffer = await app.saveToBuffer(SaveFormat.PNG)
console.log("PNG buffer length:", pngBuffer.length)

// Close the browser
await browser.close()
