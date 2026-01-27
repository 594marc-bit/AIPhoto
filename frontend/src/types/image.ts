export interface ImageFile {
  id: string
  file: File
  url: string
  name: string
  size: number
  type: string
  width?: number | undefined
  height?: number | undefined
  exif?: ExifData | undefined
  processedUrl?: string | undefined
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string | undefined
  // Custom settings override for this specific image
  customSettings?: ImageCustomSettings | undefined
}

// Per-image custom settings (all optional)
export interface ImageCustomSettings {
  borderStyle?: Partial<BorderStyle> | undefined
  logoConfig?: LogoConfig | undefined
  logoConfigs?: LogoConfig[] | undefined // Support multiple logos
  presetLogoConfig?: LogoConfig | undefined // Preset logo config (task 3.3)
  customLogoConfig?: LogoConfig | undefined // Custom logo config (task 3.3)
  exifFields?: string[] | undefined
  showExif?: boolean | undefined
  exifTextAlign?: 'left' | 'center' | 'right' | undefined
  exifTextOffset?: number | undefined
  exifTextOffsetX?: number | undefined
  exifTextOffsetY?: number | undefined
  exifFontFamily?: string | undefined
  exifFontSize?: number | undefined
  exifTextColor?: string | undefined
  outputWidth?: number | undefined
  outputHeight?: number | undefined
  maintainAspectRatio?: boolean | undefined
  quality?: number | undefined
}

export interface ExifData {
  make?: string
  model?: string
  dateTime?: string
  exposureTime?: string
  fNumber?: string
  iso?: string
  focalLength?: string
  lensModel?: string
}

export interface UploadOptions {
  maxSize: number // bytes
  allowedTypes: string[]
  multiple: boolean
}

export interface BorderStyle {
  id: string
  name: string
  type: 'bottom' | 'full' | 'artistic' | 'blur' | 'custom'
  bottomHeight?: number
  bottomHeightPercent?: number // 0-100, percentage of image height
  sideWidth?: number
  sideWidthPercent?: number // 0-100, percentage of image width
  topWidthPercent?: number // 0-100, percentage of image height
  leftWidthPercent?: number // 0-100, percentage of image width
  rightWidthPercent?: number // 0-100, percentage of image width
  padding?: number
  backgroundColor?: string
  textColor?: string
  font?: string
  fontSize?: number
  showExif?: boolean
  showLogo?: boolean
  logoPosition?: 'left' | 'center' | 'right'
  blur?: boolean
  shadow?: boolean
}

export interface LogoConfig {
  id: string
  name: string
  url: string
  position: 'top' | 'bottom'
  align: 'left' | 'center' | 'right'
  size: number // percentage of image width (1-20%)
  opacity: number
  showLogo?: boolean
  offsetX?: number // -100 to 100, horizontal offset in percentage
  offsetY?: number // -100 to 100, vertical offset in percentage
}

export interface ProcessOptions {
  borderStyle: BorderStyle
  logoConfig?: LogoConfig
  logoConfigs?: LogoConfig[] // Support multiple logos
  exifFields: string[]
  exifTextAlign?: 'left' | 'center' | 'right'
  exifTextOffset?: number
  exifTextOffsetX?: number // -100 to 100, horizontal offset from center in percentage
  exifTextOffsetY?: number // -100 to 100, vertical offset from center in percentage
  exifFontFamily?: string
  exifFontSize?: number
  exifTextColor?: string
  outputWidth?: number
  outputHeight?: number
  maintainAspectRatio: boolean
  quality: number
}
