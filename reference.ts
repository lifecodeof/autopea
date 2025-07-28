// photoshop.d.ts

declare namespace Photoshop {
  // Missing types

  interface Notifiers {}
  interface BatchOptions {}
  interface SolidColor {}
  interface Guides {}
  interface ColorSamplers {}
  interface MeasurementScale {}
  interface CountItems {}
  interface TextItem {}
}

declare namespace Photoshop {
  /** Common unit types for measurements */
  type UnitType =
    | "pixelsUnit"
    | "pointsUnit"
    | "inchesUnit"
    | "cmUnit"
    | "mmUnit"
    | "percentUnit"
    | "angleUnit"
    | "radiansUnit"
    | "noneUnit"

  /** Types of resampling methods */
  type ResampleMethod =
    | "automatic"
    | "preserveDetails"
    | "bicubic"
    | "bicubicSharper"
    | "bicubicSmoother"
    | "bilinear"
    | "nearestNeighbor"

  /** Layer kinds */
  type LayerKind =
    | "any"
    | "normal"
    | "textLayer"
    | "solidFill"
    | "gradientFill"
    | "patternFill"
    | "smartObject"
    | "video"
    | "adjustmentLayer"

  /** Color models */
  type ColorModel =
    | "RGB"
    | "CMYK"
    | "Grayscale"
    | "Lab"
    | "Bitmap"
    | "Duotone"
    | "Indexed"

  interface UnitValue {
    value: number
    type: UnitType
  }

  interface File {
    fsName: string
    absoluteURI: string
    name: string
    fullName: string
    parent: Folder
    exists: boolean
    open(mode: string): boolean
    close(): void
    read(): string
    write(content: string): void
    remove(): boolean
  }

  interface Folder {
    fsName: string
    absoluteURI: string
    name: string
    fullName: string
    parent: Folder
    exists: boolean
    create(): boolean
    remove(): boolean
    getFiles(mask?: string): File[]
  }

  interface RGBColor {
    red: number
    green: number
    blue: number
  }

  interface CMYKColor {
    cyan: number
    magenta: number
    yellow: number
    black: number
  }

  interface GrayColor {
    gray: number
  }
}

declare namespace Photoshop {
  interface Application {
    activeDocument: Document
    documents: Document[]
    name: string
    version: string
    build: string
    locale: string
    preferences: Preferences
    freeMemory: number
    recentFiles: File[]
    notifiers: Notifiers
    notifiersEnabled: boolean
    scriptingVersion: string
    systemInformation: string
    backgroundColor: SolidColor
    foregroundColor: SolidColor
    currentTool: string
    displayDialogs: DialogModes

    beep(): void
    bringToFront(): void
    refresh(): void
    refreshFonts(): void
    togglePalettes(): void

    doAction(action: string, from: string): void
    executeAction(
      actionID: number,
      descriptor?: ActionDescriptor,
      display?: DialogModes
    ): ActionDescriptor
    executeActionGet(reference: ActionReference): ActionDescriptor

    batch(
      files: File[],
      action: string,
      from: string,
      options?: BatchOptions
    ): void
    runMenuItem(menuID: number): void

    open(file: File, as?: OpenDocumentType, options?: any): Document
    openDialog(): File[]
    load(file: File): void
    save(): void

    makeContactSheet(): void
    makePDFPresentation(): void
    makePhotoGallery(): void
    makePhotomerge(): void
    makePicturePackage(): void
  }

  interface Document {
    name: string
    fullName: File
    width: UnitValue
    height: UnitValue
    resolution: number
    mode: DocumentMode
    path: Folder
    saved: boolean
    artLayers: ArtLayers
    layerSets: LayerSets
    layers: Layers
    activeLayer: Layer
    activeChannels: Channel[]
    channels: Channels
    historyStates: HistoryStates
    activeHistoryState: HistoryState
    selection: Selection
    guides: Guides
    colorSamplers: ColorSamplers
    measurementScale: MeasurementScale
    countItems: CountItems
    xmpMetadata: XMPMetadata
    info: DocumentInfo
    printSettings: DocumentPrintSettings

    crop(
      bounds: UnitValue[],
      angle?: number,
      width?: UnitValue,
      height?: UnitValue
    ): void
    resizeImage(
      width?: UnitValue,
      height?: UnitValue,
      resolution?: number,
      resampleMethod?: ResampleMethod
    ): void
    resizeCanvas(
      width: UnitValue,
      height: UnitValue,
      anchor?: AnchorPosition
    ): void
    rotateCanvas(angle: number): void
    flipCanvas(direction: Direction): void
    trim(
      trimType: TrimType,
      top?: boolean,
      left?: boolean,
      bottom?: boolean,
      right?: boolean
    ): void

    close(saveOptions?: SaveOptions): void
    save(): void
    saveAs(
      file: File,
      options: any,
      asCopy?: boolean,
      extensionType?: Extension
    ): void
    duplicate(name?: string, mergeLayersOnly?: boolean): Document
    flatten(): void
    mergeVisibleLayers(): void
    rasterizeAllLayers(): void
    paste(): void
    exportDocument(file: File, exportType: ExportType, options?: any): void
  }

  type DocumentMode =
    | "RGB"
    | "CMYK"
    | "Grayscale"
    | "Bitmap"
    | "Lab"
    | "Duotone"
    | "Indexed"
  type Direction = "horizontal" | "vertical"
  type AnchorPosition =
    | "topLeft"
    | "topCenter"
    | "topRight"
    | "middleLeft"
    | "middleCenter"
    | "middleRight"
    | "bottomLeft"
    | "bottomCenter"
    | "bottomRight"

  type TrimType =
    | "transparentPixels"
    | "topLeftPixelColor"
    | "bottomRightPixelColor"
  type DialogModes = "ALL" | "ERROR" | "NO"
  type OpenDocumentType =
    | "Photoshop"
    | "JPEG"
    | "PDF"
    | "PNG"
    | "GIF"
    | "TIFF"
    | "BMP"
    | "EPS"
  type ExportType = "SaveForWeb" | "IllustratorPaths"

  type SaveOptions = "SAVECHANGES" | "DONOTSAVECHANGES" | "PROMPTTOSAVECHANGES"
  type Extension = "LOWERCASE" | "UPPERCASE"

  interface DocumentInfo {
    author: string
    caption: string
    title: string
    copyrightNotice: string
    keywords: string[]
    creationDate: Date
    // ... many more
  }

  interface DocumentPrintSettings {
    printerName: string
    printSpace: string
    scale: number
    resolution: number
    flip: boolean
    vectorData: boolean
    // ...
    setPagePosition(): void
  }
}

declare namespace Photoshop {
  interface Layer {
    name: string
    visible: boolean
    opacity: number
    blendMode: BlendMode
    parent: LayerSet | Document
    isBackgroundLayer: boolean
    kind: LayerKind
    allLocked: boolean
    pixelsLocked: boolean
    positionLocked: boolean
    transparentPixelsLocked: boolean
    bounds: any // Can be UnitValue[] or specific Rect-like object
    typename: string

    duplicate(
      relativeObject?: Layer,
      insertionLocation?: ElementPlacement
    ): Layer
    move(relativeObject: Layer, insertionLocation: ElementPlacement): void
    remove(): void
    resize(horizontal: number, vertical: number, anchor?: AnchorPosition): void
    rotate(angle: number, anchor?: AnchorPosition): void
    translate(deltaX: number, deltaY: number): void
    link(layer: Layer): void
    unlink(): void
    merge(): Layer
  }

  interface ArtLayer extends Layer {
    fillOpacity: number
    grouped: boolean
    textItem?: TextItem
    xmpMetadata: XMPMetadata

    applyGaussianBlur(radius: number): void
    applySharpen(): void
    applyUnSharpMask(amount: number, radius: number, threshold: number): void
    clear(): void
    copy(): void
    cut(): void
    duplicate(
      relativeObject?: Layer,
      insertionLocation?: ElementPlacement
    ): ArtLayer
    invert(): void
    rasterize(type: RasterizeType): void
    remove(): void
  }

  interface ArtLayers {
    length: number
    parent: Document | LayerSet
    add(): ArtLayer
    getByName(name: string): ArtLayer
    removeAll(): void
  }

  interface LayerSet extends Layer {
    layers: Layers
    artLayers: ArtLayers
    layerSets: LayerSets
    linkedLayers: Layer[]
    duplicate(
      relativeObject?: LayerSet,
      insertionLocation?: ElementPlacement
    ): LayerSet
  }

  interface LayerSets {
    length: number
    parent: Document | LayerSet
    add(): LayerSet
    getByName(name: string): LayerSet
    removeAll(): void
  }

  interface Layers {
    length: number
    parent: Document
    getByName(name: string): Layer
    removeAll(): void
  }

  interface Channel {
    name: string
    kind: ChannelType
    visible: boolean
    parent: Document
    opacity: number
    histogram: number[]
    color: RGBColor
    typename: string

    duplicate(relativeObject?: Document, name?: string): Channel
    remove(): void
    merge(): void
  }

  interface Channels {
    length: number
    parent: Document
    add(): Channel
    getByName(name: string): Channel
    removeAll(): void
  }

  interface HistoryState {
    name: string
    parent: Document
    snapshot: boolean
    typename: string
  }

  interface HistoryStates {
    length: number
    parent: Document
    getByName(name: string): HistoryState
  }

  type BlendMode =
    | "normal"
    | "dissolve"
    | "multiply"
    | "screen"
    | "overlay"
    | "softLight"
    | "hardLight"
    | "colorDodge"
    | "colorBurn"
    | "darken"
    | "lighten"
    | "difference"
    | "exclusion"
    | "hue"
    | "saturation"
    | "color"
    | "luminosity"

  type ElementPlacement = "PLACEBEFORE" | "PLACEAFTER" | "INSIDE"
  type ChannelType = "component" | "mask" | "selectedArea" | "spotColor"
  type RasterizeType =
    | "entireLayer"
    | "shape"
    | "textContents"
    | "layerStyle"
    | "smartObject"
    | "placed"
    | "video"
    | "all"
}

declare namespace Photoshop {
  interface ActionDescriptor {
    readonly count: number
    readonly typename: string

    clear(): void
    erase(key: number): void
    getBoolean(key: number): boolean
    getClass(key: number): number
    getData(key: number): string
    getDouble(key: number): number
    getEnumerationType(key: number): number
    getEnumerationValue(key: number): number
    getInteger(key: number): number
    getKey(index: number): number
    getLargeInteger(key: number): number
    getList(key: number): ActionList
    getObjectType(key: number): number
    getObjectValue(key: number): ActionDescriptor
    getPath(key: number): File
    getReference(key: number): ActionReference
    getString(key: number): string
    getType(key: number): DescValueType
    getUnitDoubleType(key: number): UnitType
    getUnitDoubleValue(key: number): number
    hasKey(key: number): boolean
    isEqual(other: ActionDescriptor): boolean

    putBoolean(key: number, value: boolean): void
    putClass(key: number, value: number): void
    putData(key: number, value: string): void
    putDouble(key: number, value: number): void
    putEnumerated(key: number, enumType: number, value: number): void
    putInteger(key: number, value: number): void
    putLargeInteger(key: number, value: number): void
    putList(key: number, value: ActionList): void
    putObject(key: number, classID: number, value: ActionDescriptor): void
    putPath(key: number, value: File): void
    putReference(key: number, value: ActionReference): void
    putString(key: number, value: string): void
    putUnitDouble(key: number, unitID: UnitType, value: number): void

    toStream(): string
  }

  interface ActionList {
    readonly count: number
    readonly typename: string

    clear(): void

    getBoolean(index: number): boolean
    getClass(index: number): number
    getData(index: number): string
    getDouble(index: number): number
    getEnumerationType(index: number): number
    getEnumerationValue(index: number): number
    getInteger(index: number): number
    getLargeInteger(index: number): number
    getList(index: number): ActionList
    getObjectType(index: number): number
    getObjectValue(index: number): ActionDescriptor
    getPath(index: number): File
    getReference(index: number): ActionReference
    getString(index: number): string
    getType(index: number): DescValueType
    getUnitDoubleType(index: number): UnitType
    getUnitDoubleValue(index: number): number

    putBoolean(value: boolean): void
    putClass(value: number): void
    putData(value: string): void
    putDouble(value: number): void
    putEnumerated(enumType: number, value: number): void
    putInteger(value: number): void
    putLargeInteger(value: number): void
    putList(value: ActionList): void
    putObject(classID: number, value: ActionDescriptor): void
    putPath(value: File): void
    putReference(value: ActionReference): void
    putString(value: string): void
    putUnitDouble(unitID: UnitType, value: number): void
  }

  interface ActionReference {
    readonly typename: string

    getContainer(): ActionReference
    getDesiredClass(): number
    getEnumeratedType(): number
    getEnumeratedValue(): number
    getForm(): ReferenceFormType
    getIdentifier(): number
    getIndex(): number
    getName(): string
    getOffset(): number
    getProperty(): number

    putClass(classID: number): void
    putEnumerated(enumType: number, value: number): void
    putIdentifier(classID: number, value: number): void
    putIndex(classID: number, value: number): void
    putName(classID: number, name: string): void
    putOffset(classID: number, value: number): void
    putProperty(classID: number, value: number): void
  }

  // Value types returned by getType()
  type DescValueType =
    | "BooleanType"
    | "ClassType"
    | "DoubleType"
    | "EnumeratedType"
    | "IntegerType"
    | "LargeIntegerType"
    | "ListType"
    | "ObjectType"
    | "PathType"
    | "ReferenceType"
    | "StringType"
    | "UnitDoubleType"

  type ReferenceFormType =
    | "classForm"
    | "enumeratedForm"
    | "identifierForm"
    | "indexForm"
    | "nameForm"
    | "offsetForm"
    | "propertyForm"
}

declare namespace Photoshop {
  interface Preferences {
    additionalPluginFolder: Folder
    askBeforeSavingLayeredTIFF: boolean
    autoUpdateOpenDocuments: boolean
    beepWhenDone: boolean
    colorPicker: ColorPicker
    dynamicColorSliders: boolean
    exportClipboard: boolean
    keyboardZoomResizesWindows: boolean
    maximizeCompatibility: boolean
    recentFileListLength: number
    rulerUnits: Units
    typeUnits: TypeUnits
    useLowerCaseExtension: boolean
    savePaletteLocations: boolean
    showToolTips: boolean
    smartQuotes: boolean
    showSliceNumber: boolean
    textFontSize: number
    useShiftKeyForToolSwitch: boolean
    useVideoAlpha: boolean
    windowsThumbnail: boolean
    typename: string
  }

  interface Selection {
    bounds: UnitValue[]
    solid: boolean
    typename: string
    parent: Document

    clear(): void
    copy(): void
    cut(): void
    deselect(): void
    fill(
      color: SolidColor,
      mode?: ColorBlendMode,
      opacity?: number,
      preserveTransparency?: boolean
    ): void
    feather(radius: number): void
    grow(): void
    invert(): void
    load(channel: Channel, combination?: SelectionType): void
    makeWorkPath(tolerance: number): void
    resize(horizontal: number, vertical?: number, anchor?: AnchorPosition): void
    rotate(angle: number, anchor?: AnchorPosition): void
    select(region: any[]): void
    selectAll(): void
    selectBorder(width: number): void
    similar(): void
    smooth(sampleRadius: number): void
    store(channel: Channel): void
    stroke(
      color: SolidColor,
      width: number,
      location?: StrokeLocation,
      mode?: ColorBlendMode,
      opacity?: number,
      preserveTransparency?: boolean
    ): void
    translate(deltaX: number, deltaY: number): void
  }

  interface XMPMetadata {
    rawData: string
    parent: Document
    typename: string
  }

  // === ENUMS & CONSTANTS ===

  type Units =
    | "pixels"
    | "inches"
    | "cm"
    | "mm"
    | "points"
    | "picas"
    | "percent"
  type TypeUnits =
    | "pixels"
    | "points"
    | "millimeters"
    | "centimeters"
    | "inches"

  type ColorPicker = "ADOBE" | "APPLE"

  type ColorBlendMode =
    | "normal"
    | "dissolve"
    | "darken"
    | "multiply"
    | "colorBurn"
    | "linearBurn"
    | "darkerColor"
    | "lighten"
    | "screen"
    | "colorDodge"
    | "linearDodge"
    | "lighterColor"
    | "overlay"
    | "softLight"
    | "hardLight"
    | "vividLight"
    | "linearLight"
    | "pinLight"
    | "hardMix"
    | "difference"
    | "exclusion"
    | "subtract"
    | "divide"
    | "hue"
    | "saturation"
    | "color"
    | "luminosity"

  type StrokeLocation = "INSIDE" | "CENTER" | "OUTSIDE"

  type SelectionType = "REPLACE" | "EXTEND" | "INTERSECT" | "SUBTRACT"
}
