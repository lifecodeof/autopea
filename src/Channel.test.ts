import { PhotopeaChannel } from "./Channel"
import { pageTest } from "./testFixtures"

pageTest("Handles", async ({ page, expect }) => {
  const channel = new PhotopeaChannel(page)

  const primitiveResult = await channel.evaluate("return 1 + 1")
  expect(primitiveResult).toBe(2)

  const calculatedHandle = await channel.evaluateHandle("return 1 + 1")
  const calculatedHandleValue = await channel.getHandleValue(calculatedHandle)
  expect(calculatedHandleValue).toBe(2)

  const primitiveHandle = await channel.createHandle(2)
  const primitiveHandleValue = await channel.getHandleValue(primitiveHandle)
  expect(primitiveHandleValue).toBe(2)
})

pageTest("Array handles", async ({ page, expect }) => {
  const channel = new PhotopeaChannel(page)

  const arrayHandle = await channel.createHandle([1, 2, 3])
  const arrayHandleValue = await channel.getHandleValue(arrayHandle)
  expect(arrayHandleValue).toEqual([1, 2, 3])

  const arrayOfHandles = await channel.iterHandle(arrayHandle)

  expect(arrayOfHandles).toHaveLength(3)
  expect(arrayOfHandles[0]).be.a("string")
  expect(arrayOfHandles[1]).be.a("string")
  expect(arrayOfHandles[2]).be.a("string")

  const arrayOfHandleValues = await Promise.all(
    arrayOfHandles.map((handle) => channel.getHandleValue(handle))
  )
  expect(arrayOfHandleValues).toEqual([1, 2, 3])
})
