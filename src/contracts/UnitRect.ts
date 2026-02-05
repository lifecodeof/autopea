import z from "zod"
import { Contract } from "./base/Contract"
import { UnitValue } from "./UnitValue"

export class UnitRect extends Contract {
  async $fetch() {
    const [left, top, right, bottom] = await Promise.all([
      this.left.value.$get(),
      this.top.value.$get(),
      this.right.value.$get(),
      this.bottom.value.$get()
    ])
    return new UnitRectLocal(left, top, right, bottom)
  }

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

  get 0() {
    return this.$(UnitValue)`[0]`
  }

  get 1() {
    return this.$(UnitValue)`[1]`
  }

  get 2() {
    return this.$(UnitValue)`[2]`
  }

  get 3() {
    return this.$(UnitValue)`[3]`
  }

  get width() {
    const right = this.right
    const left = this.left
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

// client-side version of UnitRect for frequent access
export class UnitRectLocal {
  constructor(
    public left: number = 0,
    public top: number = 0,
    public right: number = 0,
    public bottom: number = 0
  ) {}

  get width() {
    return this.right - this.left
  }
  get height() {
    return this.bottom - this.top
  }

  /** Keeps center */
  set width(value: number) {
    const centerX = this.centerX
    this.left = centerX - value / 2
    this.right = centerX + value / 2
  }
  /** Keeps center */
  set height(value: number) {
    const centerY = this.centerY
    this.top = centerY - value / 2
    this.bottom = centerY + value / 2
  }

  get centerX() {
    return this.left + this.width / 2
  }
  get centerY() {
    return this.top + this.height / 2
  }

  set centerX(value: number) {
    const halfWidth = this.width / 2
    this.left = value - halfWidth
    this.right = value + halfWidth
  }
  set centerY(value: number) {
    const halfHeight = this.height / 2
    this.top = value - halfHeight
    this.bottom = value + halfHeight
  }

  get 0() {
    return this.left
  }
  get 1() {
    return this.top
  }
  get 2() {
    return this.right
  }
  get 3() {
    return this.bottom
  }

  toJSON() {
    return {
      left: this.left,
      top: this.top,
      right: this.right,
      bottom: this.bottom
    }
  }

  union(rect: UnitRectLocal) {
    this.left = Math.min(this.left, rect.left)
    this.top = Math.min(this.top, rect.top)
    this.right = Math.max(this.right, rect.right)
    this.bottom = Math.max(this.bottom, rect.bottom)
  }
}
