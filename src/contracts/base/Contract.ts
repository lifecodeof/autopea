import type { PhotopeaChannel } from "@/Channel"
import { PhotopeaMutexes } from "@/PhotopeaMutexes"
import type { Class, Constructor } from "type-fest"
import { z, ZodType } from "zod"

/**
 * Represents a template function that can be called with template literal syntax.
 * Used by the Contract class helper methods ($, $value, $eval, etc.) to generate
 * remote method calls and property expressions.
 *
 * @template T The return type of the template function
 */
type TemplateFn<T> = (strings: TemplateStringsArray, ...values: unknown[]) => T

/**
 * Options for extending expressions in Contract helper methods.
 *
 * @property wrapParentheses If true, wraps the expression in parentheses
 * @property absolute If true, treats the expression as absolute (doesn't prepend the current expression)
 */
type EvalOptions = {
  wrapParentheses?: boolean
  absolute?: boolean
}

/**
 * Symbol used to mark values that should be treated as raw JavaScript expressions
 * instead of being JSON stringified. Used internally by Contract.transfer().
 */
export const rawStringSymbol = Symbol("rawString")

/**
 * Base class for all Contract types. Contracts are proxies that represent remote objects
 * in Photopea and allow you to safely interact with them from Node.js.
 *
 * The Contract class uses template literal syntax to construct JavaScript expressions
 * that will be evaluated in the remote context (Photopea). It provides several helper
 * methods for different types of remote operations:
 * - `$()` - Get properties that return Contract objects
 * - `$value()` - Get properties that return JSON-serializable values
 * - `$eval()` - Call methods that return void or values
 * - `$evalHandle()` - Call methods that return Contract objects
 *
 * @example
 * // Accessing a property
 * const width = this.$value(z.number())`.width`
 *
 * @example
 * // Calling a method
 * await this.$eval()`.trim()`
 *
 * @example
 * // Getting a nested Contract object
 * const layers = this.$(Layers)`.layers`
 */
export class Contract {
  /**
   * Creates a new Contract instance.
   *
   * @param channel The PhotopeaChannel used to communicate with the remote context
   * @param expression The JavaScript expression representing this remote object
   */
  constructor(
    protected readonly channel: PhotopeaChannel,
    protected readonly expression: string
  ) {}

  /**
   * Gets the typename of the remote object (e.g., "Document", "Layer").
   * This is a SerializableContract that can be awaited to get the actual string value.
   */
  get typename() {
    return this.$value(z.string())`.typename`
  }

  /**
   * Static helper to extract the internal expression from a Contract instance.
   * Used internally to access the remote JavaScript expression.
   *
   * @param instance The Contract instance
   * @returns The JavaScript expression string
   */
  public static getExpression(instance: Contract): string {
    return instance.expression
  }

  /**
   * Static helper to extract the PhotopeaChannel from a Contract instance.
   * Used internally to access the communication channel.
   *
   * @param instance The Contract instance
   * @returns The PhotopeaChannel
   */
  public static getChannel(instance: Contract): PhotopeaChannel {
    return instance.channel
  }

  /**
   * Gets the mutex locks for the underlying Photopea page.
   * Mutexes are used to coordinate concurrent operations and prevent race conditions.
   *
   * @returns PhotopeaMutexes instance for synchronizing access
   */
  get mutexes() {
    return PhotopeaMutexes.of(this.channel.page.page)
  }

  /**
   * Converts a value to its proper string representation for use in remote expressions.
   *
   * Rules:
   * - Contract instances are converted to their expression string
   * - Objects with rawStringSymbol are converted to their raw string value
   * - Undefined values are converted to the string "undefined"
   * - Other values are JSON stringified
   *
   * @param value The value to convert
   * @returns The string representation
   */
  private transfer(value: unknown) {
    if (value instanceof Contract) {
      return value.expression
    } else if (value !== null && typeof value === "object") {
      const rawValue = (value as { [rawStringSymbol]?: unknown })[
        rawStringSymbol
      ]
      if (typeof rawValue === "string") {
        return rawValue
      }
    } else if (typeof value === "undefined") {
      return "undefined"
    } else {
      return JSON.stringify(value)
    }
  }

  /**
   * Converts a template literal into a JavaScript expression string.
   * Interpolates values using the `transfer()` method.
   *
   * @param template The template strings array
   * @param values The interpolated values
   * @returns The complete expression string
   */
  private templateExpression(
    template: TemplateStringsArray,
    values: unknown[]
  ): string {
    return template.reduce((acc, str, i) => {
      const val = i < values.length ? this.transfer(values[i]) : ""
      return acc + str + val
    }, "")
  }

  /**
   * Extends an expression by prepending the current expression and applying options.
   *
   * @param childExpression The child expression to extend
   * @param options Expression options (absolute, wrapParentheses)
   * @returns The complete extended expression
   */
  private extendExpression(
    childExpression: string,
    options: EvalOptions | undefined
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

  /**
   * Helper method to access properties that return Contract objects.
   * Returns a template function that generates the appropriate expression.
   *
   * @template T The type of Contract to return
   * @param constructor The Contract class constructor
   * @param options Optional expression options
   * @returns A template function for building the property access expression
   *
   * @example
   * // Access nested Contract properties
   * const layers = this.$(Layers)`.layers`
   * const color = this.$(SolidColor)`.backgroundColor`
   */
  protected $<T extends Contract>(Ctor: Constructor<T>, options?: EvalOptions) {
    return (template: TemplateStringsArray, ...values: unknown[]) => {
      const childExpression = this.templateExpression(template, values)
      const expression = this.extendExpression(childExpression, options)

      return new Ctor(this.channel, expression)
    }
  }

  /**
   * Helper method to access properties that return JSON-serializable values.
   * Returns a template function that generates a SerializableContract.
   *
   * @template T The type of value to retrieve
   * @param schema The Zod schema for validating the returned value
   * @param options Optional expression options
   * @returns A template function for building the property access expression
   *
   * @example
   * // Access numeric properties
   * const width = this.$value(z.number())`.width`
   * // Access string properties
   * const name = this.$value(z.string())`.name`
   */
  protected $value<T>(schema: ZodType<T>, options?: EvalOptions) {
    return (template: TemplateStringsArray, ...values: unknown[]) => {
      const childExpression = this.templateExpression(template, values)
      const expression = this.extendExpression(childExpression, options)

      return new SerializableContract<T>(this.channel, expression, schema)
    }
  }

  /**
   * Helper method to call methods that return void.
   * Executes the expression and returns a Promise<void>.
   *
   * @param options Optional expression options
   * @returns A template function for building the method call expression
   *
   * @example
   * // Call void methods
   * await this.$eval()`.trim()`
   * await this.$eval()`.remove()`
   */
  protected $eval(options?: EvalOptions): TemplateFn<Promise<void>>
  /**
   * Helper method to call methods that return a value.
   * Executes the expression and returns the value validated against the schema.
   *
   * @template T The return type of the method
   * @param schema The Zod schema for validating the returned value
   * @param options Optional expression options
   * @returns A template function for building the method call expression
   *
   * @example
   * // Call methods that return values
   * const count = await this.$eval(z.number())`.getLength()`
   * const name = await this.$eval(z.string())`.getName()`
   */
  protected $eval<T>(
    schema: ZodType<T>,
    options?: EvalOptions
  ): TemplateFn<Promise<T>>
  protected $eval(
    schemaOrOptions?: ZodType | EvalOptions,
    options?: EvalOptions
  ) {
    let schema: ZodType
    if (schemaOrOptions instanceof ZodType) {
      schema = schemaOrOptions
    } else {
      schema = z.null().optional()
      options = schemaOrOptions
    }

    return async (template: TemplateStringsArray, ...values: unknown[]) => {
      const childExpression = this.templateExpression(template, values)

      const fullExpression = `return ${this.extendExpression(childExpression, options)}`
      const value = await this.channel.evaluate(fullExpression)

      return schema.parse(value)
    }
  }

  /**
   * Helper method to call methods that return Contract objects.
   * Executes the expression and returns a new Contract instance wrapping the result.
   *
   * @template T The type of Contract to return
   * @param constructor The Contract class constructor
   * @param options Optional expression options
   * @returns A template function for building the method call expression
   *
   * @example
   * // Call methods that return Contract objects
   * const newLayer = await this.$evalHandle(Layer)`.duplicate()`
   * const sampler = await this.$evalHandle(ColorSampler)`.create()`
   */
  protected $evalHandle<T extends Contract>(
    Ctor: Constructor<T>,
    options?: EvalOptions
  ): TemplateFn<Promise<T>> {
    return async (template: TemplateStringsArray, ...values: unknown[]) => {
      const childExpression = this.templateExpression(template, values)

      const fullExpression = `return ${this.extendExpression(childExpression, options)}`
      const handle = await this.channel.evaluateHandle(fullExpression)

      const expression = this.channel.getExpressionForHandle(handle)
      return new Ctor(this.channel, expression)
    }
  }

  /**
   * Creates a raw JavaScript expression that won't be JSON stringified.
   * Used to pass arbitrary JavaScript code as values in template expressions.
   *
   * @param str The raw JavaScript expression
   * @returns An object marked with rawStringSymbol
   *
   * @example
   * // Pass a raw expression instead of a value
   * await this.$eval()`.move(${this.$raw('position.x')})`
   */
  protected $raw(str: string) {
    return {
      [rawStringSymbol]: str
    }
  }

  /**
   * Creates a new reference to the same remote object.
   * This is useful for obtaining a fresh handle to an object that may have changed.
   * Useful when dealing with objects that might be garbage collected or refreshing references.
   *
   * @returns A new Contract instance with a fresh reference to the same remote object
   */
  public async $ref() {
    const handle = await this.channel.evaluateHandle(
      `return ${this.expression}`
    )
    const expression = this.channel.getExpressionForHandle(handle)

    const Ctor = this.constructor as Constructor<this>
    return new Ctor(this.channel, expression)
  }

  /**
   * Executes a custom ExtendScript in the remote context with optional parameters.
   * Parameters are automatically made available as `param_<name>` variables in the script.
   *
   * @template T The return type of the script
   * @param script The ExtendScript code to execute
   * @param params Optional object of parameters to pass to the script
   * @returns The result of the script execution, validated if type is generic
   *
   * @example
   * // Execute a script with parameters
   * const result = await this.$script<number>('return param_x + 10', { x: 5 })
   */
  protected async $script<T = void>(
    script: string,
    params: Record<string, unknown> = {}
  ) {
    const paramString = Object.entries(params)
      .map(([key, value]) => `var param_${key} = ${this.transfer(value)};`)
      .join("\n")

    const fullScript = `\n${paramString}\n${script}`
    return await this.channel.evaluate<T>(fullScript)
  }

  /**
   * Creates a ContractCollection class for the given Contract type.
   * Used internally to handle arrays of Contract objects.
   *
   * @template T The Contract type to create a collection for
   * @param constructor The Contract class constructor
   * @returns A ContractCollection subclass configured for the type
   *
   * @example
   * // In a Contract subclass
   * get shapes() {
   *   return this.$(this.$arrayOf(Shape))`.shapes`
   * }
   */
  protected $arrayOf<T extends Contract>(
    Ctor: Constructor<T>
  ): Class<ContractCollection<T>> {
    return class extends ContractCollection<T> {
      protected itemType = () => Ctor
    }
  }

  /**
   * Sets the value of a property or serializable contract.
   * Works for properties that can be assigned to (not computed properties).
   *
   * @param value The value to set (can be a Contract, primitive, or SerializableContract)
   * @returns A Promise that resolves when the value has been set
   *
   * @example
   * // Set a numeric property
   * await layer.opacity.$set(50)
   * // Set a Contract property
   * await layer.color.$set(solidColor)
   */
  async $set(value: InferContractValue<this>): Promise<void> {
    await this.channel.evaluate(`${this.expression} = ${this.transfer(value)}`)
  }

  /**
   * Compares this contract's value with another using loose equality (==).
   * Returns a SerializableContract<boolean> that can be awaited.
   * Note: Loose comparison is intentionally used because Photopea returns false
   * when comparing objects with strict equality (===).
   *
   * @param other The value to compare against
   * @returns A SerializableContract<boolean> for the comparison result
   *
   * @example
   * // Compare with another value
   * const isEqual = await layer.opacity.$eq(100)
   */
  $eq(other: InferContractValue<this>) {
    // Loose comparison is intended
    // Photopea always returns false when comparing objects strictly
    return this.$value(z.boolean(), { wrapParentheses: true })` == ${other}`
  }

  /**
   * Casts this Contract to a different Contract type.
   * Uses the same underlying expression but wraps it in a different Contract class.
   * Useful for when you know the actual type of a remote object differs from its declared type.
   *
   * @template T The Contract type to cast to
   * @param constructor The Contract class to cast to
   * @returns A new Contract instance of the target type with the same expression
   *
   * @example
   * // Cast a Dynamic to a specific type
   * const layer = dynamicObject.$cast(Layer)
   */
  $cast<T extends Contract>(Ctor: Constructor<T>): T {
    return new Ctor(this.channel, this.expression)
  }
}

/**
 * Type helper that infers the value type from a Contract.
 * If a Contract is a PhantomSerializable, returns the serializable value type OR the Contract type.
 * Otherwise, just returns the Contract type itself.
 *
 * This is used to allow flexibility when setting Contract values - you can pass either
 * the serialized type or another Contract instance.
 */
export type InferContractValue<T extends Contract> =
  T extends PhantomSerializable<infer V> ? V | T : T

/**
 * Phantom type interface for marking Contract classes that serialize to a specific type.
 * The __typeMarker is purely for type inference and has no runtime value.
 *
 * @template T The type that this Contract serializes to
 */
interface PhantomSerializable<T> {
  __typeMarker: T
}

/**
 * A Contract that wraps a JSON-serializable value retrieved from the remote context.
 * Extends Contract but represents a primitive value (string, number, boolean, etc.)
 * rather than a remote object.
 *
 * @template T The type of value this Contract represents
 *
 * @example
 * // Created by using $value()
 * const width = this.$value(z.number())`.width`
 * // Can be awaited to get the actual value
 * const widthValue = await width.$get()
 */
export class SerializableContract<T>
  extends Contract
  implements PhantomSerializable<T>
{
  /**
   * Phantom marker for type inference. Not used at runtime.
   */
  __typeMarker!: T

  /**
   * Creates a new SerializableContract.
   *
   * @param channel The PhotopeaChannel for communication
   * @param expression The JavaScript expression representing this value
   * @param schema The Zod schema used to validate the value when retrieved
   */
  constructor(
    channel: PhotopeaChannel,
    expression: string,
    private readonly schema: ZodType<T>
  ) {
    super(channel, expression)
  }

  /**
   * Retrieves and validates the value from the remote context.
   *
   * @returns A Promise that resolves to the retrieved value, validated against the schema
   *
   * @example
   * const width = await layer.width.$get()
   */
  async $get(): Promise<T> {
    const value = await this.channel.evaluate(`return ${this.expression}`)
    return this.schema.parse(value)
  }
}

/**
 * Abstract base class for Contract collections (arrays of Contract objects).
 * Provides methods to access and iterate over elements in a remote array-like collection.
 *
 * Subclasses must implement itemType() to specify the Contract type of the collection's elements.
 *
 * @template T The type of Contract objects in this collection
 *
 * @example
 * // Typical subclass implementation
 * export class Layers extends ContractCollection<Layer> {
 *   protected itemType = () => Layer
 * }
 *
 * @example
 * // Usage
 * const layers = doc.layers
 * const firstLayer = layers.get(0)
 * const count = await layers.length.$get()
 * const allLayers = await layers.toArray()
 */
export abstract class ContractCollection<T extends Contract> extends Contract {
  /**
   * Returns the Contract type constructor for items in this collection.
   * Must be implemented by subclasses.
   */
  protected abstract itemType(): Constructor<T>

  /**
   * Accesses an element in the collection by index.
   * Returns a Contract instance for the element at that index.
   * The element is not retrieved from the remote context immediately.
   *
   * @param index The zero-based index of the element
   * @returns A Contract instance for the element at the specified index
   *
   * @example
   * const firstLayer = layers.get(0)
   * const lastLayer = layers.get(99)
   */
  get(index: number): T {
    return this.$(this.itemType())`[${index}]`
  }

  /**
   * Gets the length (number of items) in the collection.
   * Returns a SerializableContract<number> that can be awaited.
   *
   * @returns A SerializableContract<number> for the collection's length
   *
   * @example
   * const count = await layers.length.$get()
   */
  get length() {
    return this.$value(z.number())`.length`
  }

  /**
   * Converts the collection to an array of Contract instances with fresh references.
   * Each element gets a new handle from the remote context.
   * Useful when you need to ensure fresh references to objects that might be garbage collected.
   *
   * @returns A Promise that resolves to an array of Contract instances
   *
   * @example
   * const allLayers = await layers.toRefArray()
   */
  async toRefArray(): Promise<T[]> {
    const thisHandle = await this.channel.evaluateHandle(
      `return ${this.expression}`
    )
    const handles = await this.channel.iterHandle(thisHandle)
    return handles.map((h) => {
      const expression = this.channel.getExpressionForHandle(h)
      return new (this.itemType())(this.channel, expression)
    })
  }

  /**
   * Converts the collection to an array of Contract instances.
   * Uses the collection's length to create an array of Contract instances
   * without creating new handles for each element.
   *
   * @returns A Promise that resolves to an array of Contract instances
   *
   * @example
   * const allLayers = await layers.toArray()
   */
  async toArray(): Promise<T[]> {
    const length = await this.length.$get()
    return Array.from({ length }, (_, i) => this.get(i))
  }
}

/**
 * A dynamic Contract type that allows accessing arbitrary properties and methods
 * on a remote object without type checking.
 *
 * Useful for working with untyped or dynamically-typed remote objects,
 * or for accessing properties that don't have a specific Contract type defined.
 *
 * @example
 * // Access arbitrary properties
 * const value = await dynamic.$prop('someProperty').$get()
 * // Access nested properties
 * const nested = dynamic.$prop('outer').$prop('inner')
 */
export class Dynamic extends Contract {
  /**
   * Accesses an arbitrary property on the remote object.
   * Returns another Dynamic instance for chaining.
   *
   * @param key The property name to access
   * @returns A Dynamic Contract for the property value
   *
   * @example
   * const customProp = dynamic.$prop('customField')
   * const nested = dynamic.$prop('parent').$prop('child')
   */
  $prop(key: string) {
    return this.$(Dynamic)`[${key}]`
  }
}
