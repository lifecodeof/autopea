import type { Locator, Page } from "playwright"
import { PhotopeaMutexes } from "./PhotopeaMutexes"

export const clickToolbarButton = async (
  page: Page,
  path: (string | number)[]
) => {
  const [menu, ...submenus] = path

  const locateButton = (
    parent: Locator,
    selector: string,
    segment: string | number
  ) =>
    typeof segment === "number"
      ? parent.locator(selector).nth(segment)
      : parent.locator(selector).getByText(segment, { exact: true })

  await locateButton(
    page.locator(".topbar > span:nth-child(1)"),
    "button",
    menu
  ).click({ timeout: 100 })

  const contextPanel = page.locator(".contextpanel")
  for (const submenu of submenus) {
    await locateButton(contextPanel, ".enab", submenu).click({ timeout: 100 })
  }
}
