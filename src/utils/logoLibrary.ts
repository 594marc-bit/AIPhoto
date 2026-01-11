import type { LogoConfig, ExifData } from '@/types/image';

// Import logo assets
import canonLogo from '@/assets/logos/canon.svg';
import nikonLogo from '@/assets/logos/nikon.svg';
import sonyLogo from '@/assets/logos/sony.png';
import fujiLogo from '@/assets/logos/fujifilm.svg';
import leicaLogo from '@/assets/logos/Leica.png';
import cameraIconLogo from '@/assets/logos/camera-icon.svg';
import lensIconLogo from '@/assets/logos/lens-icon.svg';

export const PRESET_LOGOS: LogoConfig[] = [
  {
    id: 'canon-1',
    name: 'Canon (White)',
    url: canonLogo,
    position: 'bottom',
    align: 'right',
    size: 10, // 10% of image width
    opacity: 1,
  },
  {
    id: 'nikon-1',
    name: 'Nikon (White)',
    url: nikonLogo,
    position: 'bottom',
    align: 'right',
    size: 10, // 10% of image width
    opacity: 1,
  },
  {
    id: 'sony-1',
    name: 'Sony (White)',
    url: sonyLogo,
    position: 'bottom',
    align: 'right',
    size: 10, // 10% of image width
    opacity: 1,
  },
  {
    id: 'fuji-1',
    name: 'Fujifilm (White)',
    url: fujiLogo,
    position: 'bottom',
    align: 'right',
    size: 10, // 10% of image width
    opacity: 1,
  },
  {
    id: 'leica-1',
    name: 'Leica (Red)',
    url: leicaLogo,
    position: 'bottom',
    align: 'right',
    size: 10, // 10% of image width
    opacity: 1,
  },
  {
    id: 'simple-1',
    name: '简单相机图标',
    url: cameraIconLogo,
    position: 'bottom',
    align: 'right',
    size: 7, // 7% of image width
    opacity: 0.8,
  },
  {
    id: 'simple-2',
    name: '镜头图标',
    url: lensIconLogo,
    position: 'bottom',
    align: 'right',
    size: 7, // 7% of image width
    opacity: 0.8,
  },
];

/**
 * Get logo by ID
 */
export function getLogoById(id: string): LogoConfig | undefined {
  return PRESET_LOGOS.find((logo) => logo.id === id);
}

/**
 * Create a custom logo config from a file
 */
export async function createLogoFromFile(
  file: File,
  options: Partial<LogoConfig> = {},
): Promise<LogoConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve({
          id: `custom_${Date.now()}`,
          name: file.name,
          url: result,
          position: 'bottom',
          align: 'right',
          size: 10, // 10% of image width
          opacity: 1,
          ...options,
        });
      } else {
        reject(new Error('Failed to read logo file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read logo file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert SVG to data URL
 */
export function svgToDataUrl(svg: string): string {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

/**
 * Generate a simple text logo
 */
export function generateTextLogo(text: string, color: string = '#ffffff'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
      <text x="10" y="45" font-family="Arial, sans-serif" font-size="30" font-weight="bold" fill="${color}">${text}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Auto-match logo based on camera brand from EXIF data
 */
export function autoMatchLogo(exif?: ExifData | null): LogoConfig | undefined {
  if (!exif?.make) return undefined;

  const make = exif.make.toLowerCase();
  let logoId: string | undefined;

  // Auto-match based on camera brand
  if (make.includes('canon')) {
    logoId = 'canon-1';
  } else if (make.includes('nikon')) {
    logoId = 'nikon-1';
  } else if (make.includes('sony')) {
    logoId = 'sony-1';
  } else if (make.includes('fuji') || make.includes('fujifilm')) {
    logoId = 'fuji-1';
  } else if (make.includes('leica')) {
    logoId = 'leica-1';
  }

  if (logoId) {
    return getLogoById(logoId);
  }

  return undefined;
}
