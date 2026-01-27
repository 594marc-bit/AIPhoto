import type { LogoConfig, ExifData } from '@/types/image';

// Import logo assets
import hasselbladLogo from '@/assets/logos/hasselblad.svg';
import leicaLogo from '@/assets/logos/Leica.png';
import sonyLogo from '@/assets/logos/sony.png';

export const PRESET_LOGOS: LogoConfig[] = [
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
    id: 'sony-1',
    name: 'Sony (White)',
    url: sonyLogo,
    position: 'bottom',
    align: 'right',
    size: 10, // 10% of image width
    opacity: 1,
  },
  {
    id: 'hasselblad-1',
    name: 'Hasselblad (White)',
    url: hasselbladLogo,
    position: 'bottom',
    align: 'right',
    size: 10, // 10% of image width
    opacity: 1,
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
  if (make.includes('leica')) {
    logoId = 'leica-1';
  } else if (make.includes('sony')) {
    logoId = 'sony-1';
  } else if (make.includes('hasselblad')) {
    logoId = 'hasselblad-1';
  }

  if (logoId) {
    return getLogoById(logoId);
  }

  return undefined;
}
