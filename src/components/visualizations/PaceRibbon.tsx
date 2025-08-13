import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ProcessedActivity } from '../../types/activity';
import { stylePresets, getHRZoneColor } from '../../utils/stylePresets';

interface PaceRibbonProps {
  activity: ProcessedActivity;
  style: keyof typeof stylePresets;
  width: number;
  height: number;
  colorBy: 'hr' | 'pace' | 'elevation';
  thicknessScale: number;
}

export function PaceRibbon({
  activity,
  style,
  width,
  height,
  colorBy,
  thicknessScale = 1,
}: PaceRibbonProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const styleConfig = stylePresets[style];
  
  useEffect(() => {
    if (!svgRef.current || !activity.processedPoints.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const margin = { top: 60, right: 60, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const points = activity.processedPoints;
    
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
    
    const line = d3.line<typeof points[0]>()
      .x(d => xScale(d.lng))
      .y(d => yScale(d.lat))
      .curve(d3.curveCatmullRom.alpha(0.5));
    
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      
      const segment = g.append('path')
        .datum([p1, p2])
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke-linecap', 'round');
      
      let color = styleConfig.foreground;
      if (colorBy === 'hr' && p2.hr && activity.maxHR) {
        color = getHRZoneColor(p2.hr, activity.maxHR);
      } else if (colorBy === 'pace' && p2.normalizedPace !== undefined) {
        color = styleConfig.colorScale(p2.normalizedPace);
      } else if (colorBy === 'elevation' && p2.ele) {
        const eleExtent = d3.extent(points, d => d.ele) as [number, number];
        const eleNorm = (p2.ele - eleExtent[0]) / (eleExtent[1] - eleExtent[0]);
        color = styleConfig.colorScale(eleNorm);
      }
      
      const thickness = p2.normalizedPace 
        ? (1 - p2.normalizedPace) * 8 * thicknessScale + 1
        : 2;
      
      segment
        .attr('stroke', color)
        .attr('stroke-width', thickness)
        .attr('opacity', 0.9);
    }
    
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
    
    if (activity.fastestSplit) {
      g.append('text')
        .attr('x', 0)
        .attr('y', innerHeight + 40)
        .attr('fill', styleConfig.textSecondary)
        .attr('font-family', styleConfig.font)
        .attr('font-size', '12px')
        .text(`Fastest km: ${formatPace(activity.fastestSplit.pace)}`);
    }
    
    if (activity.steepestClimb) {
      g.append('text')
        .attr('x', innerWidth)
        .attr('y', innerHeight + 40)
        .attr('text-anchor', 'end')
        .attr('fill', styleConfig.textSecondary)
        .attr('font-family', styleConfig.font)
        .attr('font-size', '12px')
        .text(`Steepest: ${activity.steepestClimb.description}`);
    }
    
  }, [activity, style, width, height, colorBy, thicknessScale]);
  
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

function formatPace(pace: number): string {
  const minutes = Math.floor(pace);
  const seconds = Math.floor((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}