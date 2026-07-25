export { createPlaywrightCapabilities } from "./capabilities/PlaywrightPhotopeaCapabilities"
export { PhotopeaPage } from "./PhotopeaPage"
export * from "./playwrightLib"
export * from "./toolbar"

// Re-export shared helpers from core for backward compatibility
export {
  abortOnTimeout,
  invariant,
  timeoutAbortSignal,
  waitForEvent,
} from "autopea"
export { TimeoutError } from "autopea"
