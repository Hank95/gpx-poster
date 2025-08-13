import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ProcessedActivity } from '../../types/activity';
import { stylePresets, getHRZoneColor } from '../../utils/stylePresets';

interface PulsePathProps {
  activity: ProcessedActivity;
  style: keyof typeof stylePresets;
  width: number;
  height: number;
  hrThreshold?: number;
  amplitudeScale?: number;
}

export function PulsePath({
  activity,
  style,
  width,
  height,
  hrThreshold = 150, // Default aerobic threshold
  amplitudeScale = 20,
}: PulsePathProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const styleConfig = stylePresets[style];
  
  useEffect(() => {
    if (!svgRef.current || !activity.processedPoints.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const margin = { top: 60, right: 60, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const points = activity.processedPoints.filter(p => p.hr); // Only points with HR data
    
    if (points.length === 0) {
      // Show message if no HR data
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('x', -margin.left)
        .attr('y', -margin.top)
        .attr('fill', styleConfig.background);
      
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', styleConfig.textSecondary)
        .attr('font-family', styleConfig.font)
        .attr('font-size', '18px')
        .text('No heart rate data available');
      
      return;
    }
    
    const xExtent = d3.extent(points, d => d.lng) as [number, number];
    const yExtent = d3.extent(points, d => d.lat) as [number, number];
    
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([innerHeight, 0]);
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('x', -margin.left)
      .attr('y', -margin.top)
      .attr('fill', styleConfig.background);
    
    // Calculate the main route path
    const baseLine = d3.line<typeof points[0]>()
      .x(d => xScale(d.lng))
      .y(d => yScale(d.lat))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    // Draw the base route path (very subtle)
    g.append('path')
      .datum(points)
      .attr('d', baseLine)
      .attr('fill', 'none')
      .attr('stroke', styleConfig.foreground)
      .attr('stroke-width', 1)
      .attr('opacity', 0.2);
    
    // Calculate normals and create pulse path
    const pulsePoints: Array<{x: number, y: number, hr: number}> = [];
    
    for (let i = 0; i < points.length; i++) {
      const curr = points[i];
      const prev = i > 0 ? points[i - 1] : points[i];
      const next = i < points.length - 1 ? points[i + 1] : points[i];
      
      // Calculate tangent vector from prev to next
      const dx = xScale(next.lng) - xScale(prev.lng);
      const dy = yScale(next.lat) - yScale(prev.lat);
      
      // Calculate normal vector (perpendicular to tangent)
      const length = Math.sqrt(dx * dx + dy * dy);
      const normalX = length > 0 ? -dy / length : 0;
      const normalY = length > 0 ? dx / length : 0;
      
      // Calculate HR amplitude (deviation from threshold)
      const hrDelta = (curr.hr! - hrThreshold) / hrThreshold;
      const amplitude = hrDelta * amplitudeScale;
      
      // Offset point by normal * amplitude
      const baseX = xScale(curr.lng);
      const baseY = yScale(curr.lat);
      
      pulsePoints.push({
        x: baseX + normalX * amplitude,
        y: baseY + normalY * amplitude,
        hr: curr.hr!,
      });
    }
    
    // Create pulse path segments with HR zone colors
    for (let i = 1; i < pulsePoints.length; i++) {
      const p1 = pulsePoints[i - 1];
      const p2 = pulsePoints[i];
      
      const color = activity.maxHR 
        ? getHRZoneColor(p2.hr, activity.maxHR)
        : styleConfig.accent;
      
      g.append('line')
        .attr('x1', p1.x)
        .attr('y1', p1.y)
        .attr('x2', p2.x)
        .attr('y2', p2.y)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.8);
    }
    
    // Add threshold reference line (invisible guide)
    const thresholdPath = d3.line<typeof points[0]>()
      .x(d => xScale(d.lng))
      .y(d => yScale(d.lat))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    g.append('path')
      .datum(points)
      .attr('d', thresholdPath)
      .attr('fill', 'none')
      .attr('stroke', styleConfig.textSecondary)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.3);
    
    // Add start and end markers
    const startPoint = pulsePoints[0];
    const endPoint = pulsePoints[pulsePoints.length - 1];
    
    g.append('circle')
      .attr('cx', startPoint.x)
      .attr('cy', startPoint.y)
      .attr('r', 4)
      .attr('fill', styleConfig.accent)
      .attr('stroke', styleConfig.background)
      .attr('stroke-width', 2);
    
    g.append('circle')
      .attr('cx', endPoint.x)
      .attr('cy', endPoint.y)
      .attr('r', 4)
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
        .attr('font-family', styleConfig.font)
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
      .attr('font-family', styleConfig.font)
      .attr('font-size', '14px')
      .text(subtitle);
    
    // HR info
    if (activity.averageHR) {
      g.append('text')
        .attr('x', 0)
        .attr('y', innerHeight + 40)
        .attr('fill', styleConfig.textSecondary)
        .attr('font-family', styleConfig.font)
        .attr('font-size', '12px')
        .text(`Avg HR: ${Math.round(activity.averageHR)} bpm • Threshold: ${hrThreshold} bpm`);
    }
    
    if (activity.maxHR) {
      g.append('text')
        .attr('x', innerWidth)
        .attr('y', innerHeight + 40)
        .attr('text-anchor', 'end')
        .attr('fill', styleConfig.textSecondary)
        .attr('font-family', styleConfig.font)
        .attr('font-size', '12px')
        .text(`Max HR: ${Math.round(activity.maxHR)} bpm`);
    }
    
  }, [activity, style, width, height, hrThreshold, amplitudeScale, styleConfig]);
  
  return <svg ref={svgRef} width={width} height={height} />;
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