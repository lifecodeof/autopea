import type { Page } from "playwright"
import { App } from "@/contracts/App"
import type { ArtLayer } from "@/contracts/ArtLayer"
import type { PDocument } from "@/contracts/PDocument"
import type { PhotopeaCapabilities } from "./PhotopeaCapabilities"

// A local polyfill to make error messages available in production.
function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export const createPlaywrightPhotopeaCapabilities = (
  page: Page,
): PhotopeaCapabilities => {
  // Use `page` instead of `Contract.channel.page.page`

  return {
    openSmartObject(this: ArtLayer): Promise<PDocument> {
      return this.mutexes.documentMutex.runExclusive(async () => {
        const pwPage = page

        const panelhead = await pwPage
          .locator(".mainblock > .block > .panelhead")
          .elementHandle()
        invariant(panelhead, "Cannot find panelhead element")

        const documentCountBefore = await panelhead.evaluate(
          (el) => el.childElementCount,
        )

        await App.of(this).activeDocument.activeLayer.$set(this)

        await this.$eval({
          absolute: true,
        })`executeAction(stringIDToTypeID("placedLayerEditContents"), null, DialogModes.NO)`

        // Wait for new document tab to open
        await pwPage.waitForFunction(
          ([panelhead, count]) => panelhead.childElementCount === count + 1,
          [panelhead, documentCountBefore] as const,
        )

        return await App.of(this).activeDocument.$ref()
      })
    },
  }
}
