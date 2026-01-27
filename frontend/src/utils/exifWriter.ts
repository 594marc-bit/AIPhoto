/**
 * EXIF Writer Utility
 * Handles writing EXIF data back to JPEG images after processing
 */

import * as piexif from 'piexifjs';

export interface ExifWriteOptions {
  /**
   * Whether to preserve all original EXIF data
   * @default true
   */
  preserveOriginal?: boolean;

  /**
   * Custom EXIF data to merge with original
   */
  customExif?: Record<string, unknown>;

  /**
   * Whether to preserve HDR metadata
   * @default true
   */
  preserveHDR?: boolean;
}

/**
 * Convert Blob to Base64 (async)
 */
async function blobToBase64(blob: Blob): Promise<string> {
  console.log('[exifWriter] blobToBase64 - Starting conversion, blob type:', blob.type, 'blob size:', blob.size);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      console.log('[exifWriter] blobToBase64 - Conversion complete, result length:', result?.length);
      resolve(result);
    };
    reader.onerror = (error) => {
      console.error('[exifWriter] blobToBase64 - FileReader error:', error);
      reject(new Error('Failed to read blob as base64'));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return window.btoa(binary);
}

/**
 * Convert Base64 to Blob
 */
function base64ToBlob(base64: string, type: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.split(',')[1] || base64;

  const byteString = window.atob(base64Data);
  const bytes = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }

  return new Blob([bytes], { type });
}

/**
 * Extract EXIF data from a JPEG file
 */
export async function extractExifFromJPEG(file: File): Promise<string> {
  console.log('[exifWriter] extractExifFromJPEG - Starting extraction, file:', file.name, 'type:', file.type, 'size:', file.size);
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) {
          console.log('[exifWriter] extractExifFromJPEG - No result from FileReader');
          resolve('');
          return;
        }

        // Get base64 string with data URL prefix
        const rawBase64 = arrayBufferToBase64(result as ArrayBuffer);
        // piexif.load() needs the data URL prefix
        const dataUrl = `data:${file.type};base64,${rawBase64}`;
        console.log('[exifWriter] extractExifFromJPEG - Data URL length:', dataUrl.length);

        const exifObj = piexif.load(dataUrl);
        console.log('[exifWriter] extractExifFromJPEG - EXIF object loaded:', exifObj);

        const exifStr = piexif.dump(exifObj);
        console.log('[exifWriter] extractExifFromJPEG - EXIF string length:', exifStr.length);

        resolve(exifStr);
      } catch (error) {
        console.error('[exifWriter] extractExifFromJPEG - Failed to extract EXIF:', error);
        resolve('');
      }
    };

    reader.onerror = (error) => {
      console.error('[exifWriter] extractExifFromJPEG - File reader error:', error);
      resolve('');
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Insert EXIF data into a JPEG image (from blob)
 */
export async function insertExifToBlob(
  blob: Blob,
  exifStr: string,
): Promise<Blob> {
  console.log('[exifWriter] insertExifToBlob - Starting, exifStr length:', exifStr.length);
  try {
    // Convert blob to base64
    const base64Image = await blobToBase64(blob);
    console.log('[exifWriter] insertExifToBlob - Got base64 image, length:', base64Image.length);

    // Insert EXIF data
    const resultBase64 = piexif.insert(exifStr, base64Image);
    console.log('[exifWriter] insertExifToBlob - Inserted EXIF, result length:', resultBase64.length);

    // Convert back to blob
    const resultBlob = base64ToBlob(resultBase64, blob.type);
    console.log('[exifWriter] insertExifToBlob - Created blob, size:', resultBlob.size);
    return resultBlob;
  } catch (error) {
    console.error('[exifWriter] insertExifToBlob - Failed to insert EXIF:', error);
    return blob;
  }
}

/**
 * Process an image blob and add EXIF data back to it
 */
export async function addExifToBlob(
  blob: Blob,
  originalFile: File,
  options: ExifWriteOptions = {},
): Promise<Blob> {
  console.log('[exifWriter] addExifToBlob - Starting, options:', options);
  const {
    preserveOriginal = true,
    customExif = {},
  } = options;

  try {
    // Extract EXIF from original file
    let exifStr = '';

    if (preserveOriginal) {
      console.log('[exifWriter] addExifToBlob - Extracting EXIF from original file...');
      exifStr = await extractExifFromJPEG(originalFile);
      console.log('[exifWriter] addExifToBlob - EXIF extraction result, length:', exifStr.length);
    }

    // If we have EXIF data to insert
    if (exifStr || Object.keys(customExif).length > 0) {
      console.log('[exifWriter] addExifToBlob - Have EXIF data to insert');

      // Load existing EXIF or create new object
      let exifObj: ReturnType<typeof piexif.load> = {};

      if (exifStr) {
        try {
          // Load the EXIF string directly - piexif.load can accept both data URLs and EXIF strings
          exifObj = piexif.load(exifStr);
          console.log('[exifWriter] addExifToBlob - Loaded EXIF object:', JSON.stringify(exifObj, null, 2));

          // Log all EXIF sections for debugging
          if (exifObj['0th']) console.log('[exifWriter] addExifToBlob - 0th IFD:', exifObj['0th']);
          if (exifObj['Exif']) console.log('[exifWriter] addExifToBlob - Exif IFD:', exifObj['Exif']);
          if (exifObj['GPS']) console.log('[exifWriter] addExifToBlob - GPS IFD:', exifObj['GPS']);
          if (exifObj['1st']) console.log('[exifWriter] addExifToBlob - 1st IFD:', exifObj['1st']);
          if (exifObj['Interop']) console.log('[exifWriter] addExifToBlob - Interop IFD:', exifObj['Interop']);
        } catch (e) {
          console.warn('[exifWriter] addExifToBlob - Failed to parse existing EXIF, creating new:', e);
        }
      }

      // Merge custom EXIF data
      if (Object.keys(customExif).length > 0) {
        console.log('[exifWriter] addExifToBlob - Merging custom EXIF:', customExif);
        exifObj = {
          ...exifObj,
          ...customExif,
        };
      }

      // Convert blob to base64
      console.log('[exifWriter] addExifToBlob - Converting processed blob to base64...');
      const base64Image = await blobToBase64(blob);
      console.log('[exifWriter] addExifToBlob - Processed image base64 length:', base64Image.length);

      // Dump EXIF object to string
      const finalExifStr = piexif.dump(exifObj);
      console.log('[exifWriter] addExifToBlob - Final EXIF string length:', finalExifStr.length);

      // Insert EXIF into image
      console.log('[exifWriter] addExifToBlob - Inserting EXIF into image...');
      const resultBase64 = piexif.insert(finalExifStr, base64Image);
      console.log('[exifWriter] addExifToBlob - Insert complete, result length:', resultBase64.length);

      // Convert back to blob
      const resultBlob = base64ToBlob(resultBase64, blob.type);
      console.log('[exifWriter] addExifToBlob - Final blob size:', resultBlob.size);
      return resultBlob;
    }

    // No EXIF to add, return original blob
    console.log('[exifWriter] addExifToBlob - No EXIF data to insert, returning original blob');
    return blob;
  } catch (error) {
    console.error('[exifWriter] addExifToBlob - Failed to add EXIF to blob:', error);
    return blob;
  }
}

/**
 * Check if an image has HDR metadata
 */
export function hasHDRMetadata(file: File): Promise<boolean> {
  console.log('[exifWriter] hasHDRMetadata - Checking for HDR metadata');
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) {
          console.log('[exifWriter] hasHDRMetadata - No result from FileReader');
          resolve(false);
          return;
        }

        const rawBase64 = arrayBufferToBase64(result as ArrayBuffer);
        const dataUrl = `data:${file.type};base64,${rawBase64}`;
        console.log('[exifWriter] hasHDRMetadata - Data URL length:', dataUrl.length);

        const exifObj = piexif.load(dataUrl);
        console.log('[exifWriter] hasHDRMetadata - EXIF object:', exifObj);

        // Check for HDR-related tags
        // Some cameras use specific tags to indicate HDR
        // This includes:
        // - ExposureMode (tag 0xA402) - some cameras set this to HDR mode
        // - Contrast (tag 0xA408) - HDR images often have specific contrast settings
        // - CustomRendered (tag 0xA401) - some cameras mark HDR processing

        const ifd0 = exifObj['0th'] || {};
        const exif = exifObj['Exif'] || {};

        console.log('[exifWriter] hasHDRMetadata - IFD0:', ifd0);
        console.log('[exifWriter] hasHDRMetadata - Exif:', exif);

        // Check for HDR indicators
        const softwareValue = (ifd0 as Record<number, unknown>)[0x0131];
        const imageDescValue = (ifd0 as Record<number, unknown>)[0x010E];
        const hasHDRIndicators =
          // Check for High Dynamic Range in Software or ImageDescription
          (typeof softwareValue === 'string' && softwareValue.toLowerCase().includes('hdr')) ||
          (typeof imageDescValue === 'string' && imageDescValue.toLowerCase().includes('hdr')) ||
          // Some cameras use ExposureMode to indicate HDR
          ((exif as Record<number, unknown>)[0xA402] === 6) || // ExposureMode = HDR mode
          // Check for multiple exposures (often used in HDR)
          checkForMultipleExposures(exifObj);

        console.log('[exifWriter] hasHDRMetadata - Has HDR indicators:', hasHDRIndicators);
        resolve(hasHDRIndicators);
      } catch (error) {
        console.error('[exifWriter] hasHDRMetadata - Failed to check HDR metadata:', error);
        resolve(false);
      }
    };

    reader.onerror = (error) => {
      console.error('[exifWriter] hasHDRMetadata - File reader error:', error);
      resolve(false);
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Check if EXIF data indicates multiple exposures (HDR)
 */
function checkForMultipleExposures(exifObj: ReturnType<typeof piexif.load>): boolean {
  // Check for bracket settings or exposure bias that might indicate HDR
  const exif = exifObj['Exif'] || {};

  // Exposure bias that suggests HDR bracketing
  const exposureBias = (exif as Record<number, unknown>)[0xA404]; // ExposureBiasValue

  if (exposureBias) {
    try {
      const bias = Number(exposureBias);
      // Multiple exposure bracketing often has bias values like -2, 0, +2 EV
      if (Math.abs(bias) >= 1.0) {
        return true;
      }
    } catch {
      // Ignore
    }
  }

  return false;
}

/**
 * Analyze a JPEG segment to check for XMP and MPF data
 */
function analyzeSegmentForXMP(segment: Uint8Array): { hasXMP: boolean; hasHDR: boolean; hasMPF: boolean; hasGContainer: boolean; contentPreview: string } {
  // Convert to string for analysis
  const decoder = new TextDecoder('latin1');
  const content = decoder.decode(segment.slice(4)); // Skip marker bytes

  let hasXMP = false;
  let hasHDR = false;
  let hasMPF = false;
  let hasGContainer = false;
  const contentPreview = content.substring(0, 200).replace(/[^\x20-\x7E]/g, '.');

  // Check for XMP identifiers
  if (content.includes('http://ns.adobe.com/xap/1.0/') ||
      content.includes('http://ns.adobe.com/xmp/1.0/') ||
      content.includes('<?xpacket')) {
    hasXMP = true;
  }

  // Check for HDR-related identifiers (Adobe/Google Ultra HDR)
  if (content.includes('hdrgm') ||         // Adobe HDR Gain Map namespace
      content.includes('GainMap') ||
      content.includes('http://ns.adobe.com/hdr-gain-map/1.0/')) {
    hasHDR = true;
  }

  // Check for GContainer (Google Container for multi-image storage)
  if (content.includes('http://ns.google.com/photos/1.0/container/') ||
      content.includes('Container:Directory')) {
    hasGContainer = true;
  }

  // Check for MPF (Multi-Picture Format)
  if (content.includes('MPF') || content.includes('Multi-Picture')) {
    hasMPF = true;
  }

  return { hasXMP, hasHDR, hasMPF, hasGContainer, contentPreview };
}

/**
 * Preserve special metadata like HDR when processing images
 * This function copies ALL metadata blocks from the original file (EXIF, XMP, IPTC, etc.)
 */
export async function preserveSpecialMetadata(
  processedBlob: Blob,
  originalFile: File,
): Promise<Blob> {
  console.log('[exifWriter] preserveSpecialMetadata - Starting');
  console.log('[exifWriter] preserveSpecialMetadata - Processed blob size:', processedBlob.size, 'type:', processedBlob.type);
  console.log('[exifWriter] preserveSpecialMetadata - Original file:', originalFile.name, 'type:', originalFile.type, 'size:', originalFile.size);

  try {
    // Read the original file as ArrayBuffer
    const originalArrayBuffer = await readFileAsArrayBuffer(originalFile);
    console.log('[exifWriter] preserveSpecialMetadata - Original file buffer size:', originalArrayBuffer.byteLength);

    // Read the processed blob as ArrayBuffer
    const processedArrayBuffer = await readBlobAsArrayBuffer(processedBlob);
    console.log('[exifWriter] preserveSpecialMetadata - Processed blob buffer size:', processedArrayBuffer.byteLength);

    // Extract all metadata segments from the original file
    const originalSegments = extractMetadataSegments(new Uint8Array(originalArrayBuffer));
    console.log('[exifWriter] preserveSpecialMetadata - Found metadata segments in original:', originalSegments);

    // Analyze each segment for XMP, HDR, and MPF content
    let hdrSegmentsFound = 0;
    let gContainerSegmentsFound = 0;
    for (let i = 0; i < originalSegments.length; i++) {
      const segment = originalSegments[i];
      if (!segment) continue;
      const analysis = analyzeSegmentForXMP(segment);
      if (analysis.hasHDR) {
        hdrSegmentsFound++;
        console.log(`[exifWriter] preserveSpecialMetadata - Segment ${i} contains HDR data:`, {
          hasXMP: analysis.hasXMP,
          hasHDR: analysis.hasHDR,
          hasGContainer: analysis.hasGContainer,
          hasMPF: analysis.hasMPF,
          preview: analysis.contentPreview
        });
      }
      if (analysis.hasGContainer) {
        gContainerSegmentsFound++;
        console.log(`[exifWriter] preserveSpecialMetadata - Segment ${i} contains GContainer data:`, {
          hasXMP: analysis.hasXMP,
          hasHDR: analysis.hasHDR,
          hasGContainer: analysis.hasGContainer,
          hasMPF: analysis.hasMPF,
          preview: analysis.contentPreview
        });
      } else if (analysis.hasXMP) {
        console.log(`[exifWriter] preserveSpecialMetadata - Segment ${i} contains XMP data (no HDR/GContainer):`, {
          hasXMP: analysis.hasXMP,
          hasHDR: analysis.hasHDR,
          hasGContainer: analysis.hasGContainer,
          hasMPF: analysis.hasMPF,
          preview: analysis.contentPreview
        });
      }
    }
    console.log('[exifWriter] preserveSpecialMetadata - Total HDR segments found:', hdrSegmentsFound);
    console.log('[exifWriter] preserveSpecialMetadata - Total GContainer segments found:', gContainerSegmentsFound);

    // Check if this is an Adobe/Google Ultra HDR image with Gain Map
    if (gContainerSegmentsFound > 0) {
      console.warn('[exifWriter] preserveSpecialMetadata - WARNING: This appears to be an Ultra HDR image with GContainer metadata.');
      console.warn('[exifWriter] preserveSpecialMetadata - The Gain Map auxiliary image (stored in MPF format) will be LOST after Canvas processing.');
      console.warn('[exifWriter] preserveSpecialMetadata - Canvas cannot preserve the MPF auxiliary image - it only processes the primary SDR image.');
      console.warn('[exifWriter] preserveSpecialMetadata - To preserve HDR, a native implementation (macOS/iOS ImageIO or Python with proper MPF support) is required.');
    }

    // Extract SOF, DQT, and DHT segments from processed image to get correct dimensions and tables
    const processedSofSegment = extractSOFSegment(new Uint8Array(processedArrayBuffer));
    console.log('[exifWriter] preserveSpecialMetadata - Extracted SOF from processed image, size:', processedSofSegment?.length);

    const processedDqtSegments = extractDQTSegments(new Uint8Array(processedArrayBuffer));
    console.log('[exifWriter] preserveSpecialMetadata - Extracted', processedDqtSegments.length, 'DQT segments from processed image');

    const processedDhtSegments = extractDHTSegments(new Uint8Array(processedArrayBuffer));
    console.log('[exifWriter] preserveSpecialMetadata - Extracted', processedDhtSegments.length, 'DHT segments from processed image');

    // Extract scan data from processed image (the actual image data)
    const processedScanData = extractScanData(new Uint8Array(processedArrayBuffer));
    console.log('[exifWriter] preserveSpecialMetadata - Extracted scan data size:', processedScanData.length);

    // Build new JPEG with original metadata (except SOF) and processed scan data
    const resultBuffer = buildJPEGWithMetadata(originalSegments, processedScanData, processedSofSegment, processedDqtSegments, processedDhtSegments);
    console.log('[exifWriter] preserveSpecialMetadata - Built new JPEG, size:', resultBuffer.byteLength);

    const resultBlob = new Blob([resultBuffer], { type: 'image/jpeg' });
    console.log('[exifWriter] preserveSpecialMetadata - Complete, result blob size:', resultBlob.size);

    // Verify the result contains HDR metadata
    const resultArrayBuffer = await readBlobAsArrayBuffer(resultBlob);
    const resultSegments = extractMetadataSegments(new Uint8Array(resultArrayBuffer));
    let resultHdrSegments = 0;
    for (const segment of resultSegments) {
      const analysis = analyzeSegmentForXMP(segment);
      if (analysis.hasHDR) {
        resultHdrSegments++;
      }
    }
    console.log('[exifWriter] preserveSpecialMetadata - Result HDR segments:', resultHdrSegments, '(expected:', hdrSegmentsFound, ')');

    if (resultHdrSegments < hdrSegmentsFound) {
      console.warn('[exifWriter] preserveSpecialMetadata - WARNING: Some HDR metadata was lost!');
    } else {
      console.log('[exifWriter] preserveSpecialMetadata - HDR metadata preserved successfully!');
    }

    return resultBlob;
  } catch (error) {
    console.error('[exifWriter] preserveSpecialMetadata - Failed to preserve special metadata:', error);
    // Fallback to EXIF-only preservation
    console.log('[exifWriter] preserveSpecialMetadata - Falling back to EXIF-only preservation');
    return addExifToBlob(processedBlob, originalFile, {
      preserveOriginal: true,
      preserveHDR: true,
    });
  }
}

/**
 * Read a File as ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read a Blob as ArrayBuffer
 */
function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Extract all metadata segments from a JPEG file (excluding SOF)
 * Returns an array of segments including APP0-APP15, COM, etc.
 * Note: SOF segments are excluded because we need to use the processed image's SOF
 */
function extractMetadataSegments(data: Uint8Array): Uint8Array[] {
  const segments: Uint8Array[] = [];

  // JPEG files start with SOI marker (0xFFD8)
  if (data[0] !== 0xFF || data[1] !== 0xD8) {
    console.warn('[exifWriter] extractMetadataSegments - Not a valid JPEG file');
    return segments;
  }

  let pos = 2; // Skip SOI

  while (pos < data.length - 1) {
    // Look for marker (0xFF)
    if (data[pos] === 0xFF) {
      const marker = data[pos + 1];
      if (marker === undefined) break;

      // Stop at SOS (Start of Scan, 0xDA) - image data follows
      if (marker === 0xDA) {
        console.log('[exifWriter] extractMetadataSegments - Found SOS marker at position', pos, 'stopping metadata extraction');
        break;
      }

      // Stop at EOI (End of Image, 0xD9)
      if (marker === 0xD9) {
        console.log('[exifWriter] extractMetadataSegments - Found EOI marker at position', pos);
        break;
      }

      // Check if it's a metadata segment (APP0-APP15, COM)
      // APP markers are 0xE0-0xEF, COM is 0xFE
      if ((marker >= 0xE0 && marker <= 0xEF) || marker === 0xFE) {
        // Get segment length (includes length bytes but not marker)
        const lengthHigh = data[pos + 2];
        const lengthLow = data[pos + 3];
        if (lengthHigh === undefined || lengthLow === undefined) break;
        const segmentLength = (lengthHigh << 8) | lengthLow;

        console.log(`[exifWriter] extractMetadataSegments - Found ${getMarkerName(marker)} segment at position ${pos}, length: ${segmentLength}`);

        // Extract the entire segment (marker + length + data)
        const segmentStart = pos;
        const segmentEnd = pos + 2 + segmentLength;
        const segment = data.slice(segmentStart, segmentEnd);
        segments.push(segment);

        pos = segmentEnd;
      } else if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        // SOF markers (Start of Frame) - skip these, we'll use the processed image's SOF
        const lengthHigh = data[pos + 2];
        const lengthLow = data[pos + 3];
        if (lengthHigh === undefined || lengthLow === undefined) break;
        const segmentLength = (lengthHigh << 8) | lengthLow;

        console.log(`[exifWriter] extractMetadataSegments - Skipping SOF marker 0x${marker.toString(16)} at position ${pos}, length: ${segmentLength}`);
        pos += 2 + segmentLength;
      } else {
        // Skip other segments
        const lengthHigh = data[pos + 2];
        const lengthLow = data[pos + 3];
        if (lengthHigh === undefined || lengthLow === undefined) break;
        const segmentLength = (lengthHigh << 8) | lengthLow;
        pos += 2 + segmentLength;
      }
    } else {
      // Invalid data, increment position
      pos++;
    }
  }

  console.log('[exifWriter] extractMetadataSegments - Total segments extracted:', segments.length);
  return segments;
}

/**
 * Extract SOF (Start of Frame) segment from a JPEG file
 * This contains the image dimensions and must match the scan data
 */
function extractSOFSegment(data: Uint8Array): Uint8Array | null {
  // JPEG files start with SOI marker (0xFFD8)
  if (data[0] !== 0xFF || data[1] !== 0xD8) {
    console.warn('[exifWriter] extractSOFSegment - Not a valid JPEG file');
    return null;
  }

  let pos = 2; // Skip SOI

  while (pos < data.length - 1) {
    // Look for marker (0xFF)
    if (data[pos] === 0xFF) {
      const marker = data[pos + 1];
      if (marker === undefined) break;

      // Stop at SOS (Start of Scan, 0xDA)
      if (marker === 0xDA) {
        console.log('[exifWriter] extractSOFSegment - Found SOS marker, no SOF found');
        return null;
      }

      // Look for SOF markers (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF)
      // Exclude: 0xC4 (DHT), 0xC8 (JPG), 0xCC (DAC)
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        const lengthHigh = data[pos + 2];
        const lengthLow = data[pos + 3];
        if (lengthHigh === undefined || lengthLow === undefined) break;
        const segmentLength = (lengthHigh << 8) | lengthLow;

        console.log(`[exifWriter] extractSOFSegment - Found SOF marker 0x${marker.toString(16)} at position ${pos}, length: ${segmentLength}`);

        // Extract the SOF segment
        const segmentStart = pos;
        const segmentEnd = pos + 2 + segmentLength;
        return data.slice(segmentStart, segmentEnd);
      }

      // Skip to next segment
      if (marker >= 0xD0 && marker <= 0xD7) {
        // RST markers don't have length
        pos += 2;
      } else if (marker === 0xDA || marker === 0xD9) {
        // SOS or EOI - stop
        break;
      } else {
        // Other markers have length
        const lengthHigh = data[pos + 2];
        const lengthLow = data[pos + 3];
        if (lengthHigh === undefined || lengthLow === undefined) break;
        const segmentLength = (lengthHigh << 8) | lengthLow;
        pos += 2 + segmentLength;
      }
    } else {
      pos++;
    }
  }

  console.warn('[exifWriter] extractSOFSegment - SOF segment not found');
  return null;
}

/**
 * Extract DQT (Define Quantization Table) segments from a JPEG file
 * These are required for decoding the image data
 */
function extractDQTSegments(data: Uint8Array): Uint8Array[] {
  const segments: Uint8Array[] = [];

  // JPEG files start with SOI marker (0xFFD8)
  if (data[0] !== 0xFF || data[1] !== 0xD8) {
    console.warn('[exifWriter] extractDQTSegments - Not a valid JPEG file');
    return segments;
  }

  let pos = 2; // Skip SOI

  while (pos < data.length - 1) {
    // Look for marker (0xFF)
    if (data[pos] === 0xFF) {
      const marker = data[pos + 1];
      if (marker === undefined) break;

      // Stop at SOS (Start of Scan, 0xDA)
      if (marker === 0xDA) {
        console.log('[exifWriter] extractDQTSegments - Found SOS marker, stopping DQT extraction');
        break;
      }

      // Look for DQT marker (0xDB)
      if (marker === 0xDB) {
        const lengthHigh = data[pos + 2];
        const lengthLow = data[pos + 3];
        if (lengthHigh === undefined || lengthLow === undefined) break;
        const segmentLength = (lengthHigh << 8) | lengthLow;

        console.log(`[exifWriter] extractDQTSegments - Found DQT marker at position ${pos}, length: ${segmentLength}`);

        // Extract the DQT segment
        const segmentStart = pos;
        const segmentEnd = pos + 2 + segmentLength;
        segments.push(data.slice(segmentStart, segmentEnd));
        pos = segmentEnd;
      } else if (marker >= 0xD0 && marker <= 0xD7) {
        // RST markers don't have length
        pos += 2;
      } else if (marker === 0xDA || marker === 0xD9) {
        // SOS or EOI - stop
        break;
      } else {
        // Other markers have length
        const lengthHigh = data[pos + 2];
        const lengthLow = data[pos + 3];
        if (lengthHigh === undefined || lengthLow === undefined) break;
        const segmentLength = (lengthHigh << 8) | lengthLow;
        pos += 2 + segmentLength;
      }
    } else {
      pos++;
    }
  }

  console.log('[exifWriter] extractDQTSegments - Total DQT segments extracted:', segments.length);
  return segments;
}

/**
 * Extract DHT (Define Huffman Table) segments from a JPEG file
 * These are required for decoding the image data
 */
function extractDHTSegments(data: Uint8Array): Uint8Array[] {
  const segments: Uint8Array[] = [];

  // JPEG files start with SOI marker (0xFFD8)
  if (data[0] !== 0xFF || data[1] !== 0xD8) {
    console.warn('[exifWriter] extractDHTSegments - Not a valid JPEG file');
    return segments;
  }

  let pos = 2; // Skip SOI

  while (pos < data.length - 1) {
    // Look for marker (0xFF)
    if (data[pos] === 0xFF) {
      const marker = data[pos + 1];
      if (marker === undefined) break;

      // Stop at SOS (Start of Scan, 0xDA)
      if (marker === 0xDA) {
        console.log('[exifWriter] extractDHTSegments - Found SOS marker, stopping DHT extraction');
        break;
      }

      // Look for DHT marker (0xC4)
      if (marker === 0xC4) {
        const lengthHigh = data[pos + 2];
        const lengthLow = data[pos + 3];
        if (lengthHigh === undefined || lengthLow === undefined) break;
        const segmentLength = (lengthHigh << 8) | lengthLow;

        console.log(`[exifWriter] extractDHTSegments - Found DHT marker at position ${pos}, length: ${segmentLength}`);

        // Extract the DHT segment
        const segmentStart = pos;
        const segmentEnd = pos + 2 + segmentLength;
        segments.push(data.slice(segmentStart, segmentEnd));
        pos = segmentEnd;
      } else if (marker >= 0xD0 && marker <= 0xD7) {
        // RST markers don't have length
        pos += 2;
      } else if (marker === 0xDA || marker === 0xD9) {
        // SOS or EOI - stop
        break;
      } else {
        // Other markers have length
        const lengthHigh = data[pos + 2];
        const lengthLow = data[pos + 3];
        if (lengthHigh === undefined || lengthLow === undefined) break;
        const segmentLength = (lengthHigh << 8) | lengthLow;
        pos += 2 + segmentLength;
      }
    } else {
      pos++;
    }
  }

  console.log('[exifWriter] extractDHTSegments - Total DHT segments extracted:', segments.length);
  return segments;
}

/**
 * Get marker name for logging
 */
function getMarkerName(marker: number): string {
  if (marker === 0xFE) return 'COM';
  if (marker >= 0xE0 && marker <= 0xEF) {
    const appNum = marker - 0xE0;
    // APP1 is typically EXIF, APP13 is IPTC/Photoshop
    const appNames = ['APP0', 'APP1 (EXIF)', 'APP2', 'APP3', 'APP4', 'APP5', 'APP6',
                      'APP7', 'APP8', 'APP9', 'APP10', 'APP11', 'APP12', 'APP13 (IPTC/PS)', 'APP14', 'APP15'];
    return appNames[appNum] || `APP${appNum}`;
  }
  return `0x${marker.toString(16).toUpperCase()}`;
}

/**
 * Extract scan data (actual image data) from a JPEG
 * This extracts everything from SOS marker to EOI marker
 */
function extractScanData(data: Uint8Array): Uint8Array {
  // Find SOS marker (0xFFDA)
  let sosPos = -1;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i] === 0xFF && data[i + 1] === 0xDA) {
      sosPos = i;
      break;
    }
  }

  if (sosPos === -1) {
    console.warn('[exifWriter] extractScanData - SOS marker not found');
    return new Uint8Array(0);
  }

  // Find EOI marker (0xFFD9)
  let eoiPos = -1;
  for (let i = data.length - 1; i >= sosPos + 1; i--) {
    if (data[i] === 0xFF && data[i + 1] === 0xD9) {
      eoiPos = i;
      break;
    }
  }

  if (eoiPos === -1) {
    console.warn('[exifWriter] extractScanData - EOI marker not found');
    return new Uint8Array(0);
  }

  // Return data from SOS to EOI (inclusive)
  const scanData = data.slice(sosPos, eoiPos + 2);
  console.log('[exifWriter] extractScanData - Extracted scan data from SOS position', sosPos, 'to EOI position', eoiPos);
  return scanData;
}

/**
 * Build a new JPEG with metadata segments and scan data
 * @param metadataSegments - Metadata segments from original file (APP, COM, etc.)
 * @param scanData - Scan data (image data) from processed file
 * @param sofSegment - SOF segment from processed file (must match scan data dimensions)
 * @param dqtSegments - DQT (Quantization table) segments from processed file (required for decoding)
 * @param dhtSegments - DHT (Huffman table) segments from processed file (required for decoding)
 */
function buildJPEGWithMetadata(
  metadataSegments: Uint8Array[],
  scanData: Uint8Array,
  sofSegment: Uint8Array | null,
  dqtSegments: Uint8Array[],
  dhtSegments: Uint8Array[]
): ArrayBuffer {
  // Calculate total size
  let totalSize = 2; // SOI marker (0xFFD8)

  // Add metadata segments
  for (const segment of metadataSegments) {
    totalSize += segment.length;
  }

  // Add DQT segments
  for (const segment of dqtSegments) {
    totalSize += segment.length;
  }

  // Add SOF segment if available
  if (sofSegment) {
    totalSize += sofSegment.length;
  }

  // Add DHT segments
  for (const segment of dhtSegments) {
    totalSize += segment.length;
  }

  // Add scan data
  totalSize += scanData.length;

  // Create buffer
  const buffer = new Uint8Array(totalSize);
  let offset = 0;

  // Write SOI
  buffer[offset++] = 0xFF;
  buffer[offset++] = 0xD8;

  // Standard JPEG structure order: SOI -> APP -> DQT -> SOF -> DHT -> SOS + scan data -> EOI
  // Write metadata segments (APP, COM, etc.) first
  for (const segment of metadataSegments) {
    buffer.set(segment, offset);
    offset += segment.length;
  }

  // Write DQT segments (must come after APP, before SOF)
  for (const segment of dqtSegments) {
    buffer.set(segment, offset);
    offset += segment.length;
  }

  // Write SOF segment (must come after DQT)
  if (sofSegment) {
    buffer.set(sofSegment, offset);
    offset += sofSegment.length;
  }

  // Write DHT segments (must come after SOF, before SOS)
  for (const segment of dhtSegments) {
    buffer.set(segment, offset);
    offset += segment.length;
  }

  // Write scan data (includes SOS marker at the beginning and EOI marker at the end)
  buffer.set(scanData, offset);

  return buffer.buffer;
}
