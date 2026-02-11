import { expect } from "vitest"
import { App } from "@lifecodeof/autopea/contracts/App"
import { Contract, SerializableContract } from "@lifecodeof/autopea/contracts/Contract"
import { appTest } from "../../testFixtures"
import z from "zod"

appTest("Contract - should create basic contract", async ({ app }) => {
  expect(app).toBeInstanceOf(Contract)
  expect(app).toBeInstanceOf(App)
})

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
    z.string()
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

appTest(
  "Contract - should handle $set on mutable properties",
  async ({ app }) => {
    // Test with a property that can be set (if any exist in App)
    // For now, just test that the method exists
    expect(typeof app.$set).toBe("function")
  }
)
