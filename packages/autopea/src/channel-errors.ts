import type { HandleVars, PhotopeaChannel } from "./Channel"
import { Contract } from "./contracts/Contract"

export class PhotopeaChannelError extends Error {}
export class PhotopeaChannelLogicError extends PhotopeaChannelError {}
export class PhotopeaChannelTimeoutError extends PhotopeaChannelError {}
export class PhotopeaChannelPageError extends PhotopeaChannelError {}

export class PhotopeaChannelScriptError extends PhotopeaChannelError {}

export class PhotopeaChannelEvalError extends PhotopeaChannelError {
  #channel: PhotopeaChannel

  constructor(
    channel: PhotopeaChannel,
    public functionBody: string,
    public handleVars: HandleVars,
    options?: ErrorOptions,
  ) {
    super(`Error evaluating script: ${functionBody}`, options)
    this.#channel = channel
  }

  getChannel() {
    return this.#channel
  }

  async getVariables() {
    const variables: Record<string, Contract> = {}

    for (const [key, value] of Object.entries(this.handleVars)) {
      const contract =
        value instanceof Contract ? value : new Contract(this.#channel, value)

      variables[key] = contract
    }

    // Extract additional handleVars from the script
    const handleRegex = /globalThis\["(__ppHandle__\w+)"\]/g
    let match = handleRegex.exec(this.functionBody)
    while (match !== null) {
      const handle = match[1]
      const dynamicHandle = new Contract(this.#channel, handle)

      variables[handle] = dynamicHandle
      match = handleRegex.exec(this.functionBody)
    }

    return variables
  }

  async reprVariables() {
    const result: Record<string, string> = {}
    const variables = await this.getVariables()
    for (const [key, contract] of Object.entries(variables)) {
      result[key] = await contract.typename.$get().catch(() => "?")
    }
    return result
  }

  async display() {
    const reprs = await this.reprVariables()

    console.error(this, "Variables:", reprs)
  }
}
