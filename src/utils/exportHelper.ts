// High-resolution export utilities for SVG to PNG/PDF conversion

export interface ExportOptions {
  format: 'png' | 'jpg' | 'pdf';
  scale: number; // 1 = normal, 2 = 2x, 4 = 4x for print quality
  width?: number; // Override width
  height?: number; // Override height
  quality?: number; // For JPG (0-1)
  backgroundColor?: string; // Background color override
}

export interface ExportPreset {
  name: string;
  description: string;
  options: ExportOptions;
}

// Export presets for different use cases
export const exportPresets: Record<string, ExportPreset> = {
  // Print quality presets
  'poster-24x36': {
    name: 'Poster (24"×36")',
    description: '300 DPI print quality for large posters',
    options: {
      format: 'png',
      scale: 4,
      width: 7200, // 24" at 300 DPI
      height: 10800, // 36" at 300 DPI
    },
  },
  'poster-18x24': {
    name: 'Poster (18"×24")',
    description: '300 DPI print quality for medium posters',
    options: {
      format: 'png',
      scale: 4,
      width: 5400, // 18" at 300 DPI
      height: 7200, // 24" at 300 DPI
    },
  },
  'print-8x10': {
    name: 'Print (8"×10")',
    description: '300 DPI for standard photo prints',
    options: {
      format: 'png',
      scale: 3,
      width: 2400, // 8" at 300 DPI
      height: 3000, // 10" at 300 DPI
    },
  },
  
  // Social media presets
  'instagram-post': {
    name: 'Instagram Post',
    description: 'Square format for Instagram posts',
    options: {
      format: 'jpg',
      scale: 2,
      width: 2048,
      height: 2048,
      quality: 0.95,
    },
  },
  'instagram-story': {
    name: 'Instagram Story',
    description: 'Vertical format for Instagram stories',
    options: {
      format: 'jpg',
      scale: 2,
      width: 1080,
      height: 1920,
      quality: 0.95,
    },
  },
  'facebook-post': {
    name: 'Facebook Post',
    description: 'Landscape format for Facebook sharing',
    options: {
      format: 'jpg',
      scale: 2,
      width: 1200,
      height: 630,
      quality: 0.95,
    },
  },
  'twitter-post': {
    name: 'Twitter/X Post',
    description: 'Landscape format for Twitter/X sharing',
    options: {
      format: 'jpg',
      scale: 2,
      width: 1600,
      height: 900,
      quality: 0.95,
    },
  },
  
  // Desktop wallpaper presets
  'wallpaper-4k': {
    name: '4K Wallpaper',
    description: 'Ultra HD desktop wallpaper',
    options: {
      format: 'jpg',
      scale: 2,
      width: 3840,
      height: 2160,
      quality: 0.98,
    },
  },
  'wallpaper-1080p': {
    name: '1080p Wallpaper',
    description: 'Full HD desktop wallpaper',
    options: {
      format: 'jpg',
      scale: 2,
      width: 1920,
      height: 1080,
      quality: 0.95,
    },
  },
};

// Convert SVG element to high-resolution canvas
export async function svgToCanvas(
  svgElement: SVGSVGElement,
  options: ExportOptions
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    try {
      // Get original dimensions
      const originalWidth = parseInt(svgElement.getAttribute('width') || '800');
      const originalHeight = parseInt(svgElement.getAttribute('height') || '600');
      
      // Calculate target dimensions
      const targetWidth = options.width || originalWidth * options.scale;
      const targetHeight = options.height || originalHeight * options.scale;
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d')!;
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Add background if specified
      if (options.backgroundColor) {
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }
      
      // Clone SVG and set new dimensions
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute('width', targetWidth.toString());
      svgClone.setAttribute('height', targetHeight.toString());
      
      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      // Load SVG as image and draw to canvas
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG as image'));
      };
      img.src = url;
      
    } catch (error) {
      reject(error);
    }
  });
}

// Convert canvas to downloadable blob
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  options: ExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      if (options.format === 'png') {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create PNG blob'));
        }, 'image/png');
      } else if (options.format === 'jpg') {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create JPG blob'));
        }, 'image/jpeg', options.quality || 0.95);
      } else {
        reject(new Error(`Unsupported format: ${options.format}`));
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Main export function
export async function exportSVG(
  svgElement: SVGSVGElement,
  filename: string,
  options: ExportOptions
): Promise<void> {
  try {
    const canvas = await svgToCanvas(svgElement, options);
    const blob = await canvasToBlob(canvas, options);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${options.format}`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

// Export with preset
export async function exportWithPreset(
  svgElement: SVGSVGElement,
  filename: string,
  presetKey: keyof typeof exportPresets
): Promise<void> {
  const preset = exportPresets[presetKey];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetKey}`);
  }
  
  return exportSVG(svgElement, `${filename}-${preset.name.toLowerCase().replace(/\s/g, '-')}`, preset.options);
}

// Generate filename based on activity data
export function generateExportFilename(
  activityName?: string,
  date?: Date,
  visualization?: string
): string {
  const parts: string[] = [];
  
  if (activityName) {
    // Clean activity name for filename
    parts.push(activityName.replace(/[^a-z0-9]/gi, '-').toLowerCase());
  }
  
  if (date) {
    parts.push(date.toISOString().split('T')[0]); // YYYY-MM-DD format
  }
  
  if (visualization) {
    parts.push(visualization.toLowerCase());
  }
  
  // Default fallback
  if (parts.length === 0) {
    parts.push('gpx-poster');
  }
  
  return parts.join('-');
}

// Batch export multiple presets
export async function batchExport(
  svgElement: SVGSVGElement,
  filename: string,
  presetKeys: (keyof typeof exportPresets)[]
): Promise<void> {
  const results = await Promise.allSettled(
    presetKeys.map(presetKey => exportWithPreset(svgElement, filename, presetKey))
  );
  
  // Log any failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Export failed for preset ${presetKeys[index]}:`, result.reason);
    }
  });
  
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  console.log(`Batch export completed: ${successCount}/${results.length} successful`);
}