import type { Page } from "playwright"

export const makePromisifyIndexedDbFnHandle = (page: Page) => {
  return page.evaluateHandle(() => {
    return <T = unknown>(request: IDBRequest<T>): Promise<T> => {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as T)
        request.onerror = () => reject(request.error)
      })
    }
  })
}

export const makeArrayBufferToBase64FnHandle = (page: Page) => {
  return page.evaluateHandle(() => {
    return (buffer: ArrayBuffer): string => {
      let binary = ""
      const bytes = new Uint8Array(buffer)
      const len = bytes.byteLength
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      return window.btoa(binary)
    }
  })
}

export const makeBase64ToArrayBufferFnHandle = (page: Page) => {
  return page.evaluateHandle(() => {
    return (base64: string): ArrayBuffer => {
      const binaryString = window.atob(base64)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return bytes.buffer
    }
  })
}

export const transferBuffer = async (page: Page, buffer: Buffer) => {
  const toBuffer = await makeBase64ToArrayBufferFnHandle(page)
  try {
    return await page.evaluateHandle(
      async ([base64, toBuffer]) => toBuffer(base64),
      [buffer.toString("base64"), toBuffer] as const
    )
  } finally {
    await toBuffer.dispose()
  }
}
