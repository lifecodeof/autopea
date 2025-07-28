import z from "zod"
import { PhotopeaFFI } from "./base/PhotopeaFFI"
import { UnitValue } from "./UnitValue"

export class UnitRect extends PhotopeaFFI {
  get left() {
    return this[0]
  }

  get top() {
    return this[1]
  }

  get right() {
    return this[2]
  }

  get bottom() {
    return this[3]
  }

  get [0]() {
    return this.$(UnitValue)`[0]`
  }

  get [1]() {
    return this.$(UnitValue)`[1]`
  }

  get [2]() {
    return this.$(UnitValue)`[2]`
  }

  get [3]() {
    return this.$(UnitValue)`[3]`
  }

  get width() {
    const left = this.left
    const right = this.right
    return this.$value(z.number(), {
      absolute: true,
      wrapParentheses: true
    })`${right} - ${left}`
  }

  get height() {
    const top = this.top
    const bottom = this.bottom
    return this.$value(z.number(), {
      absolute: true,
      wrapParentheses: true
    })`${bottom} - ${top}`
  }

  get centerX() {
    const left = this.left
    const right = this.right
    return this.$value(z.number(), {
      absolute: true,
      wrapParentheses: true
    })`${left} + ((${right} - ${left}) / 2)`
  }

  get centerY() {
    const top = this.top
    const bottom = this.bottom
    return this.$value(z.number(), {
      absolute: true,
      wrapParentheses: true
    })`${top} + ((${bottom} - ${top}) / 2)`
  }
}
