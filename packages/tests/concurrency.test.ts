import { describe, expect } from "vitest"
import { PhotopeaChannel } from "@/Channel"
import { PhotopeaMutexes } from "@/PhotopeaMutexes"
import { pageTest } from "@/testFixtures"
import { PhotopeaChannelEvalError } from "@/channel-errors"

describe("Concurrency Tests", () => {
  describe("PhotopeaChannel Concurrency", () => {
    pageTest(
      "should handle multiple concurrent evaluations",
      async ({ page }) => {
        const channel = new PhotopeaChannel(page)

        const promises = Array.from({ length: 10 }, (_, i) =>
          channel.evaluate(`return ${i} * 2`)
        )

        const results = await Promise.all(promises)
        expect(results).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18])
      }
    )

    pageTest("should handle concurrent handle operations", async ({ page }) => {
      const channel = new PhotopeaChannel(page)

      // Create multiple handles concurrently
      const handlePromises = Array.from({ length: 5 }, (_, i) =>
        channel.createHandle(`value-${i}`)
      )

      const handles = await Promise.all(handlePromises)
      expect(handles).toHaveLength(5)
      expect(handles.every((h) => typeof h === "string")).toBe(true)

      // Get values concurrently
      const valuePromises = handles.map((handle) =>
        channel.getHandleValue(handle)
      )

      const values = await Promise.all(valuePromises)
      expect(values).toEqual([
        "value-0",
        "value-1",
        "value-2",
        "value-3",
        "value-4"
      ])
    })

    pageTest("should handle mixed concurrent operations", async ({ page }) => {
      const channel = new PhotopeaChannel(page)

      const operations = [
        channel.evaluate("return Math.random()"),
        channel.createHandle({ test: "object" }),
        channel.evaluate("return Date.now()"),
        channel.createHandle([1, 2, 3]),
        channel.evaluate("return 'string result'")
      ]

      const results = await Promise.all(operations)

      expect(typeof results[0]).toBe("number")
      expect(typeof results[1]).toBe("string") // handle
      expect(typeof results[2]).toBe("number")
      expect(typeof results[3]).toBe("string") // handle
      expect(results[4]).toBe("string result")
    })

    pageTest(
      "should maintain isolation between concurrent scripts",
      async ({ page }) => {
        const channel = new PhotopeaChannel(page)

        const script1 = `
        globalThis.testVar1 = 'script1';
        return globalThis.testVar1;
      `

        const script2 = `
        globalThis.testVar2 = 'script2';
        return globalThis.testVar2;
      `

        const [result1, result2] = await Promise.all([
          channel.evaluate(script1),
          channel.evaluate(script2)
        ])

        expect(result1).toBe("script1")
        expect(result2).toBe("script2")
      }
    )
  })

  describe("PhotopeaMutexes", () => {
    pageTest("should create mutexes instance", async ({ page }) => {
      const mutexes = PhotopeaMutexes.of(page.page)

      expect(mutexes).toBeDefined()
    })

    pageTest("should handle dialog mutex", async ({ page }) => {
      const mutexes = PhotopeaMutexes.of(page.page)

      // Test that dialog mutex exists and is a mutex
      expect(mutexes.dialogMutex).toBeDefined()
      expect(typeof mutexes.dialogMutex.acquire).toBe("function")
      expect(typeof mutexes.dialogMutex.release).toBe("function")
    })

    pageTest("should handle download mutex", async ({ page }) => {
      const mutexes = PhotopeaMutexes.of(page.page)

      expect(mutexes.downloadMutex).toBeDefined()
      expect(typeof mutexes.downloadMutex.acquire).toBe("function")
    })

    pageTest("should handle interaction mutex", async ({ page }) => {
      const mutexes = PhotopeaMutexes.of(page.page)

      expect(mutexes.interactionMutex).toBeDefined()
      expect(typeof mutexes.interactionMutex.acquire).toBe("function")
    })

    pageTest("should handle document mutex", async ({ page }) => {
      const mutexes = PhotopeaMutexes.of(page.page)

      expect(mutexes.documentMutex).toBeDefined()
      expect(typeof mutexes.documentMutex.acquire).toBe("function")
    })

    pageTest("should return same instance for same page", async ({ page }) => {
      const mutexes1 = PhotopeaMutexes.of(page.page)
      const mutexes2 = PhotopeaMutexes.of(page.page)

      expect(mutexes1).toBe(mutexes2)
    })

    pageTest("should handle multiple mutex acquisitions", async ({ page }) => {
      const mutexes = PhotopeaMutexes.of(page.page)

      const results: string[] = []

      const task1 = async () => {
        const release = await mutexes.dialogMutex.acquire()
        results.push("task1-acquired")
        await new Promise((resolve) => setTimeout(resolve, 10))
        results.push("task1-releasing")
        release()
      }

      const task2 = async () => {
        const release = await mutexes.dialogMutex.acquire()
        results.push("task2-acquired")
        await new Promise((resolve) => setTimeout(resolve, 10))
        results.push("task2-releasing")
        release()
      }

      await Promise.all([task1(), task2()])

      // Tasks should acquire mutex sequentially, not concurrently
      expect(results).toEqual([
        "task1-acquired",
        "task1-releasing",
        "task2-acquired",
        "task2-releasing"
      ])
    })
  })

  describe("Channel Dialog Mutex", () => {
    pageTest(
      "should use dialog mutex for concurrent operations",
      async ({ page }) => {
        const channel = new PhotopeaChannel(page)

        const results: string[] = []

        const operation1 = async () => {
          await channel.dialogMutex.acquire()
          results.push("op1-start")
          await new Promise((resolve) => setTimeout(resolve, 20))
          results.push("op1-end")
          channel.dialogMutex.release()
        }

        const operation2 = async () => {
          await channel.dialogMutex.acquire()
          results.push("op2-start")
          await new Promise((resolve) => setTimeout(resolve, 20))
          results.push("op2-end")
          channel.dialogMutex.release()
        }

        await Promise.all([operation1(), operation2()])

        expect(results).toEqual([
          "op1-start",
          "op1-end",
          "op2-start",
          "op2-end"
        ])
      }
    )

    pageTest("should handle dialog mutex with errors", async ({ page }) => {
      const channel = new PhotopeaChannel(page)

      const operation = async () => {
        await channel.dialogMutex.acquire()
        try {
          throw new Error("Test error")
        } finally {
          channel.dialogMutex.release()
        }
      }

      await expect(operation()).rejects.toThrow("Test error")

      // Mutex should still be releasable after error
      const release = await channel.dialogMutex.acquire()
      expect(typeof release).toBe("function")
      release()
    })
  })

  describe("Stress Testing", () => {
    pageTest("should handle high concurrency load", async ({ page }) => {
      const channel = new PhotopeaChannel(page)

      const numOperations = 20
      const promises = Array.from({ length: numOperations }, (_, i) =>
        channel.evaluate(`return ${i}`)
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(numOperations)
      expect(results).toEqual(
        Array.from({ length: numOperations }, (_, i) => i)
      )
    })

    pageTest(
      "should handle rapid handle creation/disposal",
      async ({ page }) => {
        const channel = new PhotopeaChannel(page)

        const handles: string[] = []

        // Create handles rapidly
        for (let i = 0; i < 10; i++) {
          const handle = await channel.createHandle(`test-${i}`)
          handles.push(handle)
        }

        // Dispose handles rapidly
        const disposeResults = await Promise.all(
          handles.map((handle) => channel.disposeHandle(handle))
        )

        expect(disposeResults.every((result) => result === true)).toBe(true)
      }
    )

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
        channel.evaluate("return [1,2,3]")
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
        const channel = new PhotopeaChannel(page)
        channel.timeout = 100

        const operations = [
          channel.evaluate("return 42"), // Quick operation
          channel.evaluate("invalid code"), // Will throw
          channel.evaluate('return "success"'), // Another quick operation
        ]

        const results = await Promise.allSettled(operations)

        expect(results[0].status).toBe("fulfilled")
        expect((results[0] as PromiseFulfilledResult<any>).value).toBe(42)

        expect(results[1].status).toBe("rejected")
        expect((results[1] as PromiseRejectedResult).reason).toBeInstanceOf(
          PhotopeaChannelEvalError
        )

        expect(results[2].status).toBe("fulfilled")
        expect((results[2] as PromiseFulfilledResult<any>).value).toBe(
          "success"
        )
      }
    )
  })
})
