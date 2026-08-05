import { expect, suite } from "vitest"
import { channelTest } from "./testFixtures"

channelTest.concurrent.for([
  { script: "return 1 + 1", expected: 2 },
  { script: "var x = 5; var y = 10; return x * y + 2", expected: 52 },
  { script: 'return "Hello World"', expected: "Hello World" },
  { script: "return true && false", expected: false },
  { script: "return [1, 2, 3, 4, 5]", expected: [1, 2, 3, 4, 5] },
  {
    script: "return { name: 'test', value: 42 }",
    expected: { name: "test", value: 42 },
  },
  { script: "return null", expected: null },
])(
  "PhotopeaChannel - should evaluate expressions %#",
  async ({ script, expected }, { channel }) => {
    const result = await channel.evaluate(script)
    expect(result).toEqual(expected)
  },
  120_000,
)

channelTest.concurrent.for([
  { input: "test value" },
  { input: 2 },
  { input: [1, 2, 3] },
  { input: { name: "test", value: 42 } },
  { input: null },
])(
  "PhotopeaChannel - should create and read handles %#",
  async ({ input }, { channel }) => {
    const handle = await channel.createHandle(input)
    const value = await channel.getHandleValue(handle)
    expect(value).toEqual(input)
  },
  120_000,
)

channelTest.concurrent.for([
  { script: "return 1 + 1", expected: 2 },
  { script: "return 'stored value'", expected: "stored value" },
])(
  "PhotopeaChannel - should evaluate handles and read them back %#",
  async ({ script, expected }, { channel }) => {
    const handle = await channel.evaluateHandle(script)
    const value = await channel.getHandleValue(handle)
    expect(value).toEqual(expected)
  },
  120_000,
)

channelTest.concurrent(
  "PhotopeaChannel - should handle large strings with chunking",
  async ({ channel }) => {
    const largeString = "a".repeat(200000) // 200KB string
    const handle = await channel.createHandleChunked(largeString)
    const value = await channel.getHandleValue(handle)
    expect(value).toBe(largeString)
  },
)

channelTest.concurrent(
  "PhotopeaChannel - should iterate over array handles",
  async ({ channel }) => {
    const arrayHandle = await channel.createHandle([1, 2, 3, 4, 5])
    const handles = await channel.iterHandle(arrayHandle)
    expect(handles).toHaveLength(5)

    const values = await Promise.all(
      handles.map((h) => channel.getHandleValue(h)),
    )
    expect(values).toEqual([1, 2, 3, 4, 5])
  },
)

channelTest.concurrent(
  "PhotopeaChannel - should handle complex handle operations",
  async ({ channel }) => {
    const dataHandle = await channel.createHandle({ items: [1, 2, 3] })
    const result = await channel.evaluate(
      `
    var data = value;
    data.items.push(4);
    return data.items.length;
  `,
      { value: dataHandle },
    )

    expect(result).toBe(4)
  },
)

channelTest.concurrent(
  "PhotopeaChannel - should handle complex expressions with handles",
  async ({ channel }) => {
    const handle1 = await channel.createHandle(10)
    const handle2 = await channel.createHandle(20)

    const result = await channel.evaluate("return val1 + val2", {
      val1: handle1,
      val2: handle2,
    })

    expect(result).toBe(30)
  },
)
