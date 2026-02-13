import {
  PhotopeaChannel,
  PhotopeaChannelEvalError,
  PhotopeaChannelScriptError,
} from "@lifecodeof/autopea"
import { describe, expect, test } from "vitest"
import { pageTest } from "./testFixtures"

describe("Error Handling", () => {
  describe("Timeout Errors", () => {
    pageTest(
      "should throw timeout error for long-running scripts",
      async ({ page }) => {
        const channel = new PhotopeaChannel(page)
        channel.timeout = 100 // Short timeout for faster testing

        await expect(
          channel.evaluate("while(true) {}"), // Infinite loop
        ).rejects.toThrow(PhotopeaChannelEvalError)
      },
    )

    pageTest("should respect custom timeout option", async ({ page }) => {
      const channel = new PhotopeaChannel(page)
      channel.timeout = 100 // Short timeout for faster testing

      await expect(
        channel.evaluate("while(true) {}", {}, { timeout: 50 }),
      ).rejects.toThrow(PhotopeaChannelEvalError)
    })

    pageTest("should not timeout for quick operations", async ({ page }) => {
      const channel = new PhotopeaChannel(page)
      channel.timeout = 100

      const result = await channel.evaluate("return 42")
      expect(result).toBe(42)
    })
  })

  describe("Script Evaluation Errors", () => {
    pageTest(
      "should throw eval error for invalid JavaScript",
      async ({ page }) => {
        const channel = new PhotopeaChannel(page)
        channel.timeout = 100 // Short timeout for faster testing

        await expect(channel.evaluate("invalid syntax")).rejects.toThrow(
          PhotopeaChannelEvalError,
        )
      },
    )

    pageTest("should include function body in eval error", async ({ page }) => {
      const channel = new PhotopeaChannel(page)
      channel.timeout = 100 // Short timeout for faster testing

      const script = "nonexistentVariable.property"

      await expect(channel.evaluate(script)).rejects.toThrow(
        PhotopeaChannelEvalError,
      )
      await expect(channel.evaluate(script)).rejects.toMatchObject({
        functionBody: expect.stringContaining(script),
      })
    })

    pageTest(
      "should include handle variables in eval error",
      async ({ page }) => {
        const channel = new PhotopeaChannel(page)
        channel.timeout = 100 // Short timeout for faster testing
        const handle = await channel.createHandle(42)

        await expect(
          channel.evaluate("return invalidVar.invalidOp(testVar)", {
            testVar: handle,
          }),
        ).rejects.toMatchObject({
          handleVars: expect.objectContaining({ testVar: handle }),
        })
      },
    )
  })

  describe("Handle Errors", () => {
    pageTest("should handle invalid handle gracefully", async ({ page }) => {
      const channel = new PhotopeaChannel(page)
      channel.timeout = 100 // Short timeout for faster testing

      // Try to get value of non-existent handle
      const result = await channel.getHandleValue("invalid-handle-123")
      expect(result).toBeNull()
    })

    pageTest("should handle disposing invalid handle", async ({ page }) => {
      const channel = new PhotopeaChannel(page)
      channel.timeout = 100 // Short timeout for faster testing

      const disposed = await channel.disposeHandle("invalid-handle-123")
      expect(disposed).toBe(false)
    })

    pageTest("should handle disposing valid handle", async ({ page }) => {
      const channel = new PhotopeaChannel(page)
      channel.timeout = 100 // Short timeout for faster testing

      const handle = await channel.createHandle("test-value")
      const disposed = await channel.disposeHandle(handle)
      expect(disposed).toBe(true)

      // Second dispose should return false
      const disposedAgain = await channel.disposeHandle(handle)
      expect(disposedAgain).toBe(false)
    })
  })

  describe("Script Errors", () => {
    test("should wrap errors in script error", async () => {
      // Test the error wrapping structure
      const originalError = new Error("Original error")
      const scriptError = new PhotopeaChannelScriptError("test script", {
        cause: originalError,
      })

      expect(scriptError).toBeInstanceOf(PhotopeaChannelScriptError)
      expect(scriptError.cause).toBe(originalError)
    })
  })

  describe("Error Recovery", () => {
    pageTest("should continue working after errors", async ({ page }) => {
      const channel = new PhotopeaChannel(page)
      channel.timeout = 100 // Short timeout for faster testing

      // First operation fails
      try {
        await channel.evaluate("throw new Error('First error')")
      } catch {
        // Expected error
      }

      // Second operation should still work
      const result = await channel.evaluate("return 'success'")
      expect(result).toBe("success")
    })
  })

  describe("Edge Cases", () => {
    pageTest("should handle empty script", async ({ page }) => {
      const channel = new PhotopeaChannel(page)
      channel.timeout = 100 // Short timeout for faster testing

      const result = await channel.evaluate("")
      expect(result).toBeNull()
    })

    pageTest("should handle very large scripts", async ({ page }) => {
      const channel = new PhotopeaChannel(page)
      channel.timeout = 100 // Short timeout for faster testing

      const largeScript = `return "${"1".repeat(10000)}";`
      const result = await channel.evaluate(largeScript)
      expect(result).toBe("1".repeat(10000))
    })

    pageTest(
      "should handle special characters in scripts",
      async ({ page }) => {
        const channel = new PhotopeaChannel(page)
        channel.timeout = 100 // Short timeout for faster testing

        const result = await channel.evaluate("return 'hello\\nworld\\t\\r'")
        expect(result).toBe("hello\nworld\t\r")
      },
    )
  })
})
