import { PhotopeaChannel, PhotopeaChannelEvalError } from "autopea"
import { describe, expect } from "vitest"
import { pageTest } from "./testFixtures"

describe("Concurrency Tests", () => {
  describe("PhotopeaChannel Concurrency", () => {
    pageTest(
      "should handle multiple concurrent evaluations",
      async ({ page }) => {
        const channel = new PhotopeaChannel(page)

        const promises = Array.from({ length: 10 }, (_, i) =>
          channel.evaluate(`return ${i} * 2`),
        )

        const results = await Promise.all(promises)
        expect(results).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18])
      },
    )

    pageTest("should handle concurrent handle operations", async ({ page }) => {
      const channel = new PhotopeaChannel(page)

      // Create multiple handles concurrently
      const handlePromises = Array.from({ length: 5 }, (_, i) =>
        channel.createHandle(`value-${i}`),
      )

      const handles = await Promise.all(handlePromises)
      expect(handles).toHaveLength(5)
      expect(handles.every((h) => typeof h === "string")).toBe(true)

      // Get values concurrently
      const valuePromises = handles.map((handle) =>
        channel.getHandleValue(handle),
      )

      const values = await Promise.all(valuePromises)
      expect(values).toEqual([
        "value-0",
        "value-1",
        "value-2",
        "value-3",
        "value-4",
      ])
    })

    pageTest("should handle mixed operations under load", async ({ page }) => {
      const channel = new PhotopeaChannel(page)

      const operations = [
        // Evaluations
        ...Array.from({ length: 5 }, (_, i) => channel.evaluate(`return ${i}`)),
        // Handle operations
        ...Array.from({ length: 3 }, () => channel.createHandle("test")),
        // Mixed scripts
        channel.evaluate("return Math.PI"),
        channel.evaluate("return 'string'"),
        channel.evaluate("return [1,2,3]"),
      ]

      const results = await Promise.all(operations)

      expect(results).toHaveLength(11)
      expect(results.slice(0, 5)).toEqual([0, 1, 2, 3, 4])
      expect(results.slice(5, 8).every((h) => typeof h === "string")).toBe(true)
      expect(typeof results[8]).toBe("number")
      expect(results[9]).toBe("string")
      expect(results[10]).toEqual([1, 2, 3])
    })
  })

  describe("Timeout Handling in Concurrency", () => {
    pageTest(
      "should handle timeouts in concurrent operations",
      async ({ page }) => {
        function typedExpectToBe<T>(
          value: unknown,
          expected: T,
        ): asserts value is T {
          expect(value).toBe(expected)
        }

        const channel = new PhotopeaChannel(page)
        channel.timeout = 100

        const operations = [
          channel.evaluate<number>("return 42"), // Quick operation
          channel.evaluate<never>("invalid code"), // Will throw
          channel.evaluate<string>('return "success"'), // Another quick operation
        ] as const

        const results = await Promise.allSettled(operations)

        typedExpectToBe(results[0].status, "fulfilled")
        expect(results[0].value).toBe(42)

        typedExpectToBe(results[1].status, "rejected")
        expect(results[1].reason).toBeInstanceOf(PhotopeaChannelEvalError)

        typedExpectToBe(results[2].status, "fulfilled")
        expect(results[2].value).toBe("success")
      },
    )
  })
})
