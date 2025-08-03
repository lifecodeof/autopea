import type { PhotopeaChannel } from "@/Channel"
import { type Class, type Constructor } from "type-fest"
import { z, type ZodType } from "zod"

type TemplateFn<T> = (strings: TemplateStringsArray, ...values: any[]) => T

type Options = {
  wrapParentheses?: boolean
  absolute?: boolean
}

export const rawStringSymbol = Symbol("rawString")

export class Contract {
  constructor(
    protected readonly channel: PhotopeaChannel,
    protected readonly expression: string
  ) {}

  public static getExpression(instance: Contract): string {
    return instance.expression
  }

  private transfer(value: any) {
    if (value instanceof Contract) {
      return value.expression
    } else if (
      typeof value === "object" &&
      typeof value[rawStringSymbol] === "string"
    ) {
      return value[rawStringSymbol]
    } else if (typeof value === "undefined") {
      return "undefined"
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

  protected $<T extends Contract>(
    constructor: Constructor<T>,
    options?: Options
  ) {
    return (template: TemplateStringsArray, ...values: any[]) => {
      const childExpression = this.templateExpression(template, values)
      const expression = this.extendExpression(childExpression, options)

      return new constructor(this.channel, expression)
    }
  }

  protected $value<T>(schema: ZodType<T>, options?: Options) {
    return (template: TemplateStringsArray, ...values: any[]) => {
      const childExpression = this.templateExpression(template, values)
      const expression = this.extendExpression(childExpression, options)

      return new SerializableContract<T>(this.channel, expression, schema)
    }
  }

  protected $eval(): TemplateFn<Promise<void>>
  protected $eval<T>(schema: ZodType<T>): TemplateFn<Promise<T>>
  protected $eval<T>(schema?: any): TemplateFn<Promise<T>> {
    return async (template: TemplateStringsArray, ...values: any[]) => {
      const childExpression = this.templateExpression(template, values)

      const fullExpression = `${this.expression}${childExpression}`
      const value = await this.channel.evaluate(fullExpression)
      schema ??= z.any()
      return schema.parse(value)
    }
  }

  protected $evalHandle<T extends Contract>(
    constructor: Constructor<T>,
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

    const constructor = this.constructor as Constructor<this>
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

  protected $arrayOf<T extends Contract>(
    constructor: Constructor<T>
  ): Class<ContractCollection<T>> {
    return class extends ContractCollection<T> {
      protected itemType = () => constructor
    }
  }

  async $set(value: InferContractValue<this>): Promise<void> {
    await this.channel.evaluate(`${this.expression} = ${this.transfer(value)}`)
  }
}

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

export abstract class ContractCollection<T extends Contract> extends Contract {
  protected abstract itemType(): Constructor<T>

  get(index: number): T {
    return this.$(this.itemType())`[${index}]`
  }

  get length() {
    return this.$value(z.number())`.length`
  }
}
