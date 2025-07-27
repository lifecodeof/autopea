import { PhotopeaChannelError } from "@/PhotopeaChannel"
import { suite } from "vitest"
import { sharedChannelTest } from "./testFixtures"

suite.concurrent("evaluate", () => {
  suite.each([
    "1 + 1",
    "null",
    "undefined",
    "true",
    "false",
    "Math.max(1, 2, 3)",
    "Math.min(1, 2, 3)",
    "{ a: 1, b: 2 }",
    "['a', 'b', 'c']"
  ])("%s", (input) => {
    const statement = `return ${input};`
    const expected = Function(statement)()

    sharedChannelTest(
      "should return result",
      async ({ expect, sharedChannel }) => {
        const result = await sharedChannel.evaluate(statement)

        expect(result).toMatchObject(expected)
      }
    )

    sharedChannelTest(
      "should return result via handle and dispose",
      async ({ expect, sharedChannel }) => {
        const handle = await sharedChannel.evaluateHandle(statement)
        const value = await sharedChannel.getHandleValue(handle)

        expect(value).toMatchObject(expected)

        // We can't dispose of the handle if the value is undefined
        if (typeof expected === "undefined") return

        const isDisposed = await sharedChannel.disposeHandle(handle)
        expect(isDisposed).toBe(true)

        const reValue = await sharedChannel.getHandleValue(handle)
        expect(reValue).toBeUndefined()

        const isReDisposed = await sharedChannel.disposeHandle(handle)
        expect(isReDisposed).toBe(false)
      }
    )
  })
})

sharedChannelTest.for([
  "invalid expression",
  "app.nonExistentMethod().prop",
  "app.nonExistentProperty.prop",
  "nonExistentFunction().prop",
  "nonExistentVariable.prop"
])("Throw error for '%s'", async (expression, { expect, sharedChannel }) => {
  // Also wrap in function
  await expect(sharedChannel.evaluate(expression)).rejects.toThrow()
})
