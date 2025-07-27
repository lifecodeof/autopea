import looksSame from "looks-same"
import { expect } from "vitest"
import type { PhotopeaChannel } from "./PhotopeaChannel"
import { channelTest } from "./testFixtures"
import { PP } from "./PhotopeaTypes"

const getDocumentCount = async (channel: PhotopeaChannel) => {
  const app = await channel.app()
  const docCount = await app.$eval((app) => app.documents.length)
  return docCount
}

const imageUrl = "https://placehold.co/600x400.png"

channelTest("openFromUrl", async ({ channel }) => {
  const utils = channel.utils

  // Expect no documents are open initially
  {
    const docCount = await getDocumentCount(channel)
    expect(docCount).toBe(0)
  }

  await utils.openFromUrl(imageUrl)

  // Expect one document to be open after opening from URL
  {
    const docCount = await getDocumentCount(channel)
    expect(docCount).toBe(1)
  }
})

channelTest("create and open SmartObject", async ({ channel }) => {
  /**
   * NOTE: layer object includes all of their own properties
   * so property changes wont be reflected in the layer object
   * and we need to re-get from document
   */

  const utils = channel.utils
  await utils.openFromUrl(imageUrl)
  const app = await channel.app()

  const getAciveLayer = () =>
    app.$evalHandle((app) => app.activeDocument.activeLayer)

  // Convert active layer to smart object
  await utils.convertToSmartObject(await getAciveLayer())

  // Expect the layer to be a smart object
  const layerKind = await (await getAciveLayer()).$eval((layer) => layer.kind)
  const layerKindName = PP.LayerKind[layerKind]
  expect(layerKindName).toBe("SMARTOBJECT")

  // Open the smart object for editing
  await utils.openSmartObject(await getAciveLayer())

  // Expect two documents to be open after opening the smart object
  {
    const docCount = await getDocumentCount(channel)
    expect(docCount).toBe(2)
  }
})
