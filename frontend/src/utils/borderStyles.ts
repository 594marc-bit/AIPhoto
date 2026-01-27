import type { BorderStyle } from '@/types/image';

export const BORDER_STYLES: BorderStyle[] = [
  // Bottom border styles
  {
    id: 'bottom-simple',
    name: '底部简单边框',
    type: 'bottom',
    bottomHeightPercent: 5,
    sideWidthPercent: 0,
    padding: 15,
    backgroundColor: '#ffffff',
    textColor: '#333333',
    font: 'Arial',
    fontSize: 12,
    showExif: true,
    showLogo: false,
    logoPosition: 'center',
  },
  {
    id: 'bottom-dark',
    name: '底部深色边框',
    type: 'bottom',
    bottomHeightPercent: 8,
    sideWidthPercent: 0,
    padding: 20,
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    font: 'Arial',
    fontSize: 14,
    showExif: true,
    showLogo: false,
    logoPosition: 'center',
  },
  {
    id: 'bottom-polaroid',
    name: '拍立得风格',
    type: 'bottom',
    bottomHeightPercent: 10,
    sideWidthPercent: 3,
    padding: 20,
    backgroundColor: '#f5f5f5',
    textColor: '#666666',
    font: 'Georgia',
    fontSize: 11,
    showExif: false,
    showLogo: false,
    logoPosition: 'center',
  },

  // Full border styles
  {
    id: 'full-simple-white',
    name: '白色四周边框',
    type: 'full',
    bottomHeightPercent: 5,
    sideWidthPercent: 3,
    padding: 15,
    backgroundColor: '#ffffff',
    textColor: '#333333',
    font: 'Arial',
    fontSize: 12,
    showExif: true,
    showLogo: false,
    logoPosition: 'center',
  },
  {
    id: 'full-simple-black',
    name: '黑色四周边框',
    type: 'full',
    bottomHeightPercent: 5,
    sideWidthPercent: 3,
    padding: 15,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    font: 'Arial',
    fontSize: 12,
    showExif: true,
    showLogo: false,
    logoPosition: 'center',
  },
  {
    id: 'full-cream',
    name: '奶油色边框',
    type: 'full',
    bottomHeightPercent: 6,
    sideWidthPercent: 4,
    padding: 20,
    backgroundColor: '#f8f4e8',
    textColor: '#4a4a4a',
    font: 'Georgia',
    fontSize: 13,
    showExif: true,
    showLogo: false,
    logoPosition: 'center',
  },

  // Artistic styles
  {
    id: 'artistic-vintage',
    name: '复古风格',
    type: 'artistic',
    bottomHeightPercent: 8,
    sideWidthPercent: 3,
    padding: 20,
    backgroundColor: '#d4c5b0',
    textColor: '#3d3326',
    font: 'Times New Roman',
    fontSize: 14,
    showExif: true,
    showLogo: false,
    logoPosition: 'center',
  },
  {
    id: 'artistic-modern',
    name: '现代简约',
    type: 'artistic',
    bottomHeightPercent: 6,
    sideWidthPercent: 5,
    padding: 25,
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    font: 'Helvetica Neue',
    fontSize: 11,
    showExif: true,
    showLogo: false,
    logoPosition: 'center',
  },
  {
    id: 'artistic-film',
    name: '胶片风格',
    type: 'artistic',
    bottomHeightPercent: 7,
    sideWidthPercent: 2,
    padding: 15,
    backgroundColor: '#2a2a2a',
    textColor: '#e0e0e0',
    font: 'Courier New',
    fontSize: 10,
    showExif: true,
    showLogo: false,
    logoPosition: 'center',
  },

  // Blur background styles
  {
    id: 'blur-light',
    name: '浅色模糊背景',
    type: 'blur',
    bottomHeightPercent: 0,
    sideWidthPercent: 0,
    padding: 40,
    backgroundColor: '#f0f0f0',
    textColor: '#333333',
    font: 'Arial',
    fontSize: 14,
    showExif: true,
    showLogo: false,
    logoPosition: 'center',
  },
  {
    id: 'blur-dark',
    name: '深色模糊背景',
    type: 'blur',
    bottomHeightPercent: 0,
    sideWidthPercent: 0,
    padding: 50,
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    font: 'Arial',
    fontSize: 14,
    showExif: true,
    showLogo: false,
    logoPosition: 'center',
  },
];

export function getBorderStyleById(id: string): BorderStyle | undefined {
  return BORDER_STYLES.find((style) => style.id === id);
}

export function getBorderStylesByType(type: BorderStyle['type']): BorderStyle[] {
  return BORDER_STYLES.filter((style) => style.type === type);
}

export function createCustomBorderStyle(
  baseStyle: BorderStyle,
  customizations: Partial<BorderStyle>,
): BorderStyle {
  return {
    ...baseStyle,
    ...customizations,
    id: `custom_${Date.now()}`,
  };
}

/**
 * Get the default border style
 */
export function getDefaultBorderStyle(): BorderStyle {
  // Return a custom style with all borders and blur configurable
  return {
    id: 'custom',
    name: '自定义样式',
    type: 'custom',
    topWidthPercent: 0,
    bottomHeightPercent: 10,
    leftWidthPercent: 0,
    rightWidthPercent: 0,
    sideWidthPercent: 0,
    padding: 15,
    backgroundColor: '#ffffff',
    textColor: '#333333',
    font: 'Arial',
    fontSize: 12,
    showExif: true,
    showLogo: false,
    logoPosition: 'center',
    blur: false,
    shadow: false,
  };
}
