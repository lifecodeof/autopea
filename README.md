# Autopea

JS/TS Library for automating Photopea with TypeScript.

[Demo Video](https://github.com/user-attachments/assets/91e0e2ed-9654-4548-bd50-69483a6e899f)

## Why

Photopea's only scripting interface is raw ExtendScript strings sent over `postMessage`. There are no types, no structure, and no way to know if what you're sending is correct until it runs.

`autopea` wraps this into a typed, async/await API using real ES6 classes. The API is modeled after [Photoshop's ExtendScript reference](https://github.com/Adobe-CEP/CEP-Resources/blob/master/Documentation/Product%20specific%20Documentation/Photoshop%20Scripting/photoshop-javascript-ref-2020.pdf), so if you've written Photoshop scripts before, it will feel familiar.

## What

This library abstracts the underlying ExtendScript communication and lifecycle into a high-level API, allowing for structured automation of image processing tasks.

It provides two packages:

- `autopea`: core library with the Contract system and transport-agnostic logic.
  - Includes iframe transport and can be used standalone.
  - Can be used inside browser environment.
- `autopea-playwright`: Playwright-specific implementation for browser-based automation.

## Usage

### Install

```bash
pnpm add autopea autopea-playwright
```

> [!NOTE]
> `autopea-playwright` can be omitted when targeting web platform, but features like interacting with smart objects are unavailable there due to web platform security restrictions. Playwright with `autopea-playwright` is the recommended setup.

### Quick start

See the [example script](./packages/examples/introduction/main.ts) or start here:

```typescript
import { chromium } from "playwright"
import { PhotopeaPage } from "autopea-playwright"
import { App } from "autopea/contracts/App"

const browser = await chromium.launch()
const page = await PhotopeaPage.openFromBrowser(browser)

const app = App.of(page)

await app.openFile("example.psd")

const name = await app.activeDocument.name.$get()
console.log(`Active document: ${name}`)

await browser.close()
```

## Core Concepts

### Contracts

A Contract is a TypeScript proxy that represents a remote object in Photopea. It stores an expression like `app.activeDocument` rather than data, so referencing it requires no network call.

```typescript
const doc: Contract<PDocument> = app.activeDocument // just an expression
```

### Live expressions vs stable references

Contracts re-evaluate their expression on every access, so you always get the current state. If an object's path might change, pin it with `.$ref()` first:

```typescript
const layer: Contract<Layer> = await app.activeDocument.activeLayer.$ref() // evaluated once
```

### Reading data

`.$get()` executes the remote expression and returns a local value, validated against a Zod schema.

```typescript
const name: string = await app.activeDocument.name.$get()
const width: number = await app.activeDocument.width.$get()
```

## Versioning

Both packages are always released together with the same version number. Keep them in sync to avoid issues from mismatched internals.

## Contributing

This project started as an internal tool, so the API has gaps and documentation is sparse in places. Bug reports, feature requests, and pull requests are welcome.
