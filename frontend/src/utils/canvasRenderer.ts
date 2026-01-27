import type { ImageFile, ProcessOptions, BorderStyle, ExifData, LogoConfig } from '@/types/image';
import { preserveSpecialMetadata } from './exifWriter';

export interface RenderResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export interface RenderOptions extends ProcessOptions {
  imageFile: ImageFile;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;
  }

  /**
   * Load an image from a File object
   */
  async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Load an image from a URL
   */
  async loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image from URL'));
      };

      img.src = url;
    });
  }

  /**
   * Calculate output dimensions based on options
   */
  calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    options: RenderOptions,
  ): { width: number; height: number; imageWidth: number; imageHeight: number } {
    const { borderStyle, outputWidth, outputHeight, maintainAspectRatio } = options;

    // Calculate border dimensions from percentage or pixel values
    // Use individual border widths if specified, otherwise fall back to sideWidth
    const leftPadding = borderStyle.leftWidthPercent !== undefined && borderStyle.leftWidthPercent > 0
      ? (originalWidth * borderStyle.leftWidthPercent) / 100
      : (borderStyle.sideWidthPercent !== undefined
          ? (originalWidth * borderStyle.sideWidthPercent) / 100
          : (borderStyle.sideWidth || 0));

    const rightPadding = borderStyle.rightWidthPercent !== undefined && borderStyle.rightWidthPercent > 0
      ? (originalWidth * borderStyle.rightWidthPercent) / 100
      : (borderStyle.sideWidthPercent !== undefined
          ? (originalWidth * borderStyle.sideWidthPercent) / 100
          : (borderStyle.sideWidth || 0));

    const topPadding = borderStyle.topWidthPercent !== undefined && borderStyle.topWidthPercent > 0
      ? (originalHeight * borderStyle.topWidthPercent) / 100
      : (borderStyle.sideWidthPercent !== undefined
          ? (originalHeight * borderStyle.sideWidthPercent) / 100
          : (borderStyle.sideWidth || 0));

    const bottomPadding =
      borderStyle.bottomHeightPercent !== undefined
        ? (originalHeight * borderStyle.bottomHeightPercent) / 100
        : (borderStyle.bottomHeight || 0);

    let imageWidth = originalWidth;
    let imageHeight = originalHeight;

    // Apply output dimensions if specified
    if (outputWidth && outputHeight) {
      if (maintainAspectRatio) {
        const aspectRatio = originalWidth / originalHeight;
        const targetAspectRatio = outputWidth / outputHeight;

        if (aspectRatio > targetAspectRatio) {
          imageWidth = outputWidth - leftPadding - rightPadding;
          imageHeight = imageWidth / aspectRatio;
        } else {
          imageHeight = outputHeight - topPadding - bottomPadding;
          imageWidth = imageHeight * aspectRatio;
        }
      } else {
        imageWidth = outputWidth - leftPadding - rightPadding;
        imageHeight = outputHeight - topPadding - bottomPadding;
      }
    } else if (outputWidth) {
      const scale = outputWidth / (originalWidth + leftPadding + rightPadding);
      imageWidth = originalWidth * scale;
      imageHeight = originalHeight * scale;
    } else if (outputHeight) {
      const scale = outputHeight / (originalHeight + topPadding + bottomPadding);
      imageWidth = originalWidth * scale;
      imageHeight = originalHeight * scale;
    }

    // Round dimensions
    imageWidth = Math.round(imageWidth);
    imageHeight = Math.round(imageHeight);

    // Calculate total canvas dimensions
    const width = imageWidth + leftPadding + rightPadding;
    const height = imageHeight + topPadding + bottomPadding;

    return { width, height, imageWidth, imageHeight };
  }

  /**
   * Get the actual border dimensions (calculated from percentage if needed)
   */
  getBorderDimensions(
    originalWidth: number,
    originalHeight: number,
    borderStyle: BorderStyle,
  ): { leftWidth: number; rightWidth: number; topWidth: number; bottomHeight: number } {
    const leftWidth = borderStyle.leftWidthPercent !== undefined && borderStyle.leftWidthPercent > 0
      ? (originalWidth * borderStyle.leftWidthPercent) / 100
      : (borderStyle.sideWidthPercent !== undefined
          ? (originalWidth * borderStyle.sideWidthPercent) / 100
          : (borderStyle.sideWidth || 0));

    const rightWidth = borderStyle.rightWidthPercent !== undefined && borderStyle.rightWidthPercent > 0
      ? (originalWidth * borderStyle.rightWidthPercent) / 100
      : (borderStyle.sideWidthPercent !== undefined
          ? (originalWidth * borderStyle.sideWidthPercent) / 100
          : (borderStyle.sideWidth || 0));

    const topWidth = borderStyle.topWidthPercent !== undefined && borderStyle.topWidthPercent > 0
      ? (originalHeight * borderStyle.topWidthPercent) / 100
      : (borderStyle.sideWidthPercent !== undefined
          ? (originalHeight * borderStyle.sideWidthPercent) / 100
          : (borderStyle.sideWidth || 0));

    const bottomHeight =
      borderStyle.bottomHeightPercent !== undefined
        ? (originalHeight * borderStyle.bottomHeightPercent) / 100
        : (borderStyle.bottomHeight || 0);

    return { leftWidth, rightWidth, topWidth, bottomHeight };
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Set canvas dimensions
   */
  setDimensions(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Fill background
   */
  fillBackground(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw image on canvas
   */
  drawImage(
    img: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    this.ctx.drawImage(img, x, y, width, height);
  }

  /**
   * Draw text on canvas
   */
  drawText(
    text: string,
    x: number,
    y: number,
    options: {
      font?: string;
      fontSize?: number;
      color?: string;
      align?: 'left' | 'center' | 'right';
      baseline?: 'top' | 'middle' | 'bottom';
    } = {},
  ): void {
    const {
      font = 'Arial',
      fontSize = 14,
      color = '#000000',
      align = 'left',
      baseline = 'top',
    } = options;

    this.ctx.font = `${fontSize}px ${font}`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;

    this.ctx.fillText(text, x, y);
  }

  /**
   * Draw multiple lines of text
   */
  drawTextLines(
    lines: string[],
    x: number,
    y: number,
    lineHeight: number,
    options: {
      font?: string;
      fontSize?: number;
      color?: string;
      align?: 'left' | 'center' | 'right';
    } = {},
  ): void {
    lines.forEach((line, index) => {
      this.drawText(line, x, y + index * lineHeight, { ...options, baseline: 'top' });
    });
  }

  /**
   * Render the complete image with border and EXIF
   */
  async render(options: RenderOptions): Promise<RenderResult> {
    const {
      imageFile,
      borderStyle,
      exifFields,
      logoConfig,
      logoConfigs,
      exifTextAlign = 'left',
      exifTextOffset = 0,
      exifTextOffsetX = 0,
      exifTextOffsetY = 0,
      exifFontFamily = 'Arial',
      exifFontSize = 1, // percentage of image width
      exifTextColor = '#333333',
    } = options;

    // Debug logging
    console.log('[CanvasRenderer.render] Starting render');
    console.log('[CanvasRenderer.render] borderStyle.showExif:', borderStyle.showExif);
    console.log('[CanvasRenderer.render] exifFields:', exifFields);
    console.log('[CanvasRenderer.render] imageFile.exif:', imageFile.exif);
    console.log('[CanvasRenderer.render] borderStyle:', borderStyle);

    // Load the image
    const img = await this.loadImage(imageFile.file);
    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;

    // Calculate font size as percentage of image width
    const calculatedFontSize = Math.round(originalWidth * (exifFontSize / 100));

    // Calculate dimensions and border sizes
    const { width, height, imageWidth, imageHeight } = this.calculateDimensions(
      originalWidth,
      originalHeight,
      options,
    );
    const { leftWidth, rightWidth, topWidth, bottomHeight } = this.getBorderDimensions(
      originalWidth,
      originalHeight,
      borderStyle,
    );

    console.log('[CanvasRenderer.render] Calculated dimensions:', { width, height, imageWidth, imageHeight, leftWidth, rightWidth, topWidth, bottomHeight });
    console.log('[CanvasRenderer.render] Font size: exifFontSize=' + exifFontSize + '%, calculated=' + calculatedFontSize + 'px');

    // Set canvas dimensions
    this.setDimensions(width, height);

    // Draw blur background if enabled
    if (borderStyle.blur) {
      this.drawBlurBackground(img, width, height, borderStyle);
    } else {
      // Fill solid background
      this.fillBackground(borderStyle.backgroundColor || '#ffffff');
    }

    // Draw the image
    const imageX = leftWidth;
    const imageY = topWidth;
    this.drawImage(img, imageX, imageY, imageWidth, imageHeight);

    // Draw shadow at the bottom edge of the image if enabled
    if (borderStyle.shadow) {
      this.drawImageShadow(imageX, imageY, imageWidth, imageHeight);
    }

    // Draw EXIF information if enabled
    if (borderStyle.showExif && exifFields.length > 0 && imageFile.exif) {
      console.log('[CanvasRenderer.render] Drawing EXIF info');
      this.drawExifInfo(
        imageFile.exif,
        exifFields,
        borderStyle,
        width,
        height,
        leftWidth,
        rightWidth,
        topWidth,
        bottomHeight,
        {
          textAlign: exifTextAlign,
          textOffset: exifTextOffset,
          textOffsetX: exifTextOffsetX,
          textOffsetY: exifTextOffsetY,
          fontFamily: exifFontFamily,
          fontSize: calculatedFontSize,
          textColor: exifTextColor,
        },
      );
    } else {
      console.log('[CanvasRenderer.render] Skipping EXIF drawing:', {
        showExif: borderStyle.showExif,
        exifFieldsLength: exifFields.length,
        hasExif: !!imageFile.exif,
      });
    }

    // Draw logo(s) if configured
    const logosToDraw = logoConfigs && logoConfigs.length > 0 ? logoConfigs : (logoConfig ? [logoConfig] : []);
    console.log('[CanvasRenderer.render] Logo config check:', {
      borderStyleShowLogo: borderStyle.showLogo,
      logoConfigs,
      logoConfig,
      logosToDraw,
      logosToDrawCount: logosToDraw.length
    });
    if (borderStyle.showLogo && logosToDraw.length > 0) {
      // Wait for all logos to be drawn before converting to blob
      const logoDrawPromises = logosToDraw.map((logo) => {
        console.log('[CanvasRenderer.render] Drawing logo:', logo);
        return this.drawLogo(logo, borderStyle, width, height, leftWidth, rightWidth, topWidth, bottomHeight, originalWidth);
      });
      await Promise.all(logoDrawPromises);
      console.log('[CanvasRenderer.render] All logos drawn');
    } else {
      console.log('[CanvasRenderer.render] Skipping logo drawing:', {
        showLogo: borderStyle.showLogo,
        logosCount: logosToDraw.length
      });
    }

    // Convert to blob
    let blob = await this.toBlob(options.quality);

    // Preserve original EXIF data and HDR metadata
    blob = await preserveSpecialMetadata(blob, imageFile.file);

    const url = URL.createObjectURL(blob);

    return {
      blob,
      url,
      width,
      height,
    };
  }

  /**
   * Draw blurred background
   */
  private drawBlurBackground(
    img: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number,
    borderStyle: BorderStyle,
  ): void {
    // Create a temporary canvas for blur effect
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw scaled image to fill the canvas
    const scale = Math.max(canvasWidth / img.naturalWidth, canvasHeight / img.naturalHeight);
    const scaledWidth = img.naturalWidth * scale;
    const scaledHeight = img.naturalHeight * scale;
    const x = (canvasWidth - scaledWidth) / 2;
    const y = (canvasHeight - scaledHeight) / 2;

    tempCtx.drawImage(img, x, y, scaledWidth, scaledHeight);

    // Apply blur effect using filter
    this.ctx.filter = 'blur(20px)';
    this.ctx.drawImage(tempCanvas, 0, 0);
    this.ctx.filter = 'none';

    // Draw semi-transparent overlay
    this.ctx.fillStyle = borderStyle.backgroundColor || '#ffffff';
    this.ctx.globalAlpha = 0.7;
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    this.ctx.globalAlpha = 1;
  }

  /**
   * Draw shadow at the bottom edge of the image with slanted effect
   */
  private drawImageShadow(
    imageX: number,
    imageY: number,
    imageWidth: number,
    imageHeight: number,
  ): void {
    const shadowHeight = Math.max(15, imageHeight * 0.04); // 4% of image height, min 15px
    const shadowY = imageY + imageHeight; // Bottom edge of the image
    const shadowOpacity = 0.35;
    const slantOffset = imageWidth * 0.05; // Shadow extends 5% to the right at bottom
    const cornerRadius = Math.min(8, shadowHeight * 0.5); // Rounded corners

    // Save context state
    this.ctx.save();

    // Create path for slanted shadow with rounded corners
    this.ctx.beginPath();
    // Start at top-left of shadow area with inset
    const leftInset = slantOffset * 0.3; // Left side also slants slightly
    this.ctx.moveTo(imageX + leftInset, shadowY);

    // Top-right corner (rounded, no extension at top)
    const topRightX = imageX + imageWidth;
    this.ctx.quadraticCurveTo(
      topRightX + cornerRadius * 0.5, shadowY,
      topRightX, shadowY + cornerRadius
    );

    // Right edge to bottom-right corner
    const bottomRightX = imageX + imageWidth + slantOffset;
    this.ctx.lineTo(bottomRightX, shadowY + shadowHeight - cornerRadius);

    // Bottom-right corner (rounded)
    this.ctx.quadraticCurveTo(
      bottomRightX + cornerRadius * 0.3, shadowY + shadowHeight,
      bottomRightX - cornerRadius, shadowY + shadowHeight
    );

    // Bottom edge to bottom-left corner
    this.ctx.lineTo(imageX + leftInset + cornerRadius, shadowY + shadowHeight);

    // Bottom-left corner (rounded)
    this.ctx.quadraticCurveTo(
      imageX + leftInset, shadowY + shadowHeight,
      imageX + leftInset, shadowY + shadowHeight - cornerRadius
    );

    // Left edge back to top
    this.ctx.closePath();

    // Create gradient for shadow effect (darker at top, fading to transparent at bottom)
    const gradient = this.ctx.createLinearGradient(0, shadowY, 0, shadowY + shadowHeight);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${shadowOpacity})`);
    gradient.addColorStop(0.7, `rgba(0, 0, 0, ${shadowOpacity * 0.3})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);

    // Apply shadow with blur for softer edges
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    this.ctx.shadowBlur = 6;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 1;

    // Fill the shadow shape
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Restore context state
    this.ctx.restore();
  }

  /**
   * Draw EXIF information on the image
   * Format:
   * Line 1: Brand Model (if make or model selected)
   * Line 2: ISO Aperture Shutter Focal (if any of these selected)
   * Line 3: DateTime (if dateTime selected)
   * Line 4: Lens Model (if lensModel selected)
   */
  private drawExifInfo(
    exif: ExifData,
    fields: string[],
    borderStyle: BorderStyle,
    canvasWidth: number,
    canvasHeight: number,
    leftWidth: number,
    rightWidth: number,
    topWidth: number,
    bottomHeight: number,
    textStyle: {
      textAlign: 'left' | 'center' | 'right';
      textOffset: number;
      textOffsetX?: number;
      textOffsetY?: number;
      fontFamily: string;
      fontSize: number;
      textColor: string;
    } = {
      textAlign: 'left',
      textOffset: 0,
      fontFamily: 'Arial',
      fontSize: 12,
      textColor: '#333333',
    },
  ): void {
    const lines: string[] = [];

    // Build line 1: Brand + Model (only if make or model is selected)
    const hasMakeOrModel = fields.includes('make') || fields.includes('model');
    if (hasMakeOrModel) {
      const make = fields.includes('make') ? exif.make : '';
      const model = fields.includes('model') ? exif.model : '';
      if (make || model) {
        lines.push(`${make || ''} ${model || ''}`.trim());
      }
    }

    // Build line 2: ISO + Aperture + Shutter + Focal (only if these fields are selected)
    const exposureParts: string[] = [];
    if (fields.includes('iso') && exif.iso) exposureParts.push(exif.iso);
    if (fields.includes('fNumber') && exif.fNumber) exposureParts.push(exif.fNumber);
    if (fields.includes('exposureTime') && exif.exposureTime) exposureParts.push(exif.exposureTime);
    if (fields.includes('focalLength') && exif.focalLength) exposureParts.push(exif.focalLength);
    if (exposureParts.length > 0) {
      lines.push(exposureParts.join(' '));
    }

    // Build line 3: DateTime (only if dateTime field is selected)
    if (fields.includes('dateTime') && exif.dateTime) {
      lines.push(exif.dateTime);
    }

    // Build line 4: Lens Model (only if lensModel is selected)
    if (fields.includes('lensModel') && exif.lensModel) {
      lines.push(exif.lensModel);
    }

    console.log('[drawExifInfo] Selected fields:', fields);
    console.log('[drawExifInfo] Final lines to draw:', lines);

    if (lines.length === 0) {
      console.log('[drawExifInfo] No lines to draw, returning early');
      return;
    }

    const fontSize = textStyle.fontSize;
    // Line height is 1/6 of font size (fontHeight * (1 + 1/6))
    const lineHeight = fontSize * (1 + 1/6);

    // Calculate text position
    const textBlockHeight = lines.length * lineHeight;

    // Calculate horizontal position based ONLY on the horizontal offset slider
    // The text alignment (textAlign) only affects how the text is drawn at this position
    const horizontalOffset = (canvasWidth * (textStyle.textOffsetX ?? 0)) / 100;

    // Text X position is always from center + offset, regardless of alignment
    // The alignment parameter only affects how text is drawn relative to this point
    const textX = (canvasWidth / 2) + horizontalOffset;

    // Calculate vertical position starting from bottom border center
    // Bottom border extends from (canvasHeight - bottomHeight) to canvasHeight
    // Center of bottom border is at (canvasHeight - bottomHeight / 2)
    const bottomBorderCenter = canvasHeight - bottomHeight / 2;
    // Offset is relative to total canvas height as percentage
    const textY = bottomBorderCenter - textBlockHeight / 2 + (canvasHeight * (textStyle.textOffsetY ?? 0)) / 100;

    console.log('[drawExifInfo] Text position:', {
      textX,
      textY,
      textAlign: textStyle.textAlign,
      textOffsetX: textStyle.textOffsetX,
      textOffsetY: textStyle.textOffsetY,
      canvasHeight,
      bottomHeight,
      textBlockHeight,
      fontSize,
      lineHeight,
      textColor: textStyle.textColor,
      backgroundColor: borderStyle.backgroundColor,
    });

    // Draw text lines with the specified alignment
    // The align parameter controls how the text is aligned relative to textX
    console.log('[drawExifInfo] Calling drawTextLines with:', lines, textX, textY, lineHeight, textStyle.textAlign);
    this.drawTextLines(lines, textX, textY, lineHeight, {
      font: textStyle.fontFamily,
      fontSize,
      color: textStyle.textColor,
      align: textStyle.textAlign,
    });
  }

  /**
   * Draw logo on the image
   */
  private async drawLogo(
    logoConfig: LogoConfig,
    borderStyle: BorderStyle,
    canvasWidth: number,
    canvasHeight: number,
    leftWidth: number,
    rightWidth: number,
    topWidth: number,
    bottomHeight: number,
    originalImageWidth: number,
  ): Promise<void> {
    try {
      console.log('[drawLogo] Starting to draw logo:', logoConfig);
      const logoImg = await this.loadImageFromUrl(logoConfig.url);
      console.log('[drawLogo] Logo image loaded:', {
        naturalWidth: logoImg.naturalWidth,
        naturalHeight: logoImg.naturalHeight
      });

      // Calculate logo size as percentage of original image width
      const logoWidth = Math.round(originalImageWidth * (logoConfig.size / 100));
      const logoHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * logoWidth;

      // Calculate horizontal position starting from center, with offset percentage
      const centerX = canvasWidth / 2 - logoWidth / 2;
      const x = centerX + (canvasWidth * (logoConfig.offsetX ?? 0)) / 100;

      // Calculate vertical position starting from bottom border center
      // Bottom border extends from (canvasHeight - bottomHeight) to canvasHeight
      // Center of bottom border is at (canvasHeight - bottomHeight / 2)
      const bottomBorderCenter = canvasHeight - bottomHeight / 2;
      const y: number = logoConfig.position === 'top'
        ? topWidth + (canvasHeight * (logoConfig.offsetY ?? 0)) / 100
        : bottomBorderCenter - logoHeight / 2 + (canvasHeight * (logoConfig.offsetY ?? 0)) / 100;

      console.log('[drawLogo] Drawing logo at:', {
        logoWidth,
        logoHeight,
        x,
        y,
        centerX,
        bottomBorderCenter,
        opacity: logoConfig.opacity
      });

      this.ctx.globalAlpha = logoConfig.opacity;
      this.drawImage(logoImg, x, y, logoWidth, logoHeight);
      this.ctx.globalAlpha = 1;
      console.log('[drawLogo] Logo drawn successfully');
    } catch (error) {
      console.error('[drawLogo] Failed to draw logo:', error);
    }
  }

  /**
   * Convert canvas to blob
   * @param quality JPEG quality in percentage (0-100), will be converted to 0.0-1.0 for Canvas API
   */
  async toBlob(quality: number = 95): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/jpeg',
        quality / 100, // Convert percentage (0-100) to decimal (0.0-1.0)
      );
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Canvas will be garbage collected
  }
}
