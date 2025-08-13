import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { contours } from 'd3-contour';
import type { ProcessedActivity } from '../../types/activity';
import { getStyleConfig } from '../../utils/themeHelper';

interface TopoGhostProps {
  activity: ProcessedActivity;
  style: string;
  width: number;
  height: number;
  contourDensity?: number;
}

export function TopoGhost({
  activity,
  style,
  width,
  height,
  contourDensity = 20,
}: TopoGhostProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const styleConfig = getStyleConfig(style);
  
  useEffect(() => {
    if (!svgRef.current || !activity.processedPoints.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const margin = { top: 60, right: 60, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const points = activity.processedPoints;
    
    // Get bounds for the track
    const xExtent = d3.extent(points, d => d.lng) as [number, number];
    const yExtent = d3.extent(points, d => d.lat) as [number, number];
    const eleExtent = d3.extent(points, d => d.ele || 0) as [number, number];
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([innerHeight, 0]);
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Handle gradient backgrounds from achievement themes
    const backgroundId = `topo-bg-${Date.now()}`;
    if (styleConfig.background && styleConfig.background.includes('gradient')) {
      const defs = g.append('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', backgroundId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%');
      
      // Parse gradient colors (simplified - could be enhanced)
      const colors = styleConfig.background.match(/#[0-9a-fA-F]{6}/g) || ['#000000'];
      colors.forEach((color, i) => {
        gradient.append('stop')
          .attr('offset', `${(i * 100) / (colors.length - 1)}%`)
          .attr('stop-color', color);
      });
      
      g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('x', -margin.left)
        .attr('y', -margin.top)
        .attr('fill', `url(#${backgroundId})`);
    } else {
      g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('x', -margin.left)
        .attr('y', -margin.top)
        .attr('fill', styleConfig.background);
    }
    
    // Generate elevation grid for contours
    const gridSize = contourDensity;
    const elevationGrid: number[] = [];
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        // Convert grid position to lat/lng
        const lng = xExtent[0] + (x / (gridSize - 1)) * (xExtent[1] - xExtent[0]);
        const lat = yExtent[0] + (y / (gridSize - 1)) * (yExtent[1] - yExtent[0]);
        
        // Find nearest track point and interpolate elevation
        const elevation = interpolateElevation(lng, lat, points);
        elevationGrid.push(elevation);
      }
    }
    
    // Generate contours
    const contourGenerator = contours()
      .size([gridSize, gridSize])
      .thresholds(d3.range(eleExtent[0], eleExtent[1], (eleExtent[1] - eleExtent[0]) / 8));
    
    const contourData = contourGenerator(elevationGrid);
    
    // Create contour paths
    const contourScale = d3.scaleLinear()
      .domain([0, gridSize - 1])
      .range([0, innerWidth]);
    
    const contourScaleY = d3.scaleLinear()
      .domain([0, gridSize - 1])
      .range([0, innerHeight]);
    
    // Draw contour lines
    g.selectAll('.contour')
      .data(contourData)
      .enter()
      .append('path')
      .attr('class', 'contour')
      .attr('d', (d: any) => {
        const path = d3.geoPath().projection(d3.geoTransform({
          point: function(x: number, y: number) {
            (this as any).stream.point(contourScale(x), contourScaleY(y));
          }
        }));
        return path(d);
      })
      .attr('fill', 'none')
      .attr('stroke', styleConfig.foreground)
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.15);
    
    // Draw the main track on top
    const line = d3.line<typeof points[0]>()
      .x(d => xScale(d.lng))
      .y(d => yScale(d.lat))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    g.append('path')
      .datum(points)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', styleConfig.accent)
      .attr('stroke-width', 3)
      .attr('opacity', 0.9);
    
    // Add start and end markers
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    
    g.append('circle')
      .attr('cx', xScale(startPoint.lng))
      .attr('cy', yScale(startPoint.lat))
      .attr('r', 6)
      .attr('fill', styleConfig.accent)
      .attr('stroke', styleConfig.background)
      .attr('stroke-width', 2);
    
    g.append('circle')
      .attr('cx', xScale(endPoint.lng))
      .attr('cy', yScale(endPoint.lat))
      .attr('r', 6)
      .attr('fill', styleConfig.foreground)
      .attr('stroke', styleConfig.background)
      .attr('stroke-width', 2);
    
    // Labels
    if (activity.name) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .attr('fill', styleConfig.text)
        .attr('font-family', (styleConfig as any).font || (styleConfig as any).bodyFont || 'Inter, system-ui, sans-serif')
        .attr('font-size', '24px')
        .attr('font-weight', 'bold')
        .text(activity.name);
    }
    
    const subtitle = [
      `${(activity.totalDistance / 1000).toFixed(1)} km`,
      `${Math.round(activity.totalElevationGain)} m`,
      formatTime(activity.totalTime),
    ].join(' · ');
    
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('fill', styleConfig.textSecondary)
      .attr('font-family', (styleConfig as any).font || (styleConfig as any).bodyFont || 'Inter, system-ui, sans-serif')
      .attr('font-size', '14px')
      .text(subtitle);
    
    // Elevation range indicator
    g.append('text')
      .attr('x', 0)
      .attr('y', innerHeight + 40)
      .attr('fill', styleConfig.textSecondary)
      .attr('font-family', (styleConfig as any).font || (styleConfig as any).bodyFont || 'Inter, system-ui, sans-serif')
      .attr('font-size', '12px')
      .text(`Elevation: ${Math.round(eleExtent[0])}m - ${Math.round(eleExtent[1])}m`);
    
  }, [activity, style, width, height, contourDensity, styleConfig]);
  
  return <svg ref={svgRef} width={width} height={height} />;
}

// Interpolate elevation at a given lat/lng from nearby track points
function interpolateElevation(lng: number, lat: number, points: ProcessedActivity['processedPoints']): number {
  let minDistance = Infinity;
  let nearestElevation = 0;
  
  // Find the closest point
  for (const point of points) {
    if (!point.ele) continue;
    
    const distance = Math.sqrt(
      Math.pow(point.lng - lng, 2) + Math.pow(point.lat - lat, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestElevation = point.ele;
    }
  }
  
  return nearestElevation;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}