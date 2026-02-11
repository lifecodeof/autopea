import { PhotopeaChannelEvalError, PhotopeaChannelScriptError } from "@lifecodeof/autopea"
import { channelTest } from "./testFixtures"
import { expect } from "vitest"

channelTest("PhotopeaChannel - should evaluate simple expressions", async ({ channel }) => {
  const result = await channel.evaluate("return 1 + 1")
  expect(result).toBe(2)
})

channelTest("PhotopeaChannel - should evaluate complex expressions", async ({ channel }) => {
  const result = await channel.evaluate(`
    var x = 5;
    var y = 10;
    return x * y + 2;
  `)
  expect(result).toBe(52)
})

channelTest("PhotopeaChannel - should handle string returns", async ({ channel }) => {
  const result = await channel.evaluate('return "Hello World"')
  expect(result).toBe("Hello World")
})

channelTest("PhotopeaChannel - should handle boolean returns", async ({ channel }) => {
  const result = await channel.evaluate("return true && false")
  expect(result).toBe(false)
})

channelTest("PhotopeaChannel - should handle array returns", async ({ channel }) => {
  const result = await channel.evaluate("return [1, 2, 3, 4, 5]")
  expect(result).toEqual([1, 2, 3, 4, 5])
})

channelTest("PhotopeaChannel - should handle object returns", async ({ channel }) => {
  const result = await channel.evaluate("return { name: 'test', value: 42 }")
  expect(result).toEqual({ name: "test", value: 42 })
})

channelTest("PhotopeaChannel - should create and get handle values", async ({ channel }) => {
  const handle = await channel.createHandle("test value")
  const value = await channel.getHandleValue(handle)
  expect(value).toBe("test value")
})

channelTest("PhotopeaChannel - should evaluate with handle variables", async ({ channel }) => {
  const handle = await channel.createHandle(10)
  const result = await channel.evaluate("return value * 2", { value: handle })
  expect(result).toBe(20)
})

channelTest("PhotopeaChannel - should evaluate handle and return handle", async ({ channel }) => {
  const resultHandle = await channel.evaluateHandle("return 'stored value'")
  const value = await channel.getHandleValue(resultHandle)
  expect(value).toBe("stored value")
})

channelTest("PhotopeaChannel - should handle large strings with chunking", async ({ channel }) => {
  const largeString = "a".repeat(200000) // 200KB string
  const handle = await channel.createHandleChunked(largeString)
  const value = await channel.getHandleValue(handle)
  expect(value).toBe(largeString)
})

channelTest("PhotopeaChannel - should iterate over array handles", async ({ channel }) => {
  const arrayHandle = await channel.createHandle([1, 2, 3, 4, 5])
  const handles = await channel.iterHandle(arrayHandle)
  expect(handles).toHaveLength(5)

  const values = await Promise.all(handles.map(h => channel.getHandleValue(h)))
  expect(values).toEqual([1, 2, 3, 4, 5])
})

channelTest("PhotopeaChannel - should handle timeouts", async ({ channel }) => {
  channel.timeout = 100 // Short timeout for faster testing

  await expect(
    channel.evaluate(`
      // Simulate long operation
      var start = Date.now();
      while (Date.now() - start < 1000) {}
      return "done";
    `, {}, { timeout: 100 })
  ).rejects.toThrow(PhotopeaChannelEvalError)
})

channelTest("PhotopeaChannel - should handle script errors", async ({ channel }) => {
  channel.timeout = 100 // Short timeout for faster testing

  await expect(
    channel.evaluate("invalid code")
  ).rejects.toThrow(PhotopeaChannelEvalError)
})

channelTest("PhotopeaChannel - should handle null returns", async ({ channel }) => {
  const result = await channel.evaluate("return null")
  expect(result).toBeNull()
})

channelTest("PhotopeaChannel - should handle concurrent evaluations", async ({ channel }) => {
  const promises: Promise<any>[] = []
  for (let i = 0; i < 10; i++) {
    promises.push(channel.evaluate(`return ${i}`))
  }

  const results = await Promise.all(promises)
  expect(results.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
})

channelTest("PhotopeaChannel - should handle complex handle operations", async ({ channel }) => {
  const dataHandle = await channel.createHandle({ items: [1, 2, 3] })
  const result = await channel.evaluate(`
    var data = value;
    data.items.push(4);
    return data.items.length;
  `, { value: dataHandle })

  expect(result).toBe(4)
})

channelTest("PhotopeaChannel - should create and retrieve handle values", async ({ channel }) => {
  const handle = await channel.evaluateHandle("return 1 + 1")
  const value = await channel.getHandleValue(handle)
  expect(value).toBe(2)
})

channelTest("PhotopeaChannel - should create primitive handles", async ({ channel }) => {
  const handle = await channel.createHandle(2)
  const value = await channel.getHandleValue(handle)
  expect(value).toBe(2)
})

channelTest("PhotopeaChannel - should handle array values", async ({ channel }) => {
  const handle = await channel.createHandle([1, 2, 3])
  const value = await channel.getHandleValue(handle)
  expect(value).toEqual([1, 2, 3])
})

channelTest("PhotopeaChannel - should handle object values", async ({ channel }) => {
  const testObject = { name: "test", value: 42 }
  const handle = await channel.createHandle(testObject)
  const value = await channel.getHandleValue(handle)
  expect(value).toEqual(testObject)
})

channelTest("PhotopeaChannel - should handle string values", async ({ channel }) => {
  const handle = await channel.createHandle("hello world")
  const value = await channel.getHandleValue(handle)
  expect(value).toBe("hello world")
})

channelTest("PhotopeaChannel - should dispose handles correctly", async ({ channel }) => {
  const handle = await channel.createHandle("test value")
  expect(await channel.disposeHandle(handle)).toBe(true)
  expect(await channel.disposeHandle(handle)).toBe(false) // Already disposed
})

channelTest("PhotopeaChannel - should handle null value", async ({ channel }) => {
  const nullHandle = await channel.createHandle(null)
  const nullValue = await channel.getHandleValue(nullHandle)
  expect(nullValue).toBeNull()
})

channelTest("PhotopeaChannel - should handle complex expressions with handles", async ({ channel }) => {
  const handle1 = await channel.createHandle(10)
  const handle2 = await channel.createHandle(20)

  const result = await channel.evaluate("return val1 + val2", {
    val1: handle1,
    val2: handle2
  })

  expect(result).toBe(30)
})
