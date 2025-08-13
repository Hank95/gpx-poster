import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ProcessedActivity } from '../../types/activity';
import { stylePresets } from '../../utils/stylePresets';

interface ElevationSkylineProps {
  activity: ProcessedActivity;
  style: keyof typeof stylePresets;
  width: number;
  height: number;
  showSplits?: boolean;
}

export function ElevationSkyline({
  activity,
  style,
  width,
  height,
  showSplits = true,
}: ElevationSkylineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const styleConfig = stylePresets[style];
  
  useEffect(() => {
    if (!svgRef.current || !activity.processedPoints.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const margin = { top: 60, right: 40, bottom: 80, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const points = activity.processedPoints;
    
    const xScale = d3.scaleLinear()
      .domain([0, activity.totalDistance])
      .range([0, innerWidth]);
    
    const eleExtent = d3.extent(points, d => d.ele || 0) as [number, number];
    const yScale = d3.scaleLinear()
      .domain(eleExtent)
      .range([innerHeight, 0])
      .nice();
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('x', -margin.left)
      .attr('y', -margin.top)
      .attr('fill', styleConfig.background);
    
    const area = d3.area<typeof points[0]>()
      .x(d => xScale(d.distance))
      .y0(innerHeight)
      .y1(d => yScale(d.ele || 0))
      .curve(d3.curveMonotoneX);
    
    const line = d3.line<typeof points[0]>()
      .x(d => xScale(d.distance))
      .y(d => yScale(d.ele || 0))
      .curve(d3.curveMonotoneX);
    
    const gradient = g.append('defs')
      .append('linearGradient')
      .attr('id', 'elevation-gradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '100%')
      .attr('y2', '0%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', styleConfig.foreground)
      .attr('stop-opacity', 0.1);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', styleConfig.accent)
      .attr('stop-opacity', 0.3);
    
    g.append('path')
      .datum(points)
      .attr('d', area)
      .attr('fill', 'url(#elevation-gradient)');
    
    g.append('path')
      .datum(points)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', styleConfig.foreground)
      .attr('stroke-width', 2);
    
    if (showSplits) {
      activity.splits.forEach((_split, i) => {
        const x = xScale((i + 1) * 1000);
        
        g.append('line')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', 0)
          .attr('y2', innerHeight)
          .attr('stroke', styleConfig.textSecondary)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', 0.3);
        
        g.append('text')
          .attr('x', x)
          .attr('y', innerHeight + 20)
          .attr('text-anchor', 'middle')
          .attr('fill', styleConfig.textSecondary)
          .attr('font-family', styleConfig.font)
          .attr('font-size', '10px')
          .text(`${i + 1} km`);
      });
    }
    
    if (activity.fastestSplit) {
      const fastX = xScale((activity.fastestSplit.index + 0.5) * 1000);
      const fastY = yScale(
        points.find(p => p.distance >= activity.fastestSplit!.index * 1000)?.ele || 0
      );
      
      g.append('circle')
        .attr('cx', fastX)
        .attr('cy', fastY)
        .attr('r', 4)
        .attr('fill', styleConfig.accent);
      
      g.append('text')
        .attr('x', fastX)
        .attr('y', fastY - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', styleConfig.accent)
        .attr('font-family', styleConfig.font)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(`Fastest: ${formatPace(activity.fastestSplit.pace)}`);
    }
    
    if (activity.steepestClimb) {
      const steepStart = points[activity.steepestClimb.startIndex];
      const steepEnd = points[activity.steepestClimb.endIndex];
      
      g.append('rect')
        .attr('x', xScale(steepStart.distance))
        .attr('y', 0)
        .attr('width', xScale(steepEnd.distance) - xScale(steepStart.distance))
        .attr('height', innerHeight)
        .attr('fill', styleConfig.accent)
        .attr('opacity', 0.1);
    }
    
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `${(d as number / 1000).toFixed(0)} km`);
    
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .style('color', styleConfig.textSecondary)
      .style('font-family', styleConfig.font);
    
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${d} m`);
    
    g.append('g')
      .call(yAxis)
      .style('color', styleConfig.textSecondary)
      .style('font-family', styleConfig.font);
    
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
    
  }, [activity, style, width, height, showSplits]);
  
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
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}