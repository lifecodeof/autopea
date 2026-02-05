import readline from "node:readline"
import { chromium } from "playwright"
import { PhotopeaChannel } from "@/Channel"
import { PhotopeaPage } from "@/PhotopeaPage"

const browser = await chromium.launch({ headless: false })
const page = await PhotopeaPage.openFromBrowser(await browser.newContext())
const channel = new PhotopeaChannel(page)
channel.timeout = 500

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "photopea> ",
})

rl.on("line", async (line) => {
  try {
    const result = await channel.evaluate(`return ${line}`)
    console.log(result)
  } catch (error) {
    console.error(error)
  }

  rl.prompt()
})

rl.on("SIGINT", async () => {
  await browser.close()
  rl.close()
  process.exit(0)
})

rl.prompt()
