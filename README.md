# Autopea

[![npm version](https://badge.fury.io/js/autopea.svg)](https://badge.fury.io/js/autopea)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A TypeScript library for automating [Photopea](https://www.photopea.com/) - the online Photoshop editor. Built with Playwright for reliable browser automation and a type-safe API for Photoshop-like operations.

## ✨ Features

- **Type-Safe API**: Full TypeScript support with comprehensive type definitions
- **Photoshop Operations**: Access to layers, documents, colors, and more
- **Browser Automation**: Powered by Playwright for reliable cross-browser support
- **Event-Driven**: Real-time communication with Photopea through events
- **Handle Management**: Efficient memory management for complex operations
- **Error Handling**: Comprehensive error types and timeout management
- **REPL Support**: Interactive shell for testing and exploration

## 🚀 Installation

```bash
npm install autopea
# or
pnpm add autopea
# or
yarn add autopea
```

## 📖 Quick Start

```typescript
import { PhotopeaPage, PhotopeaChannel, App } from 'autopea'
import { chromium } from 'playwright'

// Launch browser and open Photopea
const browser = await chromium.launch()
const page = await PhotopeaPage.openFromBrowser(await browser.newContext())
const channel = new PhotopeaChannel(page)

// Access the main application
const app = App.of(channel)

// Get application version
const version = await app.version()
console.log('Photopea version:', version)

// Work with the active document
const doc = await app.activeDocument()
const width = await doc.width()
const height = await doc.height()
console.log(`Document size: ${width}x${height}`)

// Create a new layer
const layer = await doc.artLayers.add()
await layer.name('My New Layer')

// Clean up
await browser.close()
```

## 🏗️ Architecture

### Core Components

- **`PhotopeaPage`**: Manages the browser page and event communication
- **`PhotopeaChannel`**: Handles script evaluation and handle management
- **`App`**: Main application interface with access to documents and preferences
- **Contracts**: Type-safe wrappers for Photopea objects (Documents, Layers, Colors, etc.)

### Event System

```typescript
const page = await PhotopeaPage.openFromBrowser(browserContext)

// Listen for messages from Photopea
page.on('message', (message) => {
  console.log('Received:', message)
})

// Listen for binary data
page.on('bufferMessage', (buffer) => {
  console.log('Buffer length:', buffer.length)
})

// Listen for page errors
page.on('pageerror', (error) => {
  console.error('Page error:', error)
})
```

## 📚 API Reference

### Application Operations

```typescript
const app = App.of(channel)

// Application info
const version = await app.version()
const systemInfo = await app.systemInformation()

// Document management
const activeDoc = await app.activeDocument()
const allDocs = await app.documents()
const newDoc = await app.documents.add({ width: 1920, height: 1080 })

// Preferences
const prefs = await app.preferences()
await prefs.rulerUnits('pixels')
```

### Document Operations

```typescript
const doc = await app.activeDocument()

// Document properties
const width = await doc.width()
const height = await doc.height()
const resolution = await doc.resolution()

// Layer management
const layers = await doc.layers()
const artLayers = await doc.artLayers()

// File operations
await doc.saveAs('/path/to/file.png', SaveFormat.PNG)
const buffer = await doc.exportDocument(SaveFormat.JPG)
```

### Layer Operations

```typescript
const layer = await doc.artLayers.add()

// Layer properties
await layer.name('Background Layer')
await layer.visible(true)
await layer.opacity(75)

// Layer transformations
await layer.translate(100, 50)
await layer.resize(150, 150, AnchorPosition.MiddleCenter)

// Layer effects and styles
await layer.applyStyle('Drop Shadow')
```

### Color and Selection

```typescript
// Work with colors
const color = new SolidColor()
await color.rgb.red(255)
await color.rgb.green(128)
await color.rgb.blue(0)

// Selection operations
const selection = await doc.selection()
await selection.selectAll()
await selection.deselect()
await selection.fill(color)
```

## 🎮 Interactive REPL

Explore the API interactively with the built-in REPL:

```bash
pnpm repl
```

This launches a browser with Photopea and provides a command-line interface for testing operations:

```bash
photopea> app.version()
"24.1"

photopea> app.activeDocument().width()
1920

photopea> app.activeDocument().artLayers.add().name("Test Layer")
undefined
```

## 🧪 Testing

The library includes comprehensive tests covering all major functionality:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test Channel.test.ts
```

## 🔧 Advanced Usage

### Custom Script Evaluation

```typescript
// Direct script evaluation
const result = await channel.evaluate('return app.activeDocument.width')

// With handle variables
const handle = await channel.createHandle({ x: 10, y: 20 })
const result = await channel.evaluate('return value.x + value.y', { value: handle })

// Handle cleanup
await channel.disposeHandle(handle)
```

### Error Handling

```typescript
try {
  const result = await channel.evaluate('invalid.code.here', {}, { timeout: 1000 })
} catch (error) {
  if (error instanceof PhotopeaChannelTimeoutError) {
    console.log('Operation timed out')
  } else if (error instanceof PhotopeaChannelScriptError) {
    console.log('Script execution error')
  }
}
```

### Concurrent Operations

```typescript
// Use mutexes for thread-safe operations
const channel = new PhotopeaChannel(page)
await channel.dialogMutex.runExclusive(async () => {
  // Perform operations that might trigger dialogs
  await someOperation()
})
```

## ⚠️ Limitations and Considerations

### JSON Serialization Behavior

**Important**: Due to JSON serialization limitations between the browser environment (Photopea) and Node.js, `undefined` values from Photopea are converted to `null` in your local code.

```typescript
// In Photopea (browser context):
const result = { name: "test", value: undefined }

// After JSON serialization and deserialization:
console.log(result) // { name: "test", value: null }
```

**Workarounds:**
- Use `null` instead of `undefined` when working with object properties
- Check for both `null` and `undefined` when validating datae
- Consider using default values instead of `undefined`

```typescript
// Recommended approach
const result = await channel.evaluate(`
  return {
    name: "test",
    value: null  // Use null instead of undefined
  }
`)

// Safe checking
if (result.value == null) {  // Checks both null and undefined
  console.log("Value is missing")
}
```

This behavior is due to JSON not supporting `undefined` values - they are omitted during serialization, and the library reconstructs them as `null` to maintain object structure consistency.

## 📦 Build & Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Run type checking
pnpm typecheck

# Format code
pnpm format
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/autopea.git`
3. Install dependencies: `pnpm install`
4. Create a feature branch: `git checkout -b feature/amazing-feature`
5. Make your changes and add tests
6. Run tests: `pnpm test`
7. Commit your changes: `git commit -m 'Add amazing feature'`
8. Push to the branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Photopea](https://www.photopea.com/) - The amazing online Photoshop alternative
- [Playwright](https://playwright.dev/) - For reliable browser automation
- [Vitest](https://vitest.dev/) - For fast and reliable testing

## 📞 Support

If you have any questions or need help:

- Open an [issue](https://github.com/lifecodeof/autopea/issues) on GitHub
- Check the [documentation](https://github.com/lifecodeof/autopea/wiki) (coming soon)
- Join our [Discord community](https://discord.gg/autopea) (coming soon)

---

Made with ❤️ for the creative coding community
