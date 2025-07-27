import { expect, test } from "vitest"
import { createHandleProxy, ProxyRecordsSymbol } from "./HandleProxy"

interface ExampleAPI {
  user: {
    getName(id: number): string
    address: {
      getCity(): { altitude: number }
    }
  }
  log(msg: string): void
  fetchData(id: number): Promise<any>
}

test("should record operations", () => {
  const proxy = createHandleProxy<ExampleAPI>()

  const op1 = proxy.user.getName(42)
  expect(op1[ProxyRecordsSymbol]).toMatchSnapshot()

  const op2 = proxy.user.address.getCity().altitude
  expect(op2[ProxyRecordsSymbol]).toMatchSnapshot()

  const op3 = proxy.log("Hello")
  expect(op3[ProxyRecordsSymbol]).toMatchSnapshot()

  expect(() => proxy.user.toString()).toThrow(/is not a function/)

  expect(() => proxy.fetchData(0).then((x) => x)).toThrow(/is not a function/)
})
