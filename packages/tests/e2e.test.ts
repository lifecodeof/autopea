import { PDocument } from "@lifecodeof/autopea/contracts/PDocument"
import { appTest } from "./testFixtures"
import { fileURLToPath } from "url"
import { expect } from "vitest"

appTest(
  "Should open and close documents",
  async ({ app }) => {
    const filePath = fileURLToPath(new URL("assets/10x10.psd", import.meta.url))
    const document = await app.openFile(filePath, 1_000) // 1s timeout for test

    expect(document).toBeInstanceOf(PDocument)

    const documentCount = await app.documents.length.$get()
    expect(documentCount).toBe(1)

    await document.close()

    const documentCountAfterClose = await app.documents.length.$get()
    expect(documentCountAfterClose).toBe(0)
  },
  20_000
)
