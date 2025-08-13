import { stylePresets } from './stylePresets';
import { achievementThemes } from './achievementThemes';
import type { Selection } from 'd3';

// Get the appropriate style config based on the style key
export function getStyleConfig(style: string) {
  const themeConfig = achievementThemes[style as keyof typeof achievementThemes];
  const styleConfig = themeConfig || stylePresets[style as keyof typeof stylePresets];
  
  // Ensure backward compatibility
  return {
    ...styleConfig,
    font: (styleConfig as any).font || (styleConfig as any).bodyFont || 'Inter, system-ui, sans-serif',
    displayFont: (styleConfig as any).displayFont || (styleConfig as any).font || 'Inter, system-ui, sans-serif',
    bodyFont: (styleConfig as any).bodyFont || (styleConfig as any).font || 'Inter, system-ui, sans-serif',
  };
}

// Apply gradient background to an SVG element
export function applyBackground(
  g: Selection<SVGGElement, unknown, null, undefined>,
  background: string,
  width: number,
  height: number,
  marginLeft: number,
  marginTop: number,
  uniqueId: string = `bg-${Date.now()}`
) {
  if (background && background.includes('gradient')) {
    const defs = g.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', uniqueId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    
    // Parse gradient colors
    const colors = background.match(/#[0-9a-fA-F]{6}/g) || ['#000000'];
    colors.forEach((color, i) => {
      gradient.append('stop')
        .attr('offset', `${(i * 100) / (colors.length - 1)}%`)
        .attr('stop-color', color);
    });
    
    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('x', -marginLeft)
      .attr('y', -marginTop)
      .attr('fill', `url(#${uniqueId})`);
  } else {
    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('x', -marginLeft)
      .attr('y', -marginTop)
      .attr('fill', background);
  }
}