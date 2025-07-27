/**
 * Note: Some properties may throw or log if accessed and not handled by the type.
 * Dynamic property access is possible for some types.
 */

export namespace PP {
  // General base type for all objects
  export interface Base<R extends string = string> {
    /** The runtime type discriminator. */
    _R: R
    /** The type name of the object, e.g. "Layer", "Document", etc. */
    typename: string
  }

  export interface Application extends Base<"Application"> {
    /** The currently active document. */
    activeDocument: Document
    /** The collection of open documents. */
    documents: Documents
    /** The collection of available text fonts. */
    fonts: TextFonts
    /** The application preferences. */
    preferences: Preferences
    /** The dialog modes for the application. */
    displayDialogs: DialogModes
    /** The current foreground color. */
    foregroundColor: SolidColor
    /** The current background color. */
    backgroundColor: SolidColor
    /** The user interface object. */
    UI: UI
    /** The application version. */
    version: number
    /**
     * Converts a 4-character string to a type ID.
     * @param id The 4-character string.
     * @returns The type ID string.
     */
    charIDToTypeID(id: string): string
    /**
     * Converts a string ID to a type ID.
     * @param id The string ID.
     * @returns The type ID string.
     */
    stringIDToTypeID(id: string): string
    /**
     * Converts a type ID to a string ID.
     * @param id The type ID.
     * @returns The string ID.
     */
    typeIDToStringID(id: string): string
    /**
     * Executes an action.
     * @param action The action name or ID.
     * @param descriptor Optional action descriptor.
     * @returns The result of the action.
     */
    executeAction(action: string, descriptor?: any): any
    /**
     * Gets an action descriptor for a reference.
     * @param ref The reference object.
     * @returns The action descriptor.
     */
    executeActionGet(ref: any): any
    /**
     * Performs an action from an action set.
     * @param action The action name.
     * @param set The action set name.
     */
    doAction(action: string, set: string): void
    /**
     * Brings the application window to the front.
     */
    bringToFront(): void
    /**
     * Opens a file from a URL.
     * @param url The file URL.
     * @param args Additional arguments.
     */
    open(url: string, ...args: any[]): void
    /**
     * Sends data to OE (Open Editor).
     * @param data The data to send.
     */
    echoToOE(data: any): void
    /**
     * Shows a window.
     * @param window The window object.
     */
    showWindow(window: any): void
    /**
     * Creates a UnitValue string.
     * @param value The numeric value.
     * @param unit The unit string.
     * @returns The value with unit as a string.
     */
    UnitValue(value: number, unit: string): string
  }

  export interface Documents extends Base<"Documents"> {
    /** The array of Document objects. */
    K: Document[]
    /** The number of documents. */
    length: number
    /** Access a document by index. */
    [index: number]: Document
    /**
     * Gets a document by its name.
     * @param name The document name.
     * @returns The Document or null if not found.
     */
    getByName(name: string): Document | null
    /**
     * Adds a new document.
     * @param width The width in pixels.
     * @param height The height in pixels.
     * @param resolution The resolution in DPI.
     * @param name The document name.
     * @param args Additional arguments.
     * @returns The new Document.
     */
    add(
      width?: number,
      height?: number,
      resolution?: number,
      name?: string,
      ...args: any[]
    ): Document
  }

  export interface Document extends Base<"Document"> {
    /** The currently active layer. */
    activeLayer: Layer
    /** The pixel aspect ratio. */
    pixelAspectRatio: number
    /** The document resolution in DPI. */
    resolution: number
    /** The document width in pixels. */
    width: number
    /** The document height in pixels. */
    height: number
    /** The document name. */
    name: string
    /** Whether the document is saved. */
    saved: boolean
    /** The current selection. */
    selection: Selection
    /** The active history state. */
    activeHistoryState: HistoryState
    /** The document source. */
    source: any
    /** The collection of layer comps. */
    layerComps: LayerComps
    /** The collection of history states. */
    historyStates: HistoryStates
    /** The color mode. */
    mode: number
    /** The collection of color samplers. */
    colorSamplers: ColorSamplers
    /** The collection of path items. */
    pathItems: PathItems
    /** The collection of all layers. */
    layers: Layers
    /** The collection of art layers. */
    artLayers: Layers
    /** The collection of layer sets. */
    layerSets: Layers
    /** Changes the color mode. */
    changeMode(mode: number): void
    /** Crops the document. */
    crop(bounds: [number, number, number, number]): void
    /** Trims the document. */
    trim(base?: number, trimSides?: boolean[]): void
    /** Suspends history. */
    suspendHistory(script: string): void
    /** Saves the document. */
    save(): void
    /**
     * Saves the document to OE.
     *
     * @param format The format string.
     *
     * Format examples:
     * - "jpg:0.8", "webp:0.6" - JPG and WEBP can have a quality parameter
     * - "psd:true" - "true" produces a minified PSD file
     * - "svg:true,false,..." - SVG parameters correspond to those in the SVG export in Photopea
     * JPG and WEBP can have a quality (0 to 1) after the colon (e.g. "jpg:0.8"). PSD can have a "true" after the colon: "psd:true", to produce minified PSDs.
     */
    saveToOE(format: string): void
    /** Rotates the canvas. */
    rotateCanvas(angle: number): void
    /** Flips the canvas. */
    flipCanvas(direction: number): void
    /** Resizes the image. */
    resizeImage(width?: number, height?: number, resolution?: number): void
    /** Resizes the canvas. */
    resizeCanvas(width?: number, height?: number, anchor?: any): void
    /** Pastes content. */
    paste(...args: any[]): Layer
    /** Closes the document. */
    close(): void
    /** Exports the document. */
    exportDocument(file: any, options: any, saveOptions: any): void
    /** Saves the document as. */
    saveAs(file: any, options: any): void
    /** Flattens the document. */
    flatten(): void
    /** Clears the history. */
    clearHistory(): void
  }

  export interface Layers extends Base<"Layers"> {
    /** The array of Layer objects. */
    K: Layer[]
    /** The number of layers. */
    length: number
    /** Access a layer by index. */
    [index: number]: Layer
    /**
     * Gets a layer by its name.
     * @param name The layer name.
     * @returns The Layer.
     */
    getByName(name: string): Layer
    /**
     * Adds a new layer or layer set.
     * @returns The new Layer.
     */
    add(): Layer
  }

  export interface Layer extends Base<"Layer"> {
    /** Whether the layer is visible. */
    visible: boolean
    /** Whether the layer is selected. */
    selected: boolean
    /** Whether the layer is grouped. */
    grouped: boolean
    /** Whether transparent pixels are locked. */
    transparentPixelsLocked: boolean
    /** Whether pixels are locked. */
    pixelsLocked: boolean
    /** Whether position is locked. */
    positionLocked: boolean
    /** Whether all properties are locked. */
    allLocked: boolean
    /** The layer opacity (0-100). */
    opacity: number
    /** The fill opacity (0-100). */
    fillOpacity: number
    /** The blend mode. */
    blendMode: string
    /** The layer name. */
    name: string
    /** The layer ID. */
    id: number
    /** The text item, if this is a text layer. */
    textItem: TextItem
    /** The layer bounds. */
    bounds: UnitValue[]
    /** The parent document or layer. */
    parent: Document | Layer
    /** The layer kind. */
    kind: number
    /** Whether this is a background layer. */
    isBackgroundLayer: boolean
    /** The 1-based item index. */
    itemIndex: number
    /** Dynamic: layerMaskDensity, layerMaskIv, filterMaskDensity, filterMaskIv, etc. */
    [dynamic: string]: any
    /**
     * Copies the layer.
     * @param args Additional arguments.
     */
    copy(...args: any[]): void
    /**
     * Clears the layer.
     */
    clear(): void
    /**
     * Applies auto levels to the layer.
     */
    autoLevels(): void
    /**
     * Applies auto contrast to the layer.
     */
    autoContrast(): void
    /**
     * Duplicates the layer.
     * @param targetDocument Optional target document.
     * @returns The duplicated Layer.
     */
    duplicate(targetDocument?: Document): Layer
    /**
     * Merges the layer.
     * @returns The merged Layer.
     */
    merge(): Layer
    /**
     * Removes the layer.
     */
    remove(): void
    /**
     * Moves the layer to a new position.
     * @param target The target Layer.
     * @param position The position index.
     */
    move(target: Layer, position: number): void
    /**
     * Rasterizes the layer.
     */
    rasterize(): void
    /**
     * Rotates the layer.
     * @param angle The angle in degrees.
     * @param anchor The anchor position.
     */
    rotate(angle: number, anchor?: any): void
    /**
     * Resizes the layer.
     * @param width The new width.
     * @param height The new height.
     * @param anchor The anchor position.
     */
    resize(width: number, height: number, anchor?: any): void
    /**
     * Translates the layer.
     * @param x The x offset.
     * @param y The y offset.
     */
    translate(x: number, y: number): void
    /**
     * Links this layer to another.
     * @param other The other Layer.
     */
    link(other: Layer): void
    /**
     * Inverts the layer.
     */
    invert(): void
    /**
     * Desaturates the layer.
     */
    desaturate(): void
    /**
     * Applies an adjustment to the layer.
     * @param args Adjustment arguments.
     */
    applyAdjustment(...args: any[]): void
    /**
     * Adjusts the layer.
     * @param args Adjustment arguments.
     */
    adjust(...args: any[]): void
    /**
     * Mixes channels for the layer.
     * @param args Channel mix arguments.
     */
    mixChannels(...args: any[]): void
    /**
     * Applies a style to the layer.
     * @param styleName The style name.
     */
    applyStyle(styleName: string): void
  }

  export interface LayerComps extends Base<"LayerComps"> {
    /** The array of LayerComp objects. */
    K: LayerComp[]
    /** The number of layer comps. */
    length: number
    /** Access a layer comp by index. */
    [index: number]: LayerComp
  }

  export interface LayerComp extends Base<"LayerComp"> {
    /** The name of the layer comp. */
    name: string
    /**
     * Applies the layer comp.
     */
    apply(): void
  }

  export interface HistoryStates extends Base<"HistoryStates"> {
    /** The array of HistoryState objects. */
    K: HistoryState[]
    /** The number of history states. */
    length: number
    /** Access a history state by index. */
    [index: number]: HistoryState
  }

  export interface HistoryState extends Base<"HistoryState"> {
    /** The history state index. */
    ry: number
  }

  export interface Selection extends Base<"Selection"> {
    /** The selection bounds. */
    bounds: any
    /**
     * Selects the given points.
     * @param points The array of [x, y] points.
     * @param args Additional arguments.
     */
    select(points: [number, number][], ...args: any[]): void
    /**
     * Clears the selection.
     */
    clear(): void
    /**
     * Selects all.
     */
    selectAll(): void
    /**
     * Inverts the selection.
     */
    invert(): void
    /**
     * Copies the selection.
     * @param args Additional arguments.
     */
    copy(...args: any[]): void
    /**
     * Deselects the selection.
     */
    deselect(): void
    /**
     * Fills the selection with a color.
     * @param color The color to fill.
     * @param mode The fill mode.
     * @param opacity The opacity (0-100).
     */
    fill(color: SolidColor, mode?: number, opacity?: number): void
    /**
     * Grows the selection.
     * @param tolerance The tolerance value.
     */
    grow(tolerance?: number): void
    /**
     * Selects similar pixels.
     * @param tolerance The tolerance value.
     */
    similar(tolerance?: number): void
    /**
     * Expands the selection.
     * @param amount The number of pixels to expand.
     */
    expand(amount: number): void
    /**
     * Contracts the selection.
     * @param amount The number of pixels to contract.
     */
    contract(amount: number): void
    /**
     * Feathers the selection.
     * @param radius The feather radius.
     */
    feather(radius: number): void
    /**
     * Translates the selection.
     * @param x The x offset.
     * @param y The y offset.
     */
    translate(x: number, y: number): void
    /**
     * Smooths the selection.
     * @param amount The smoothness value.
     */
    smooth(amount: number): void
    /**
     * Strokes the selection.
     * @param color The stroke color.
     * @param width The stroke width.
     * @param style The stroke style.
     */
    stroke(color: SolidColor, width: number, style: string): void
  }

  export interface TextItem extends Base<"TextItem"> {
    /** The text contents. */
    contents: string
    /** The font name. */
    font: string | null
    /** The font size. */
    size: number
    /** The leading value. */
    leading: number
    /** The tracking value. */
    tracking: number
    /** The baseline shift. */
    baselineShift: number
    /** The text kind. */
    kind: number
    /** The justification value. */
    justification: number
    /** The text color. */
    color: SolidColor
    /** The text width. */
    width: number
    /** The text height. */
    height: number
    /** The text position. */
    position: [number, number]
    /** The horizontal scale. */
    horizontalScale: number
    /** The vertical scale. */
    verticalScale: number
    /** The total text style as a string. */
    totalTextStyle: string
    /** The text transform as a string. */
    transform: string
  }

  export interface Preferences extends Base<"Preferences"> {
    /** The ruler units. */
    rulerUnits: any
  }

  export interface SolidColor extends Base<"SolidColor"> {
    /** The RGB color value. */
    rgb: RGBColor
    /** The CMYK color value. */
    cmyk: CMYKColor
    /** The color components array. */
    K: number[]
  }

  export interface RGBColor extends Base<"RGBColor"> {
    /** The red component (0-255). */
    red: number
    /** The green component (0-255). */
    green: number
    /** The blue component (0-255). */
    blue: number
    /** The hex color value. */
    hexValue: string
    /** The color components array. */
    K: number[]
  }

  export interface CMYKColor extends Base<"CMYKColor"> {
    /** The cyan component (0-100). */
    cyan: number
    /** The magenta component (0-100). */
    magenta: number
    /** The yellow component (0-100). */
    yellow: number
    /** The black component (0-100). */
    black: number
    /** The color components array. */
    K: number[]
  }

  export interface PathItems extends Base<"PathItems"> {
    /** The array of PathItem objects. */
    K: PathItem[]
    /** The number of path items. */
    length: number
    /** Access a path item by index. */
    [index: number]: PathItem
    /**
     * Adds a new path item.
     * @param args Arguments for the path item.
     * @returns The new PathItem.
     */
    add(...args: any[]): PathItem
  }

  export interface PathItem extends Base<"PathItem"> {
    /** The collection of sub path items. */
    subPathItems: SubPathItems
    /**
     * Selects the path item.
     */
    select(): void
    /**
     * Removes the path item.
     */
    remove(): void
  }

  export interface SubPathItems extends Base<"SubPathItems"> {
    /** The array of SubPathItem objects. */
    K: SubPathItem[]
    /** The number of sub path items. */
    length: number
    /** Access a sub path item by index. */
    [index: number]: SubPathItem
  }

  export interface SubPathItem extends Base<"SubPathItem"> {
    /** The collection of path points. */
    pathPoints: PathPoints
    /** The entire sub path as path points. */
    entireSubPath: PathPoints
    /** The operation type. */
    operation: any
    /** Whether the sub path is closed. */
    closed: boolean
    /** The array of path point data. */
    K: any[]
  }

  export interface PathPoints extends Base<"PathPoints"> {
    /** The array of PathPointInfo objects. */
    K: PathPointInfo[]
    /** The number of path points. */
    length: number
    /** Access a path point by index. */
    [index: number]: PathPointInfo
  }

  export interface PathPointInfo extends Base<"PathPointInfo"> {
    /** The kind of path point. */
    kind: number
    /** The anchor position. */
    anchor: [number, number]
    /** The left direction. */
    leftDirection: [number, number]
    /** The right direction. */
    rightDirection: [number, number]
  }

  export interface ColorSamplers extends Base<"ColorSamplers"> {
    /** The array of ColorSampler objects. */
    K: ColorSampler[]
    /** The number of color samplers. */
    length: number
    /** Access a color sampler by index. */
    [index: number]: ColorSampler
    /**
     * Removes all color samplers.
     */
    removeAll(): void
    /**
     * Adds a color sampler at the given position.
     * @param position The [x, y] position.
     * @returns The new ColorSampler.
     */
    add(position: [number, number]): ColorSampler
  }

  export interface ColorSampler extends Base<"ColorSampler"> {
    /** The color value. */
    color: SolidColor
    /** The position of the color sampler. */
    position: [number, number]
    /**
     * Moves the color sampler to the given position.
     * @param position The [x, y] position.
     */
    move(position: [number, number]): void
    /**
     * Removes the color sampler.
     */
    remove(): void
  }

  export interface UnitValue extends Base<"UnitValue"> {
    /** The numeric value. */
    value: number
  }

  export interface ExportOptionsSaveForWeb
    extends Base<"ExportOptionsSaveForWeb"> {
    /** The export format. */
    format: any
    /** Whether PNG8 is used. */
    PNG8: boolean
    /** Whether interlaced PNG is used. */
    interlaced: boolean
    /** The quality value. */
    quality: number
    /** Whether transparency is enabled. */
    transparency: boolean
  }

  export interface PNGSaveOptions extends Base<"PNGSaveOptions"> {}
  export interface JPEGSaveOptions extends Base<"JPEGSaveOptions"> {}
  export interface PDFSaveOptions extends Base<"PDFSaveOptions"> {}

  export interface $ extends Base<"$"> {
    /** Whether localization is enabled. */
    localize: boolean
    /** The operating system string. */
    os: string
    /**
     * Writes a message to the console.
     * @param message The message to write.
     */
    writeln(message: string): void
  }

  export interface UI extends Base<"UI"> {
    /**
     * Scrolls the view by the given amount.
     * @param x The x offset.
     * @param y The y offset.
     */
    scroll(x: number, y: number): void
    /**
     * Scrolls to the given position.
     * @param x The x position.
     * @param y The y position.
     */
    scrollTo(x: number, y: number): void
    /**
     * Zooms in.
     */
    zoomIn(): void
    /**
     * Zooms out.
     */
    zoomOut(): void
    /**
     * Fits the area to the screen.
     */
    fitTheArea(): void
    /**
     * Switches to pixel-to-pixel view.
     */
    pixelToPixel(): void
    /**
     * Switches fullscreen mode.
     */
    switchFullscreen(): void
  }

  export interface ActionReference extends Base<"ActionReference"> {
    /**
     * Adds a property reference.
     * @param classID The class ID.
     * @param keyID The key ID.
     */
    putProperty(classID: string, keyID: string): void
    /**
     * Adds a class reference.
     * @param classID The class ID.
     */
    putClass(classID: string): void
    /**
     * Adds an enumerated reference.
     * @param classID The class ID.
     * @param typeID The type ID.
     * @param enumValue The enum value.
     */
    putEnumerated(classID: string, typeID: string, enumValue: string): void
    /**
     * Adds a name reference.
     * @param classID The class ID.
     * @param value The name value.
     */
    putName(classID: string, value: string): void
    /**
     * Adds an index reference.
     * @param classID The class ID.
     * @param value The index value.
     */
    putIndex(classID: string, value: number): void
  }

  export interface ActionDescriptor extends Base<"ActionDescriptor"> {
    /**
     * Adds a reference value.
     * @param args Arguments for the reference.
     */
    putReference(...args: any[]): void
    /**
     * Adds an object value.
     * @param args Arguments for the object.
     */
    putObject(...args: any[]): void
    /**
     * Adds a list value.
     * @param args Arguments for the list.
     */
    putList(...args: any[]): void
    /**
     * Adds a double value.
     * @param args Arguments for the double.
     */
    putDouble(...args: any[]): void
    /**
     * Adds a unit double value.
     * @param args Arguments for the unit double.
     */
    putUnitDouble(...args: any[]): void
    /**
     * Adds a boolean value.
     * @param args Arguments for the boolean.
     */
    putBoolean(...args: any[]): void
    /**
     * Adds an integer value.
     * @param args Arguments for the integer.
     */
    putInteger(...args: any[]): void
    /**
     * Adds a string value.
     * @param args Arguments for the string.
     */
    putString(...args: any[]): void
    /**
     * Adds a class value.
     * @param args Arguments for the class.
     */
    putClass(...args: any[]): void
    /**
     * Adds an enumerated value.
     * @param args Arguments for the enumerated value.
     */
    putEnumerated(...args: any[]): void
    /**
     * Checks if the descriptor has a key.
     * @param key The key to check.
     * @returns True if the key exists.
     */
    hasKey(key: string): boolean
    /**
     * Gets the enumeration value for a key.
     * @param key The key.
     * @returns The enumeration value.
     */
    getEnumerationValue(key: string): string
    /**
     * Gets a boolean value for a key.
     * @param key The key.
     * @returns The boolean value.
     */
    getBoolean(key: string): boolean
    /**
     * Gets a string value for a key.
     * @param key The key.
     * @returns The string value.
     */
    getString(key: string): string
    /**
     * Gets an object value for a key.
     * @param key The key.
     * @returns The ActionDescriptor value.
     */
    getObjectValue(key: string): ActionDescriptor
    /**
     * Gets a list value for a key.
     * @param key The key.
     * @returns The ActionList value.
     */
    getList(key: string): ActionList
    /**
     * Gets an integer value for a key.
     * @param key The key.
     * @returns The integer value.
     */
    getInteger(key: string): number
    /**
     * Gets a double value for a key.
     * @param key The key.
     * @returns The double value.
     */
    getDouble(key: string): number
  }
  export interface ActionList extends Base<"ActionList"> {
    /**
     * Adds a reference value.
     * @param args Arguments for the reference.
     */
    putReference(...args: any[]): void
    /**
     * Adds an object value.
     * @param args Arguments for the object.
     */
    putObject(...args: any[]): void
    /**
     * Adds a list value.
     * @param args Arguments for the list.
     */
    putList(...args: any[]): void
    /**
     * Adds a double value.
     * @param args Arguments for the double.
     */
    putDouble(...args: any[]): void
    /**
     * Adds a unit double value.
     * @param args Arguments for the unit double.
     */
    putUnitDouble(...args: any[]): void
    /**
     * Adds a boolean value.
     * @param args Arguments for the boolean.
     */
    putBoolean(...args: any[]): void
    /**
     * Adds an integer value.
     * @param args Arguments for the integer.
     */
    putInteger(...args: any[]): void
    /**
     * Adds a string value.
     * @param args Arguments for the string.
     */
    putString(...args: any[]): void
    /**
     * Adds a class value.
     * @param args Arguments for the class.
     */
    putClass(...args: any[]): void
    /**
     * Adds an enumerated value.
     * @param args Arguments for the enumerated value.
     */
    putEnumerated(...args: any[]): void
    /**
     * Checks if the list has a key.
     * @param key The key to check.
     * @returns True if the key exists.
     */
    hasKey(key: string): boolean
    /**
     * Gets the enumeration value for a key.
     * @param key The key.
     * @returns The enumeration value.
     */
    getEnumerationValue(key: string): string
    /**
     * Gets a boolean value for a key.
     * @param key The key.
     * @returns The boolean value.
     */
    getBoolean(key: string): boolean
    /**
     * Gets a string value for a key.
     * @param key The key.
     * @returns The string value.
     */
    getString(key: string): string
    /**
     * Gets an object value for a key.
     * @param key The key.
     * @returns The ActionDescriptor value.
     */
    getObjectValue(key: string): ActionDescriptor
    /**
     * Gets a list value for a key.
     * @param key The key.
     * @returns The ActionList value.
     */
    getList(key: string): ActionList
    /**
     * Gets an integer value for a key.
     * @param key The key.
     * @returns The integer value.
     */
    getInteger(key: string): number
    /**
     * Gets a double value for a key.
     * @param key The key.
     * @returns The double value.
     */
    getDouble(key: string): number
  }

  // Other types referenced
  export interface TextFonts extends Base<"TextFonts"> {
    // Not implemented in photopea side
  }
  export interface DialogModes extends Base<"DialogModes"> {
    // Not implemented in photopea side
  }
  export interface UI extends Base<"UI"> {
    // Not implemented in photopea side
  }

  // Photopea Enums

  export enum AnchorPosition {
    TOPLEFT = 0,
    TOPCENTER = 1,
    TOPRIGHT = 2,
    MIDDLELEFT = 3,
    MIDDLECENTER = 4,
    MIDDLERIGHT = 5,
    BOTTOMLEFT = 6,
    BOTTOMCENTER = 7,
    BOTTOMRIGHT = 8
  }

  export enum Units {
    PIXELS = 0,
    INCHES = 1,
    CM = 2,
    MM = 3,
    PERCENT = 4,
    PICAS = 5,
    POINTS = 6
  }

  export enum ElementPlacement {
    INSIDE = 0,
    PLACEATBEGINNING = 1,
    PLACEATEND = 2,
    PLACEBEFORE = 3,
    PLACEAFTER = 4
  }

  export enum LayerKind {
    NORMAL = 0,
    SMARTOBJECT = 1,
    TEXT = 2,
    SOLIDFILL = 3,
    GRADIENTFILL = 4,
    PATTERNFILL = 5,
    BRIGHTNESSCONTRAST = 6,
    LEVELS = 7,
    CURVES = 8,
    EXPOSURE = 9,
    VIBRANCE = 10,
    HUESATURATION = 11,
    COLORBALANCE = 12,
    BLACKANDWHITE = 13,
    PHOTOFILTER = 14,
    CHANNELMIXER = 15,
    LAYER3D = 16,
    INVERSION = 17,
    POSTERIZE = 18,
    THRESHOLD = 19,
    GRADIENTMAP = 20,
    SELECTIVECOLOR = 21
  }

  export enum RippleSize {
    SMALL = 0,
    MEDIUM = 1,
    LARGE = 2
  }

  export enum PolarConversionType {
    POLARTORECTANGULAR = 1,
    RECTANGULARTOPOLAR = 0
  }

  export enum OffsetUndefinedAreas {
    REPEATEDGEPIXELS = 0,
    SETTOBACKGROUND = 1,
    WRAPAROUND = 2
  }

  export enum NoiseDistribution {
    GAUSSIAN = 0,
    UNIFORM = 1
  }

  export enum TextType {
    PARAGRAPHTEXT = 0,
    POINTTEXT = 1
  }

  export enum DialogModesEnum {
    ALL = 0,
    ERROR = 1,
    NO = 2
  }

  export enum SaveOptions {
    DONOTSAVECHANGES = 0,
    PROMPTTOSAVECHANGES = 1,
    SAVECHANGES = 2
  }

  export enum SaveDocumentType {
    PNG = "png",
    JPEG = "jpg",
    COMPUSERVEGIF = "gif"
  }

  export enum ExportType {
    SAVEFORWEB = 0
  }

  export enum MatteType {
    BACKGROUND = 0,
    BLACK = 1,
    FOREGROUND = 2,
    NETSCAPE = 3,
    NONE = 4,
    SEMIGRAY = 5,
    WHITE = 6
  }

  export enum FormatOptions {
    OPTIMIZEDBASELINE = 0,
    PROGRESSIVE = 1,
    STANDARDBASELINE = 3
  }

  export enum DocumentMode {
    BITMAP = 0,
    CMYK = 1,
    DUOTONE = 2,
    GRAYSCALE = 3,
    INDEXEDCOLOR = 4,
    LAB = 5,
    MULTICHANNEL = 6,
    RGB = 7
  }

  export enum NewDocumentMode {
    BITMAP = 0,
    CMYK = 1,
    DUOTONE = 2,
    GRAYSCALE = 3,
    INDEXEDCOLOR = 4,
    LAB = 5,
    MULTICHANNEL = 6,
    RGB = 7
  }

  export enum ChangeMode {
    BITMAP = 0,
    CMYK = 1,
    DUOTONE = 2,
    GRAYSCALE = 3,
    INDEXEDCOLOR = 4,
    LAB = 5,
    MULTICHANNEL = 6,
    RGB = 7
  }

  export enum DocumentFill {
    WHITE = 0,
    TRANSPARENT = 1,
    BACKGROUNDCOLOR = 2
  }

  export enum BitsPerChannelType {
    ONE = 0,
    EIGHT = 1,
    SIXTEEN = 2,
    THIRTYTWO = 3
  }

  export enum TrimType {
    TOPLEFT = 0,
    BOTTOMRIGHT = 1,
    TRANSPARENT = 2
  }

  export enum WaveType {
    SINE = 0,
    TRIANGULAR = 1,
    SQUARE = 2
  }

  export enum UndefinedAreas {
    WRAPAROUND = 0,
    REPEATEDGEPIXELS = 1
  }

  export enum BlendMode {
    NORMAL = "norm",
    DISSOLVE = "diss",
    DARKEN = "dark",
    MULTIPLY = "mul ",
    COLORBURN = "idiv",
    LINEARBURN = "lbrn",
    DARKERCOLOR = "dkCl",
    LIGHTEN = "lite",
    SCREEN = "scrn",
    COLORDODGE = "div ",
    LINEARDODGE = "lddg",
    LIGHTERCOLOR = "lgCl",
    OVERLAY = "over",
    SOFTLIGHT = "sLit",
    HARDLIGHT = "hLit",
    VIVIDLIGHT = "vLit",
    LINEARLIGHT = "lLit",
    PINLIGHT = "pLit",
    HARDMIX = "hMix",
    DIFFERENCE = "diff",
    EXCLUSION = "smud",
    SUBTRACT = "fsub",
    DIVIDE = "fdiv",
    HUE = "hue ",
    SATURATION = "sat ",
    COLOR = "colr",
    LUMINOSITY = "lum "
  }

  export enum Justification {
    LEFT = 0,
    RIGHT = 1,
    CENTER = 2,
    LEFTJUSTIFIED = 3,
    RIGHTJUSTIFIED = 4,
    CENTERJUSTIFIED = 5,
    FULLYJUSTIFIED = 6
  }

  export enum AntiAlias {
    NONE = 0,
    SHARP = 1,
    CRISP = 2,
    STRONG = 3,
    SMOOTH = 4
  }

  export enum Extension {
    LOWERCASE = 0,
    NONE = 1,
    UPPERCASE = 2
  }

  export enum RasterizeType {
    ENTIRELAYER = 0,
    FILLCONTENT = 1,
    LAYERCLIPPINGPATH = 2,
    LINKEDLAYERS = 3,
    SHAPE = 4,
    TEXTCONTENTS = 5
  }

  export enum DisplacementMapType {
    STRETCHTOFIT = 0,
    TILE = 1
  }

  export enum StrokeLocation {
    INSIDE = 0,
    CENTER = 1,
    OUTSIDE = 2
  }

  export enum SelectionType {
    REPLACE = 0,
    EXTEND = 1,
    DIMINISH = 2,
    INTERSECT = 3
  }

  export enum ResampleMethod {
    AUTOMATIC = 0,
    BICUBIC = 1,
    BICUBICAUTOMATIC = 2,
    BICUBICSHARPER = 3,
    BICUBICSMOOTHER = 4,
    BILINEAR = 5,
    NEARESTNEIGHBOR = 6,
    NONE = 7,
    PRESERVEDETAILS = 8
  }

  export enum PointKind {
    CORNERPOINT = 0,
    SMOOTHPOINT = 1
  }

  export enum ShapeOperation {
    SHAPEXOR = 0,
    SHAPEADD = 1,
    SHAPESUBTRACT = 2,
    SHAPEINTERSECT = 3
  }

  export enum Direction {
    HORIZONTAL = 0,
    VERTICAL = 1
  }

  //
}
