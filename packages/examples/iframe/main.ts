import { IframePhotopeaTransport, PhotopeaChannel } from "autopea"
import { App } from "autopea/contracts/App"

const initialize = () => {
  const iframe = document.createElement("iframe")
  iframe.id = "photopea"
  iframe.title = "Photopea"
  iframe.style.width = "100%"
  iframe.style.height = "100%"
  iframe.style.border = "none"
  iframe.style.display = "none"
  iframe.src = "https://www.photopea.com"

  const transport = new IframePhotopeaTransport()
  iframe.onload = () => void transport.setContentWindow(iframe.contentWindow)

  document.body.appendChild(iframe)

  const channel = new PhotopeaChannel(transport)
  const app = App.of(channel)

  return { channel, transport, app, iframe }
}
