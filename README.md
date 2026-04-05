# `autopea`

Library for automating Photopea with TypeScript.

[Demo Video](https://github.com/user-attachments/assets/48e9153d-0b54-41db-95e4-562e8b48251e)

## What

`autopea` provides a type-safe interface for interacting with Photopea's internal state and objects. It abstracts the underlying ExtendScript communication into a high-level API, allowing for structured automation of image processing tasks.

Key components:

- `@lifecodeof/autopea`: Core library containing the Contract system and transport-agnostic logic.
- `@lifecodeof/autopea-pw`: Playwright-specific implementation for browser-based automation.

## Why

Automating Photopea without this kind of abstraction is painful. The only native option is sending raw ExtendScript strings over `postMessage` or using the script window manually no types, no structure, no guarantees. `autopea` wraps all of this into a typed, async/await API that works both in Node and directly inside a browser iframe.

Most importantly you will be using real ES6 classes. So you don't have to debug erased types or object proxies.

`autopea` tries to match Photopea's ExtendScript emulation (parsed via [acorn.js](https://github.com/acornjs/acorn)), which itself tries to match the [Photoshop ExtendScript API](https://github.com/Adobe-CEP/CEP-Resources/blob/master/Documentation/Product%20specific%20Documentation/Photoshop%20Scripting/photoshop-javascript-ref-2020.pdf). If you've worked with Photoshop scripting before, the structure will feel familiar.

## How

### Quick start

#### Install the necessary packages:

```bash
pnpm add autopea autopea-pw
```

> [!NOTE]
> You may omit `autopea-pw` when operating within an iframe however, advanced functionality such as interacting with smart objects is unavailable due to web platform security restrictions. Utilizing Playwright in conjunction with `autopea-pw` is the recommended implementation.

#### Use the library:

Take a look at [example script](./packages/examples/example.ts) or start with quick start script.

```typescript
import { chromium } from "playwright"
import { PhotopeaPage } from "@lifecodeof/autopea-pw"
import { App } from "@lifecodeof/autopea/contracts/App"

const browser = await chromium.launch()
const page = await PhotopeaPage.openFromBrowser(browser)

// Initialize the App contract
const app = App.of(page)

// Open a document
await app.openFile("example.psd")

// Get the active document name
const name = await app.activeDocument.name.$get()
console.log(`Active document: ${name}`)

// Close the browser
await browser.close()
```

## Core Concepts

### Contracts

Everything is a Contract. These are TypeScript proxies that represent remote objects in Photopea by storing their expressions (e.g., `app.activeDocument`) rather than their data.

### Live Expressions vs. Stable References

By default, contracts are Live Expressions. They re-evaluate their expressions every time they are used, ensuring you always interact with the current state and eliminating redundant awaits. Use `const newContract = await contract.$ref()` to evaluate a path once and pin it to a stable global handle. This is necessary if an object's path might change (like moving a layer).

### Data Retrieval

To move data from Photopea into your local code, use `.$get()`. This executes the remote expression and returns a JSON-serializable value (like a string or number) validated against a Zod schema.

## Versioning

The packages `autopea` and `autopea-pw` utilize a synchronized versioning strategy. Under this convention, both packages are released with identical version numbers even if a specific update contains source code changes for only one of the two. Consequently, maintaining identical version strings for both dependencies is advised to guarantee compatibility and prevent runtime regressions caused by mismatched internal interfaces.
