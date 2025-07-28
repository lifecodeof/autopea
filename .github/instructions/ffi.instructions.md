---
applyTo: "src/ffi/*.ts"
---

# How to Extend `PhotopeaFFI`

This guide explains how to create new FFI (Foreign Function Interface) classes for Photopea by extending the `PhotopeaFFI` base class. Please read this before contributing new FFI types.

---

## 1. **Create a New FFI Class**

- Import `PhotopeaFFI` from `base/PhotopeaFFI`.
- Extend your new class from `PhotopeaFFI`.

```typescript
import { PhotopeaFFI } from "./base/PhotopeaFFI"

export class MyType extends PhotopeaFFI {
  // Add properties and methods here
}
```

---

## 2. **Expose Properties**

- Use the protected helpers from `PhotopeaFFI` to expose properties.
- Use `this.$(OtherFFIType)\`.<property>\`` for properties that return other FFI objects.
- Use `this.$value(schema)\`.<property>\`` for JSON serializable properties.

**Example:**

```typescript
get width() {
  return this.$value(z.number())`.width`
}
```

---

## 3. **Expose Methods**

- Use `this.$eval()\`.<method>(...)\``for methods that return`void`.
- Use `this.$eval(schema)\`.<method>(...)\`` for methods that return a value.

**Example:**

```typescript
trim() {
  return this.$eval()`.trim()`
}
```

---

## 4. **Accessing Nested FFI Types**

- For nested FFI objects, use the `$` helper with the constructor of the target FFI type.

**Example:**

```typescript
get layers() {
  return this.$(Layers)`.layers`
}
```

---

## 5. **General Tips**

- Use `z` for Zod schemas (e.g., `z.number()`).
- Use template literals for property/method expressions.
- Avoid direct channel calls; always use the provided helpers for consistency and safety.
- When interpolated values of helper tagged function methods:
  - If the value is a `PhotopeaFFI` instance, it will replaced with its expression.
  - If the value is undefined, it will be replaced with `undefined`.
  - Else, it will be converted to string via `JSON.stringify()`.
  - If still need to pass arbitrary JS expressions, use `this.$raw(string)`.
  - So most of the time you can just pass the value directly into template literal.
  - DO NOT use `JSON.stringify()` in tagged template functions that start with $. Its unnecessary and will wrap the value in quotes, which is not what you want.

In most cases, you either write methods or getters that:

- Forward expressions by using `this.$()` or `this.$value()`.
- Dispatch actions by using `this.$eval()`

If you are forwarding expressions, return the result of the `this.$()` or `this.$value()` call directly. This means no checks or conditionals. Remote runtime will handle those cases.
If you are dispatching actions, make sure this is right thing to do, for example, if you are making a method that goes like `.getX()`, you should forward it as an expression instead.

`this.$()` requires a constructor of the FFI type you want to return. This means it cannot accept arrays. For arrays, use `this.$arrayOf(FFIType)` to create a constructor that returns an FFI collection of the specified FFI type.

All class names should match foreign type names but there are exceptions:

- Types that conflict with JavaScript classes (e.g., `File`, `Date`, `Document`, etc.) should be prefixed with `P` (e.g., `PFile`, `PDate`, `PDocument`).
- `Application` is renamed to `App` for convenience since that class is entrypoint of the FFI API.

---

## 6. **Example: Minimal FFI Extension**

```typescript
import z from "zod"
import { PhotopeaFFI } from "./base/PhotopeaFFI"

export class ExampleFFI extends PhotopeaFFI {
  get name() {
    return this.$value(z.string())`.name`
  }

  doSomething() {
    return this.$eval()`.doSomething()`
  }
}
```
