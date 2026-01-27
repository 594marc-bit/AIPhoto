import type { ExifData } from '@/types/image';

// EXIF tag mappings
const EXIF_TAG_NAMES: Record<number, string> = {
  0x010F: 'Make',
  0x0110: 'Model',
  0x0112: 'Orientation',
  0x011A: 'XResolution',
  0x011B: 'YResolution',
  0x0128: 'ResolutionUnit',
  0x0131: 'Software',
  0x0132: 'DateTime',
  0x013B: 'Artist',
  0x8298: 'Copyright',
  0x8769: 'ExifIFDPointer',
  0x8825: 'GPSInfoIFDPointer',
};

const EXIF_TAG_NAMES_SUB: Record<number, string> = {
  0x829A: 'ExposureTime',
  0x829D: 'FNumber',
  0x8827: 'FocalLength',
  0x8822: 'ExposureProgram',
  0x8824: 'SpectralSensitivity',
  0x8828: 'OECF',
  0x8830: 'SensitivityType',
  0x8831: 'StandardOutputSensitivity',
  0x8832: 'RecommendedExposureIndex',
  0x8833: 'ISOSpeed',
  0x8834: 'ISOSpeedLatitudeyyy',
  0x8835: 'ISOSpeedLatitudezzz',
  0x9000: 'ExifVersion',
  0x9003: 'DateTimeOriginal',
  0x9004: 'DateTimeDigitized',
  0x9101: 'ComponentsConfiguration',
  0x9102: 'CompressedBitsPerPixel',
  0x9201: 'ShutterSpeedValue',
  0x9202: 'ApertureValue',
  0x9203: 'BrightnessValue',
  0x9204: 'ExposureBiasValue',
  0x9205: 'MaxApertureValue',
  0x9206: 'SubjectDistance',
  0x9207: 'MeteringMode',
  0x9208: 'LightSource',
  0x9209: 'Flash',
  0x920A: 'FocalLength',
  0x927C: 'MakerNote',
  0x9286: 'UserComment',
  0x9290: 'SubSecTime',
  0x9291: 'SubSecTimeOriginal',
  0x9292: 'SubSecTimeDigitized',
  0xA000: 'FlashpixVersion',
  0xA001: 'ColorSpace',
  0xA002: 'PixelXDimension',
  0xA003: 'PixelYDimension',
  0xA004: 'RelatedSoundFile',
  0xA005: 'InteroperabilityIFDPointer',
  0xA20B: 'FlashEnergy',
  0xA20C: 'SpatialFrequencyResponse',
  0xA20E: 'FocalPlaneXResolution',
  0xA20F: 'FocalPlaneYResolution',
  0xA210: 'FocalPlaneResolutionUnit',
  0xA214: 'SubjectLocation',
  0xA215: 'ExposureIndex',
  0xA217: 'SensingMethod',
  0xA300: 'FileSource',
  0xA301: 'SceneType',
  0xA302: 'CFAPattern',
  0xA401: 'CustomRendered',
  0xA402: 'ExposureMode',
  0xA403: 'WhiteBalance',
  0xA404: 'DigitalZoomRatio',
  0xA405: 'FocalLengthIn35mmFilm',
  0xA406: 'SceneCaptureType',
  0xA407: 'GainControl',
  0xA408: 'Contrast',
  0xA409: 'Saturation',
  0xA40A: 'Sharpness',
  0xA40B: 'DeviceSettingDescription',
  0xA40C: 'SubjectDistanceRange',
  0xA420: 'ImageUniqueID',
  0xA430: 'CameraOwnerName',
  0xA431: 'BodySerialNumber',
  0xA432: 'LensSpecification',
  0xA433: 'LensMake',
  0xA434: 'LensModel',
  0xA435: 'LensSerialNumber',
  0xA500: 'Gamma',
};

interface DataReader {
  data: DataView;
  offset: number;
  length: number;
}

/**
 * Read EXIF data from a file
 */
export function readExifFromFile(file: File): Promise<ExifData | null> {
  return new Promise((resolve) => {
    console.log('[exifReader] Reading EXIF from file:', file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) {
          console.log('[exifReader] No result from file reader');
          resolve(null);
          return;
        }

        const view = new DataView(result as ArrayBuffer);
        const exifData = parseExifFromView(view);
        console.log('[exifReader] Parsed EXIF data:', exifData);
        resolve(exifData);
      } catch (error) {
        console.error('[exifReader] Error reading EXIF:', error);
        resolve(null);
      }
    };

    reader.onerror = () => {
      console.error('[exifReader] File reader error');
      resolve(null);
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse EXIF data from DataView
 */
function parseExifFromView(view: DataView): ExifData | null {
  console.log('[exifReader] Parsing EXIF from DataView, length:', view.byteLength);

  // Check for JPEG start marker
  if (view.getUint16(0) !== 0xFFD8) {
    console.log('[exifReader] Not a JPEG file');
    return null;
  }

  const reader: DataReader = {
    data: view,
    offset: 2,
    length: view.byteLength,
  };

  // Find APP1 marker (0xFFE1)
  while (reader.offset < reader.length) {
    if (view.getUint16(reader.offset) !== 0xFFE1) {
      // Skip to next marker
      const segmentLength = view.getUint16(reader.offset + 2);
      reader.offset += 2 + 2 + segmentLength;
      continue;
    }

    // Found APP1 marker
    reader.offset += 2;

    // Get segment length
    view.getUint16(reader.offset);
    reader.offset += 2;

    // Check for EXIF identifier
    const exifIdentifier = 'Exif\x00\x00';
    let hasExif = true;
    for (let i = 0; i < 6; i++) {
      if (view.getUint8(reader.offset + i) !== exifIdentifier.charCodeAt(i)) {
        hasExif = false;
        break;
      }
    }

    if (!hasExif) {
      console.log('[exifReader] APP1 segment found but no EXIF identifier');
      return null;
    }

    reader.offset += 6;

    // Read TIFF header
    const tiffOffset = reader.offset;

    // Check byte order (II = little endian, MM = big endian)
    const byteOrder = view.getUint16(tiffOffset);
    const littleEndian = byteOrder === 0x4949;

    console.log('[exifReader] Byte order:', littleEndian ? 'Little Endian' : 'Big Endian');

    // Check TIFF magic number (42)
    const magicNumber = view.getUint16(tiffOffset + 2, littleEndian);
    if (magicNumber !== 42) {
      console.log('[exifReader] Invalid TIFF magic number:', magicNumber);
      return null;
    }

    // Get offset to first IFD
    const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian);
    console.log('[exifReader] First IFD offset:', ifdOffset);

    // Validate IFD offset
    if (ifdOffset >= view.byteLength) {
      console.log('[exifReader] Invalid IFD offset:', ifdOffset, 'exceeds buffer length:', view.byteLength);
      return null;
    }

    // Read IFD0 (Image File Directory 0)
    const ifd0Tags = readIFD(view, tiffOffset + ifdOffset, tiffOffset, littleEndian);
    console.log('[exifReader] IFD0 tags:', ifd0Tags);

    // Get EXIF IFD pointer
    const exifIFDPointer = ifd0Tags['ExifIFDPointer'] as number | undefined;
    let exifTags: Record<string, unknown> = {};

    if (exifIFDPointer) {
      console.log('[exifReader] EXIF IFD pointer:', exifIFDPointer, '(hex: 0x' + exifIFDPointer.toString(16) + ')');

      // Try multiple interpretations of the pointer
      // The pointer might be byte-swapped or need different offset calculation
      const possibleOffsets = [
        exifIFDPointer,  // As-is (relative to TIFF)
        tiffOffset + exifIFDPointer,  // Absolute offset
      ];

      // Also try byte-swapped version if the pointer is unusually large
      if (exifIFDPointer > 0x1000000) {
        // Try swapping bytes: 0x829a0029 -> 0x29009a82 (still too large)
        // Or it might be that we need to reinterpret as opposite endian
        const buffer = new ArrayBuffer(4);
        const DataView2 = new DataView(buffer);
        DataView2.setUint32(0, exifIFDPointer, littleEndian);
        // Read back with opposite endian
        const swapped = DataView2.getUint32(0, !littleEndian);
        console.log('[exifReader] Trying byte-swapped pointer:', swapped, '(hex: 0x' + swapped.toString(16) + ')');
        if (swapped < view.byteLength) {
          possibleOffsets.push(swapped);
          possibleOffsets.push(tiffOffset + swapped);
        }

        // Also try just taking lower 24 bits or 16 bits
        const masked24 = exifIFDPointer & 0xFFFFFF;
        const masked16 = exifIFDPointer & 0xFFFF;
        console.log('[exifReader] Trying masked pointers - 24bit:', masked24, '16bit:', masked16);
        if (masked24 < view.byteLength) {
          possibleOffsets.push(masked24);
          possibleOffsets.push(tiffOffset + masked24);
        }
        if (masked16 < view.byteLength) {
          possibleOffsets.push(masked16);
          possibleOffsets.push(tiffOffset + masked16);
        }
      }

      for (const offset of possibleOffsets) {
        if (offset > 0 && offset < view.byteLength) {
          console.log('[exifReader] Trying to read EXIF IFD at offset:', offset, '(hex: 0x' + offset.toString(16) + ')');
          try {
            const testTags = readIFD(view, offset, tiffOffset, littleEndian);
            if (Object.keys(testTags).length > 0) {
              console.log('[exifReader] Successfully read EXIF IFD at offset:', offset);
              exifTags = testTags;
              break;
            }
          } catch (error) {
            console.log('[exifReader] Failed to read at offset', offset, ':', error);
          }
        }
      }

      if (Object.keys(exifTags).length > 0) {
        console.log('[exifReader] EXIF IFD tags:', exifTags);
      } else {
        console.warn('[exifReader] Could not read EXIF IFD with any offset');
      }
    } else {
      console.warn('[exifReader] No EXIF IFD pointer found');
    }

    // Parse EXIF data
    const parsed = parseExifData({ ...ifd0Tags, ...exifTags });
    console.log('[exifReader] Final parsed EXIF data:', parsed);
    return parsed;
  }

  console.log('[exifReader] No EXIF data found in image');
  return null;
}

/**
 * Read IFD (Image File Directory)
 */
function readIFD(
  view: DataView,
  offset: number,
  tiffOffset: number,
  littleEndian: boolean,
): Record<string, unknown> {
  const tags: Record<string, unknown> = {};

  // Check if offset is valid
  if (offset + 2 > view.byteLength) {
    console.warn('[exifReader.readIFD] Invalid offset:', offset, 'buffer length:', view.byteLength);
    return tags;
  }

  const numEntries = view.getUint16(offset, littleEndian);
  console.log(`[exifReader.readIFD] Reading ${numEntries} entries at offset ${offset}`);

  // Validate number of entries
  if (numEntries > 1000) {
    console.warn('[exifReader.readIFD] Too many entries:', numEntries);
    return tags;
  }

  let entryOffset = offset + 2;

  for (let i = 0; i < numEntries; i++) {
    // Check if we have enough data to read this entry
    if (entryOffset + 12 > view.byteLength) {
      console.warn('[exifReader.readIFD] Not enough data for entry', i);
      break;
    }

    const tagNumber = view.getUint16(entryOffset, littleEndian);
    const tagType = view.getUint16(entryOffset + 2, littleEndian);
    const numValues = view.getUint32(entryOffset + 4, littleEndian);
    const valueOffset = view.getUint32(entryOffset + 8, littleEndian);

    const tagName = EXIF_TAG_NAMES[tagNumber] || EXIF_TAG_NAMES_SUB[tagNumber] || `Tag_${tagNumber}`;

    // Debug: Log raw bytes for ExifIFDPointer entry
    if (tagNumber === 0x8769) {
      console.log(`[readIFD] ExifIFDPointer raw entry at offset 0x${entryOffset.toString(16)}:`);
      console.log(`[readIFD]   Bytes 0-1 (tag): 0x${view.getUint16(entryOffset, littleEndian).toString(16).padStart(4, '0')}`);
      console.log(`[readIFD]   Bytes 2-3 (type): ${tagType}`);
      console.log(`[readIFD]   Bytes 4-7 (count): ${numValues}`);
      console.log(`[readIFD]   Bytes 8-11 (value/offset): 0x${view.getUint32(entryOffset + 8, littleEndian).toString(16).padStart(8, '0')}`);
      // Also show individual bytes
      for (let b = 0; b < 12; b++) {
        console.log(`[readIFD]   Byte ${b} (0x${(entryOffset + b).toString(16)}): 0x${view.getUint8(entryOffset + b).toString(16).padStart(2, '0')}`);
      }
    }

    // Read the value based on type
    try {
      const value = readTagValue(view, tiffOffset, littleEndian, tagType, numValues, valueOffset, entryOffset + 8);
      tags[tagName] = value;

      // Debug: Log ExifIFDPointer specifically
      if (tagName === 'ExifIFDPointer') {
        console.log(`[readIFD] ExifIFDPointer: tagNumber=0x${tagNumber.toString(16)}, value=${value}, type=${tagType}, count=${numValues}, inlineOffset=0x${(entryOffset + 8).toString(16)}, valueOffset=0x${valueOffset.toString(16)}`);
      }
    } catch (error) {
      console.warn(`[exifReader.readIFD] Failed to read tag ${tagName}:`, error);
    }

    entryOffset += 12;
  }

  return tags;
}

/**
 * Read tag value based on type
 */
function readTagValue(
  view: DataView,
  tiffOffset: number,
  littleEndian: boolean,
  type: number,
  count: number,
  valueOffset: number,
  inlineOffset: number,
): string | number {
  // Type definitions: 1=BYTE, 2=ASCII, 3=SHORT, 4=LONG, 5=RATIONAL, 7=UNDEFINED, 9=SLONG, 10=SRATIONAL
  // Array index maps to type number. Values are bytes per element.
  const typeSize = [0, 1, 1, 2, 4, 8, 0, 1, 0, 4, 8];

  // If value fits in 4 bytes, it's stored inline
  const typeSizeValue = typeSize[type];
  if (typeSizeValue === undefined) {
    console.warn('[readTagValue] Unknown type:', type);
    return valueOffset;
  }
  const totalSize = typeSizeValue * count;
  const offset = totalSize <= 4 ? inlineOffset : tiffOffset + valueOffset;

  // Validate offset
  if (offset >= view.byteLength) {
    console.warn('[readTagValue] Invalid offset:', offset, 'buffer length:', view.byteLength);
    return valueOffset;
  }

  switch (type) {
    case 2: { // ASCII string
      let str = '';
      for (let i = 0; i < count - 1; i++) {
        if (offset + i >= view.byteLength) break;
        // Stop at null terminator
        const charCode = view.getUint8(offset + i);
        if (charCode === 0) break;
        str += String.fromCharCode(charCode);
      }
      return str;
    }

    case 3: { // Short (uint16)
      if (offset + 2 > view.byteLength) return valueOffset;
      if (count === 1) {
        return view.getUint16(offset, littleEndian);
      }
      return view.getUint16(offset, littleEndian); // Just return first value
    }

    case 4: { // Long (uint32)
      if (offset + 4 > view.byteLength) return valueOffset;
      // Debug logging for LONG type
      const rawValue = view.getUint32(offset, littleEndian);
      console.log(`[readTagValue] Reading LONG at offset 0x${offset.toString(16)}: bytes=[0x${view.getUint8(offset).toString(16).padStart(2,'0')},0x${view.getUint8(offset+1).toString(16).padStart(2,'0')},0x${view.getUint8(offset+2).toString(16).padStart(2,'0')},0x${view.getUint8(offset+3).toString(16).padStart(2,'0')}] value=0x${rawValue.toString(16).padStart(8,'0')} (${rawValue}) littleEndian=${littleEndian}`);
      if (count === 1) {
        return rawValue;
      }
      return rawValue;
    }

    case 5: { // Rational (2 longs: numerator/denominator)
      if (offset + 8 > view.byteLength) return valueOffset;
      const num = view.getUint32(offset, littleEndian);
      const den = view.getUint32(offset + 4, littleEndian);
      return den !== 0 ? num / den : 0;
    }

    case 10: { // Signed Rational
      if (offset + 8 > view.byteLength) return valueOffset;
      const snum = view.getInt32(offset, littleEndian);
      const sden = view.getInt32(offset + 4, littleEndian);
      return sden !== 0 ? snum / sden : 0;
    }

    default:
      return valueOffset;
  }
}

/**
 * Parse raw EXIF data into our ExifData format
 */
function parseExifData(tags: Record<string, unknown>): ExifData | null {
  if (!tags || Object.keys(tags).length === 0) {
    return null;
  }

  console.log('[parseExifData] All available tags:', Object.keys(tags));

  const data: ExifData = {};

  // Camera make and model
  if (tags.Make && typeof tags.Make === 'string') data.make = tags.Make.trim();
  if (tags.Model && typeof tags.Model === 'string') data.model = tags.Model.trim();

  // Date/time
  if (tags.DateTimeOriginal && typeof tags.DateTimeOriginal === 'string') {
    data.dateTime = formatDate(tags.DateTimeOriginal);
  } else if (tags.DateTime && typeof tags.DateTime === 'string') {
    data.dateTime = formatDate(tags.DateTime);
  }

  // Exposure information - try multiple possible tag names
  if (tags.ExposureTime !== undefined) {
    data.exposureTime = formatExposureTime(tags.ExposureTime as number | string);
  }

  if (tags.FNumber !== undefined) {
    data.fNumber = formatFNumber(tags.FNumber as number | string);
  }

  // ISO - try multiple possible tag names
  // EXIF 2.3 uses PhotographicSensitivity (0x8827)
  // Older versions use ISOSpeedRatings
  // Some cameras use StandardOutputSensitivity or RecommendedExposureIndex
  if (tags.PhotographicSensitivity !== undefined) {
    data.iso = `ISO ${Number(tags.PhotographicSensitivity)}`;
    console.log('[parseExifData] Found PhotographicSensitivity:', tags.PhotographicSensitivity);
  } else if (tags.ISOSpeedRatings !== undefined) {
    data.iso = `ISO ${Number(tags.ISOSpeedRatings)}`;
    console.log('[parseExifData] Found ISOSpeedRatings:', tags.ISOSpeedRatings);
  } else if (tags.ISOSpeed !== undefined) {
    data.iso = `ISO ${Number(tags.ISOSpeed)}`;
    console.log('[parseExifData] Found ISOSpeed:', tags.ISOSpeed);
  } else if (tags.StandardOutputSensitivity !== undefined) {
    data.iso = `ISO ${Number(tags.StandardOutputSensitivity)}`;
    console.log('[parseExifData] Found StandardOutputSensitivity:', tags.StandardOutputSensitivity);
  } else if (tags.RecommendedExposureIndex !== undefined) {
    data.iso = `ISO ${Number(tags.RecommendedExposureIndex)}`;
    console.log('[parseExifData] Found RecommendedExposureIndex:', tags.RecommendedExposureIndex);
  } else {
    console.log('[parseExifData] ISO not found, available keys:', Object.keys(tags).filter(k => k.toLowerCase().includes('iso') || k.toLowerCase().includes('sensitivity')));
  }

  // Focal length
  if (tags.FocalLength !== undefined) {
    data.focalLength = formatFocalLength(tags.FocalLength as number | string);
  }

  if (tags.LensModel && typeof tags.LensModel === 'string') {
    data.lensModel = tags.LensModel.trim();
  }

  // Return null if no data was extracted
  return Object.keys(data).length > 0 ? data : null;
}

/**
 * Format date string
 */
function formatDate(dateStr: string): string {
  try {
    // EXIF date format: "YYYY:MM:DD HH:MM:SS"
    const parts = dateStr.split(' ');
    if (parts.length === 2) {
      const [datePart, timePart] = parts;
      if (!datePart) return dateStr;
      const [year, month, day] = datePart.split(':');
      return `${year}-${month}-${day} ${timePart}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Format exposure time
 */
function formatExposureTime(time: number | string): string {
  const num = typeof time === 'string' ? parseFloat(time) : time;

  if (num >= 1) {
    return `${num}s`;
  }

  // Convert to fraction
  const denominator = Math.round(1 / num);
  return `1/${denominator}s`;
}

/**
 * Format F-number
 */
function formatFNumber(fnum: number | string): string {
  const num = typeof fnum === 'string' ? parseFloat(fnum) : fnum;
  return `f/${num}`;
}

/**
 * Format focal length
 */
function formatFocalLength(length: number | string): string {
  const num = typeof length === 'string' ? parseFloat(length) : length;
  return `${num}mm`;
}

/**
 * Get camera brand name from make
 */
export function getCameraBrand(make?: string): string {
  if (!make) return 'Unknown';

  const makeLower = make.toLowerCase();

  // Canon
  if (makeLower.includes('canon')) return 'Canon';

  // Nikon
  if (makeLower.includes('nikon')) return 'Nikon';

  // Sony
  if (makeLower.includes('sony')) return 'Sony';

  // Fujifilm
  if (makeLower.includes('fuji') || makeLower.includes('fujifilm')) return 'Fujifilm';

  // Olympus
  if (makeLower.includes('olympus')) return 'Olympus';

  // Panasonic
  if (makeLower.includes('panasonic') || makeLower.includes('lumix')) return 'Panasonic';

  // Pentax
  if (makeLower.includes('pentax') || makeLower.includes('ricoh')) return 'Pentax';

  // Leica
  if (makeLower.includes('leica')) return 'Leica';

  // Samsung
  if (makeLower.includes('samsung')) return 'Samsung';

  // Hasselblad
  if (makeLower.includes('hasselblad')) return 'Hasselblad';

  // Phase One
  if (makeLower.includes('phase one')) return 'Phase One';

  // DJI
  if (makeLower.includes('dji')) return 'DJI';

  // GoPro
  if (makeLower.includes('gopro')) return 'GoPro';

  // Apple (iPhone)
  if (makeLower.includes('apple')) return 'Apple';

  // Google (Pixel)
  if (makeLower.includes('google')) return 'Google';

  // Xiaomi
  if (makeLower.includes('xiaomi')) return 'Xiaomi';

  // Huawei
  if (makeLower.includes('huawei')) return 'Huawei';

  // OPPO
  if (makeLower.includes('oppo')) return 'OPPO';

  // Vivo
  if (makeLower.includes('vivo')) return 'Vivo';

  // OnePlus
  if (makeLower.includes('oneplus')) return 'OnePlus';

  // Return original make if not recognized
  return make;
}

/**
 * Generate formatted EXIF text for display
 */
export function generateExifText(exif: ExifData, fields: string[]): string[] {
  const lines: string[] = [];

  const fieldMap: Record<string, () => string | undefined> = {
    make: () => exif.make,
    model: () => exif.model,
    dateTime: () => exif.dateTime,
    exposureTime: () => exif.exposureTime,
    fNumber: () => exif.fNumber,
    iso: () => exif.iso,
    focalLength: () => exif.focalLength,
    lensModel: () => exif.lensModel,
  };

  for (const field of fields) {
    const getter = fieldMap[field];
    if (getter) {
      const value = getter();
      if (value) {
        lines.push(value);
      }
    }
  }

  return lines;
}

/**
 * Get all available EXIF fields with labels
 */
export const EXIF_FIELDS: Array<{ value: string; label: string; description: string }> = [
  { value: 'model', label: '相机型号', description: '相机具体型号' },
  { value: 'lensModel', label: '镜头型号', description: '使用的镜头型号' },
  { value: 'exposureTime', label: '快门速度', description: '曝光时间，如 1/100s' },
  { value: 'fNumber', label: '光圈值', description: '光圈大小，如 f/2.8' },
  { value: 'iso', label: 'ISO感光度', description: 'ISO设置值' },
  { value: 'focalLength', label: '焦距', description: '镜头焦距，如 35mm' },
  { value: 'make', label: '相机品牌', description: '相机制造商' },
  { value: 'dateTime', label: '拍摄时间', description: '照片拍摄日期和时间' },
];

/**
 * Get default EXIF fields
 */
export function getDefaultExifFields(): string[] {
  // make: false, dateTime: false, lensModel: true
  return ['model', 'lensModel', 'exposureTime', 'fNumber', 'iso', 'focalLength'];
}
