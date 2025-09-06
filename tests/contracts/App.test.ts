import { appTest } from "@/testFixtures"
import { expect } from "vitest"

appTest("App - should get app properties", async ({ app }) => {
  // Test the documents collection which should definitely work
  const documentsLength = await app.documents.length.$get()
  expect(typeof documentsLength).toBe("number")
  expect(documentsLength).toBeGreaterThanOrEqual(0)

  // Test that we can access the documents collection
  const documents = app.documents
  expect(documents).toBeDefined()
})

appTest("App - should check for open documents", async ({ app }) => {
  const hasOpen = await app.hasOpenDocument()
  expect(typeof hasOpen).toBe("boolean")
})

appTest("App - should get active document when available", async ({ app }) => {
  const doc = await app.tryGetActiveDocument()
  // Initially no document, so should be null
  expect(doc).toBeNull()
})

appTest("App - should open document from URL", async ({ app }) => {
  // Use a small test image
  const testImageUrl = "https://picsum.photos/100/100"

  const doc = await app.openFromUrl(testImageUrl)
  expect(doc).toBeDefined()

  // Verify document was opened
  const hasOpen = await app.hasOpenDocument()
  expect(hasOpen).toBe(true)

  const activeDoc = await app.tryGetActiveDocument()
  expect(activeDoc).toBeDefined()
})

appTest("App - should get documents collection", async ({ app }) => {
  const documents = app.documents
  expect(documents).toBeDefined()

  const length = await documents.length.$get()
  expect(typeof length).toBe("number")
  expect(length).toBeGreaterThanOrEqual(0)
})

appTest("App - should get preferences", async ({ app }) => {
  const preferences = app.preferences
  expect(preferences).toBeDefined()

  const typeName = await preferences.typename.$get()
  expect(typeName).toBe("Preferences")
})

appTest("App - should get color properties", async ({ app }) => {
  const fgColor = app.foregroundColor
  expect(fgColor).toBeDefined()

  const bgColor = app.backgroundColor
  expect(bgColor).toBeDefined()

  const fgType = await fgColor.typename.$get()
  expect(fgType).toBe("SolidColor")

  const bgType = await bgColor.typename.$get()
  expect(bgType).toBe("SolidColor")
})
