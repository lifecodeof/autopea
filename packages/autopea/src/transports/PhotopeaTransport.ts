import type { PhotopeaCapabilities } from "../capabilities/PhotopeaCapabilities"

export type PhotopeaTransportEventMap = {
  /**
   * Emitted when a blank message is received from Photopea. Photopea indicates
   * things like document load completion by sending an empty message.
   *
   * Transport implementors should buffer messages between "done" messages to
   * determine whether the message is really blank or just a part of a larger message.
   */
  blankMessage: () => void

  /** Emitted when an error is thrown in the Photopea realm.
   * Some transports may not support this event. */
  pageerror: (error: Error) => void

  /** Emitted when `_pp_sendResponse` callback is called from Photopea realm. */
  response: (id: string, reqType: string, data: unknown) => void
}

export interface PhotopeaTransport {
  /** Registers an event handler for a specific Photopea transport event.
   * @param event The name of the event to listen for.
   * @param handler The callback function to invoke when the event occurs.
   * @returns A function that can be called to unregister the event handler.
   */
  on<K extends keyof PhotopeaTransportEventMap>(
    event: K,
    handler: PhotopeaTransportEventMap[K],
  ): () => void

  /**
   * Sends a message to the Photopea iframe.
   * @param message The message string to send.
   *
   * Does not wait for acknowledgment from Photopea.
   */
  sendMessage(message: string): Promise<void>

  /**
   * Provides access to the capabilities of the Photopea transport.
   * Some contract methods will use this object if there is no ActionScript
   * way to achieve the desired functionality.
   */
  get capabilities(): PhotopeaCapabilities
}
