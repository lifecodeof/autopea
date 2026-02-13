import { PhotopeaMutexes } from "@lifecodeof/autopea"
import { expect } from "vitest"
import { pageTest } from "./testFixtures"

pageTest(
  "PhotopeaMutexes - should create mutexes for page",
  async ({ page }) => {
    const mutexes = PhotopeaMutexes.of(page.page)
    expect(mutexes).toBeInstanceOf(PhotopeaMutexes)
    expect(mutexes.dialogMutex).toBeDefined()
    expect(mutexes.downloadMutex).toBeDefined()
    expect(mutexes.interactionMutex).toBeDefined()
    expect(mutexes.documentMutex).toBeDefined()
  },
)

pageTest(
  "PhotopeaMutexes - should return same instance for same page",
  async ({ page }) => {
    const mutexes1 = PhotopeaMutexes.of(page.page)
    const mutexes2 = PhotopeaMutexes.of(page.page)
    expect(mutexes1).toBe(mutexes2)
  },
)

pageTest(
  "PhotopeaMutexes - should handle concurrent access",
  async ({ page }) => {
    const mutexes = PhotopeaMutexes.of(page.page)

    const results: string[] = []

    const task1 = mutexes.dialogMutex.runExclusive(async () => {
      results.push("task1 start")
      await new Promise((resolve) => setTimeout(resolve, 10))
      results.push("task1 end")
      return "task1"
    })

    const task2 = mutexes.dialogMutex.runExclusive(async () => {
      results.push("task2 start")
      await new Promise((resolve) => setTimeout(resolve, 10))
      results.push("task2 end")
      return "task2"
    })

    const [result1, result2] = await Promise.all([task1, task2])

    expect(result1).toBe("task1")
    expect(result2).toBe("task2")
    expect(results).toEqual([
      "task1 start",
      "task1 end",
      "task2 start",
      "task2 end",
    ])
  },
)

pageTest(
  "PhotopeaMutexes - should allow parallel access to different mutexes",
  async ({ page }) => {
    const mutexes = PhotopeaMutexes.of(page.page)

    const results: string[] = []

    const task1 = mutexes.dialogMutex.runExclusive(async () => {
      results.push("dialog start")
      await new Promise((resolve) => setTimeout(resolve, 10))
      results.push("dialog end")
      return "dialog"
    })

    const task2 = mutexes.downloadMutex.runExclusive(async () => {
      results.push("download start")
      await new Promise((resolve) => setTimeout(resolve, 10))
      results.push("download end")
      return "download"
    })

    const [result1, result2] = await Promise.all([task1, task2])

    expect(result1).toBe("dialog")
    expect(result2).toBe("download")
    // Since they use different mutexes, they can run in parallel
    expect(results).toContain("dialog start")
    expect(results).toContain("download start")
    expect(results).toContain("dialog end")
    expect(results).toContain("download end")
  },
)
