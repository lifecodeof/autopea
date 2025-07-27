import { PP } from "@/PhotopeaTypes"
import { expect, test, vi } from "vitest"
import { PhotopeaChannel } from "@/PhotopeaChannel"
import { PhotopeaHandle } from "./PhotopeaHandle"

test("$eval should evaluate", async () => {
  const channel = new PhotopeaChannel(null as any)
  const handle = new PhotopeaHandle<PP.Application>(channel, "testHandle")

  const channelSpy = vi.spyOn(channel, "evaluate").mockResolvedValue("Layer 1")

  const result = await handle.$eval(
    (proxy) => proxy.activeDocument.layers[0].name
  )

  expect(result).toBe("Layer 1")
  expect(channelSpy).toBeCalledTimes(1)
  expect(channelSpy.mock.lastCall![0]).toBe(
    `return $self.activeDocument.layers[0].name;`
  )
  expect(channelSpy.mock.lastCall![1]).toEqual({
    $self: handle.handle
  })
})

test("$set should set values", async () => {
  const channel = new PhotopeaChannel(null as any)
  const handle = new PhotopeaHandle<PP.Application>(channel, "testHandle")

  const channelSpy = vi.spyOn(channel, "evaluate").mockResolvedValue(undefined)

  await handle.$set((proxy) => proxy.activeDocument.layers[0].name, "New Layer")
  expect(channelSpy).toBeCalledTimes(1)
  expect(channelSpy.mock.lastCall![0]).toBe(
    `return $self.activeDocument.layers[0].name = "New Layer";`
  )
  expect(channelSpy.mock.lastCall![1]).toEqual({
    $self: handle.handle
  })
})

test("$evalHandle should return a new handle", async () => {
  const channel = new PhotopeaChannel(null as any)
  const handle = new PhotopeaHandle<PP.Application>(channel, "testHandle")

  const channelSpy = vi
    .spyOn(channel, "evaluateHandle")
    .mockResolvedValue("newHandle")

  const result = await handle.$evalHandle(
    (proxy) => proxy.activeDocument.layers[0]
  )

  expect(result).toBeInstanceOf(PhotopeaHandle)
  expect(result.handle).toBe("newHandle")
  expect(channelSpy).toBeCalledTimes(1)
  expect(channelSpy.mock.lastCall![0]).toBe(
    `return $self.activeDocument.layers[0];`
  )
  expect(channelSpy.mock.lastCall![1]).toEqual({
    $self: handle.handle
  })
})
