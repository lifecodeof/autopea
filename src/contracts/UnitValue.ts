import z from "zod"
import { Contract } from "./base/Contract"

export class UnitValue extends Contract {
  get value() {
    return this.$value(z.number())`.value`
  }
}
