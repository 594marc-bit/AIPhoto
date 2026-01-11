# 品牌 Logo

这个目录包含相机品牌和图标 Logo 的 SVG 文件。

## 文件列表

- `canon.svg` - 佳能 Logo (白色)
- `nikon.svg` - 尼康 Logo (白色)
- `sony.svg` - 索尼 Logo (白色)
- `fujifilm.svg` - 富士 Logo (白色)
- `leica.svg` - 徕卡 Logo (红色)
- `camera-icon.svg` - 简单相机图标
- `lens-icon.svg` - 镜头图标

## 如何添加新的 Logo

1. 将 SVG 或 PNG 文件放到此目录
2. 在 `src/utils/logoLibrary.ts` 中导入文件：

```typescript
import myLogo from '@/assets/logos/my-logo.svg';
```

3. 在 `PRESET_LOGOS` 数组中添加配置：

```typescript
{
  id: 'my-logo-1',
  name: 'My Logo',
  url: myLogo,
  position: 'bottom',
  align: 'right',
  size: 80,
  opacity: 1,
}
```

## Logo 规格

- **格式**: SVG (推荐) 或 PNG
- **尺寸**: 建议 200x60 像素 (SVG 可设置 viewBox)
- **颜色**: 白色或透明背景，适用于深色边框
- **文件大小**: 尽量小于 50KB
