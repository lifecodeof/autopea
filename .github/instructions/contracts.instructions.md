---
applyTo: "src/contracts/*.ts"
---

# How to Extend `Contract`

This guide explains how to create new Contract classes that represents remote objects for Photopea by extending the `Contract` base class. Please read this before contributing new Contract types.

---

## 1. **Create a New Contract Class**

- Import `Contract` from `base/Contract`.
- Extend your new class from `Contract`.

```typescript
import { Contract } from "./base/Contract"

export class MyType extends Contract {
  // Add properties and methods here
}
```

---

## 2. **Expose Properties**

- Use the protected helpers from `Contract` to expose properties.
- Use `this.$(ContractType)\`.<property>\`` for properties that return Contract objects.
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
- Use `this.$evalHandle(ContractType)\`.<method>(...)\`` for methods that return a Contract objects.

**Example:**

```typescript
trim() {
  return this.$eval()`.trim()`
}
```

---

## 4. **Accessing Nested Contract Types**

- For nested Contract objects, use the `$` helper with the constructor of the target Contract type.

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
  - If the value is a `Contract` instance, it will replaced with its expression.
  - If the value is undefined, it will be replaced with `undefined`.
  - Else, it will be converted to string via `JSON.stringify()`.
  - If still need to pass arbitrary JS expressions, use `this.$raw(string)`.
  - So most of the time you can just pass the value directly into template literal.
  - DO NOT use `JSON.stringify()` in tagged template functions that start with $. Its unnecessary and will wrap the value in quotes, which is not what you want.

In most cases, you either write methods or getters that:

- Forward expressions by using `this.$()` or `this.$value()`.
- Dispatch actions by using `this.$eval()`

If you are forwarding expressions, return the result of the `this.$()` or `this.$value()` call directly. This means no checks or conditionals. Remote runtime will handle those cases.
If you are dispatching actions, return the result of the `this.$eval()` or `this.$evalHandle()` call directly. This means no checks or conditionals. Remote runtime will handle those cases.

`this.$()` requires a constructor of the Contract type you want to return. This means it cannot accept arrays. For arrays, use `this.$arrayOf(ContractType)` to create a constructor that returns an Contract collection of the specified Contract type.

All class names should match foreign type names but there are exceptions:

- Types that conflict with JavaScript classes (e.g., `File`, `Date`, `Document`, etc.) should be prefixed with `P` (e.g., `PFile`, `PDate`, `PDocument`).
- `Application` is renamed to `App` for convenience since that class is entrypoint of the Contract API.

---

## 6. **Example: Minimal Contract Extension**

```typescript
import z from "zod"
import { Contract } from "./base/Contract"

export class ColorSampler extends Contract {
  get color() {
    return this.$(SolidColor)`.color`
  }

  move(position: [number, number]) {
    return this.$eval()`.move(${position})`
  }

  remove() {
    return this.$eval()`.remove()`
  }

  // ...
}
```

---

## 7. **Example: Collecition typed Contract Classes**

```typescript
import { Contract, ContractCollection } from "./base/Contract"
import { ColorSampler } from "./ColorSampler"

export class ColorSamplers extends ContractCollection<ColorSampler> {
  protected itemType = () => ColorSampler
  
  add(position: [number, number]) {
    return this.$evalHandle(ColorSampler)`.add(${position})`
  }

  removeAll() {
    return this.$eval()`.removeAll()`
  }

  // ...
}
```
