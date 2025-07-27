import type { PhotopeaChannel } from "@/PhotopeaChannel"
import { z, type ZodSchema } from "zod/v3"
import { App } from "../App"

export type PhotopeaFFIConstructor<T extends PhotopeaFFI> = new (
  channel: PhotopeaChannel,
  expression: string
) => T

type TemplateFn<T> = (strings: TemplateStringsArray, ...values: any[]) => T

type Options = {
  wrapParentheses?: boolean
  absolute?: boolean
}

export const rawStringSymbol = Symbol("rawString")

export class PhotopeaFFI {
  constructor(
    protected readonly channel: PhotopeaChannel,
    protected readonly expression: string
  ) {}

  protected z = z

  protected get app() {
    return App.get(this.channel)
  }

  private transfer(value: any) {
    if (value instanceof PhotopeaFFI) {
      return value.expression
    } else if (typeof value[rawStringSymbol] === "string") {
      return value[rawStringSymbol]
    } else {
      return JSON.stringify(value)
    }
  }

  private templateExpression(
    template: TemplateStringsArray,
    values: any[]
  ): string {
    return template.reduce((acc, str, i) => {
      const val = i < values.length ? this.transfer(values[i]) : ""
      return acc + str + val
    }, "")
  }

  private extendExpression(
    childExpression: string,
    options: Options | undefined
  ) {
    let expression = childExpression

    if (!options?.absolute) {
      expression = this.expression + expression
    }

    if (options?.wrapParentheses) {
      expression = `(${expression})`
    }

    return expression
  }

  protected $<T extends PhotopeaFFI>(
    constructor: PhotopeaFFIConstructor<T>,
    options?: Options
  ) {
    return (template: TemplateStringsArray, ...values: any[]) => {
      const childExpression = this.templateExpression(template, values)
      const expression = this.extendExpression(childExpression, options)

      return new constructor(this.channel, expression)
    }
  }

  protected $value<T>(schema: ZodSchema<T>, options?: Options) {
    return (template: TemplateStringsArray, ...values: any[]) => {
      const childExpression = this.templateExpression(template, values)
      const expression = this.extendExpression(childExpression, options)

      return new FFIValue<T>(this.channel, expression, schema)
    }
  }

  protected $eval(): TemplateFn<Promise<void>>
  protected $eval<T>(schema: ZodSchema<T>): TemplateFn<Promise<T>>
  protected $eval<T>(schema?: any): TemplateFn<Promise<T>> {
    return async (template: TemplateStringsArray, ...values: any[]) => {
      const childExpression = this.templateExpression(template, values)

      const fullExpression = `${this.expression}${childExpression}`
      const value = await this.channel.evaluate(fullExpression)
      schema ??= this.z.any()
      return schema.parse(value)
    }
  }

  protected $evalHandle<T extends PhotopeaFFI>(
    constructor: PhotopeaFFIConstructor<T>,
    options?: Options
  ): TemplateFn<Promise<T>> {
    return async (template: TemplateStringsArray, ...values: any[]) => {
      const childExpression = this.templateExpression(template, values)

      const fullExpression = `${this.expression}${childExpression}`
      const handle = await this.channel.evaluateHandle(fullExpression)

      const expression = this.channel.getExpressionForHandle(handle)
      return new constructor(this.channel, expression)
    }
  }

  protected $raw(str: string) {
    return {
      [rawStringSymbol]: str
    }
  }

  public async $ref() {
    const handle = await this.channel.evaluateHandle(
      `return ${this.expression}`
    )
    const expression = this.channel.getExpressionForHandle(handle)

    const constructor = this.constructor as PhotopeaFFIConstructor<this>
    return new constructor(this.channel, expression)
  }

  protected async $script<T = void>(
    script: string,
    params: Record<string, any> = {}
  ) {
    const paramString = Object.entries(params)
      .map(([key, value]) => `var param_${key} = ${this.transfer(value)};`)
      .join("\n")

    const fullScript = `\n${paramString}\n${script}`
    return await this.channel.evaluate<T>(fullScript)
  }
}

export class FFIValue<T> extends PhotopeaFFI {
  constructor(
    channel: PhotopeaChannel,
    expression: string,
    private readonly schema: ZodSchema<T>
  ) {
    super(channel, expression)
  }

  async $get(): Promise<T> {
    const value = await this.channel.evaluate("return " + this.expression)
    return this.schema.parse(value)
  }

  async $set(value: T): Promise<void> {
    await this.channel.evaluate(`${this.expression} = ${JSON.stringify(value)}`)
  }
}

export abstract class FFICollection<T extends PhotopeaFFI> extends PhotopeaFFI {
  protected abstract _itemType(): PhotopeaFFIConstructor<T>

  get(index: number): T {
    return this.$(this._itemType())`[${index}]`
  }

  get length() {
    return this.$value(this.z.number())`.length`
  }
}
