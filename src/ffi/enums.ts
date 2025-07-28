export type ResampleMethod =
  | "automatic"
  | "preserveDetails"
  | "bicubic"
  | "bicubicSharper"
  | "bicubicSmoother"
  | "bilinear"
  | "nearestNeighbor"

export type AnchorPosition =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "middleLeft"
  | "middleCenter"
  | "middleRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight"

export type TrimType =
  | "transparentPixels"
  | "topLeftPixelColor"
  | "bottomRightPixelColor"

export type ElementPlacement = "PLACEBEFORE" | "PLACEAFTER" | "INSIDE"

export type RasterizeType =
    | "entireLayer"
    | "shape"
    | "textContents"
    | "layerStyle"
    | "smartObject"
    | "placed"
    | "video"
    | "all"
