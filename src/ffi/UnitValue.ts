import z from "zod"
import { PhotopeaFFI } from "./base/PhotopeaFFI"

export class UnitValue extends PhotopeaFFI {
  get value() {
    return this.$value(z.number())`.value`
  }
}
