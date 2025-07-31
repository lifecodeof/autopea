import type { PhotopeaChannel } from "@/PhotopeaChannel"
import { type Class, type Constructor } from "type-fest"
import { z, type ZodType } from "zod"

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

  public static getExpression(instance: PhotopeaFFI): string {
    return instance.expression
  }

  private transfer(value: any) {
    if (value instanceof PhotopeaFFI) {
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

  protected $value<T>(schema: ZodType<T>, options?: Options) {
    return (template: TemplateStringsArray, ...values: any[]) => {
      const childExpression = this.templateExpression(template, values)
      const expression = this.extendExpression(childExpression, options)

      return new FFIValue<T>(this.channel, expression, schema)
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

  protected $arrayOf<T extends PhotopeaFFI>(
    constructor: PhotopeaFFIConstructor<T>
  ): Class<FFICollection<T>> {
    return class extends FFICollection<T> {
      protected itemType = () => constructor
    }
  }

  async $set(value: this extends FFIValue<infer V> ? V : this): Promise<void> {
    await this.channel.evaluate(`${this.expression} = ${this.transfer(value)}`)
  }
}

export class FFIValue<T> extends PhotopeaFFI {
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

export abstract class FFICollection<T extends PhotopeaFFI> extends PhotopeaFFI {
  protected abstract itemType(): PhotopeaFFIConstructor<T>

  get(index: number): T {
    return this.$(this.itemType())`[${index}]`
  }

  get length() {
    return this.$value(z.number())`.length`
  }
}

export abstract class FFIEither<
  Left extends PhotopeaFFI,
  Right extends PhotopeaFFI
> extends PhotopeaFFI {
  protected constructor(
    channel: PhotopeaChannel,
    expression: string,
    private readonly leftType: PhotopeaFFIConstructor<Left>,
    private readonly rightType: PhotopeaFFIConstructor<Right>
  ) {
    super(channel, expression)
  }

  public static for<Left extends PhotopeaFFI, Right extends PhotopeaFFI>(
    leftType: Constructor<Left, [channel: PhotopeaChannel, expression: string]>,
    rightType: Constructor<
      Right,
      [channel: PhotopeaChannel, expression: string]
    >
  ): PhotopeaFFIConstructor<FFIEither<Left, Right>> {
    return class extends FFIEither<Left, Right> {
      constructor(channel: PhotopeaChannel, expression: string) {
        super(channel, expression, leftType, rightType)
      }
    }
  }

  private get repr() {
    return `FFIEither<${this.leftType.name}, ${this.rightType.name}>`
  }

  async isLeft(): Promise<boolean> {
    const typename = await this.channel.evaluate(
      `return ${this.expression}.typename`
    )
    return typename === this.leftType.prototype.typename
  }

  async isRight(): Promise<boolean> {
    const typename = await this.channel.evaluate(
      `return ${this.expression}.typename`
    )
    return typename === this.rightType.prototype.typename
  }

  async left(): Promise<Left> {
    if (!(await this.isLeft())) {
      throw new Error(`This ${this.repr} instance is not a Left type`)
    }

    return this.unsafeLeft
  }

  async right(): Promise<Right> {
    if (!(await this.isRight())) {
      throw new Error(`This ${this.repr} instance is not a Right type`)
    }

    return this.unsafeRight
  }

  get unsafeLeft(): Left {
    return new this.leftType(this.channel, this.expression)
  }

  get unsafeRight(): Right {
    return new this.rightType(this.channel, this.expression)
  }

  get either(): Left | Right {
    return new this.leftType(this.channel, this.expression)
  }
}

export const FFITypeName = (typename: string) => {
  return <ClassType extends PhotopeaFFIConstructor<any>>(
    target: ClassType,
    context: ClassDecoratorContext<ClassType>
  ) => {
    target.prototype.typename = typename
  }
}
