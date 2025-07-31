import { Contract } from "./base/Contract"
import z from "zod"

export class PFile extends Contract {
  get fsName() {
    return this.$value(z.string())`.fsName`
  }
  get absoluteURI() {
    return this.$value(z.string())`.absoluteURI`
  }
  get name() {
    return this.$value(z.string())`.name`
  }
  get fullName() {
    return this.$value(z.string())`.fullName`
  }
  get parent() {
    return this.$(PFile)`.parent`
  }
  get exists() {
    return this.$value(z.boolean())`.exists`
  }
  open(mode: string) {
    return this.$eval(z.boolean())`.open(${mode})`
  }
  close() {
    return this.$eval()`.close()`
  }
  read() {
    return this.$eval(z.string())`.read()`
  }
  write(content: string) {
    return this.$eval()`.write(${content})`
  }
  remove() {
    return this.$eval(z.boolean())`.remove()`
  }
}
