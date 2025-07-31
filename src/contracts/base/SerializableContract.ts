import type { PhotopeaChannel } from "@/PhotopeaChannel"
import type { ZodType } from "zod"
import { Contract } from "./Contract"

export type InferContractValue<T extends Contract> =
  T extends BrandedSerializable<infer V> ? V | T : T

interface BrandedSerializable<T> {
  __typeBrand: T
}

export class SerializableContract<T>
  extends Contract
  implements BrandedSerializable<T>
{
  __typeBrand!: T

  constructor(
    channel: PhotopeaChannel,
    expression: string,
    private readonly schema: ZodType<T>
  ) {
    super(channel, expression)
  }

  async $get(): Promise<T> {
    const value = await this.channel.evaluate("return " + this.expression)
    return this.schema.parse(value)
  }
}
