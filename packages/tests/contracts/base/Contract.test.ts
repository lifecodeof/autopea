import { App } from "autopea/contracts/App"
import { Contract, SerializableContract } from "autopea/contracts/Contract"
import { expect } from "vitest"
import z from "zod"
import { appTest } from "../../testFixtures"

appTest("Contract - should get typename", async ({ app }) => {
  const typeName = await app.typename.$get()
  expect(typeof typeName).toBe("string")
  expect(typeName).toBe("Application")
})

appTest("Contract - should handle $ref", async ({ app }) => {
  const ref = await app.$ref()
  expect(ref).toBeInstanceOf(App)
  expect(ref).not.toBe(app) // Should be a new instance
})

appTest("Contract - should handle $eq comparison", async ({ app }) => {
  // Create a simple string contract for testing
  const channel = Contract.getChannel(app)
  const stringContract = new SerializableContract(
    channel,
    '"test string"',
    z.string(),
  )

  // Test that $eq returns a SerializableContract<boolean>
  const comparisonContract = stringContract.$eq("test string")
  expect(comparisonContract).toBeInstanceOf(SerializableContract)
  await comparisonContract.$get()

  // Test that we can get a boolean result
  const result = await comparisonContract.$get()
  expect(result).toBe(true)

  // Test with different string - should also return a boolean
  const differentComparison = stringContract.$eq("different string")
  const differentResult = await differentComparison.$get()
  expect(differentResult).toBe(false)
})
