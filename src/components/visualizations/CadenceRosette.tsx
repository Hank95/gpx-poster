import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { ProcessedActivity } from '../../types/activity';
import { getStyleConfig } from '../../utils/themeHelper';

interface CadenceRosetteProps {
  activity: ProcessedActivity;
  style: string;
  width: number;
  height: number;
  metric?: 'cadence' | 'power' | 'pace';
}

export function CadenceRosette({
  activity,
  style,
  width,
  height,
  metric = 'cadence',
}: CadenceRosetteProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const styleConfig = getStyleConfig(style);
  
  useEffect(() => {
    if (!svgRef.current || !activity.splits.length) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const margin = { top: 60, right: 60, bottom: 60, left: 60 };
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - Math.max(margin.top, margin.left);
    
    const splits = activity.splits;
    const angleStep = (2 * Math.PI) / splits.length;
    
    // Calculate metric values for each split
    const splitMetrics = splits.map((split, index) => {
      const splitPoints = activity.processedPoints.filter(p => 
        p.distance >= index * 1000 && p.distance < (index + 1) * 1000
      );
      
      let value = 0;
      let count = 0;
      
      if (metric === 'cadence') {
        splitPoints.forEach(p => {
          if (p.cadence) {
            value += p.cadence;
            count++;
          }
        });
      } else if (metric === 'power') {
        splitPoints.forEach(p => {
          if (p.power) {
            value += p.power;
            count++;
          }
        });
      } else if (metric === 'pace') {
        value = split.pace;
        count = 1;
      }
      
      return {
        split,
        value: count > 0 ? value / count : 0,
        splitPoints,
      };
    });
    
    // Filter out splits with no data
    const validSplits = splitMetrics.filter(sm => sm.value > 0);
    
    if (validSplits.length === 0) {
      // Show message if no data
      const g = svg.append('g');
      
      g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', styleConfig.background);
      
      g.append('text')
        .attr('x', centerX)
        .attr('y', centerY)
        .attr('text-anchor', 'middle')
        .attr('fill', styleConfig.textSecondary)
        .attr('font-family', styleConfig.font)
        .attr('font-size', '18px')
        .text(`No ${metric} data available`);
      
      return;
    }
    
    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', styleConfig.background);
    
    const g = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);
    
    // Scale for petal radius based on metric values
    const valueExtent = d3.extent(validSplits, d => d.value) as [number, number];
    const radiusScale = d3.scaleLinear()
      .domain(valueExtent)
      .range([maxRadius * 0.2, maxRadius * 0.8]);
    
    // Color scale for pace (faster = warmer)
    const paceExtent = d3.extent(validSplits, d => d.split.pace) as [number, number];
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
      .domain([paceExtent[1], paceExtent[0]]); // Reverse so faster = warmer
    
    // Draw petals
    validSplits.forEach((splitMetric, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start at top
      const radius = radiusScale(splitMetric.value);
      const color = colorScale(splitMetric.split.pace);
      
      // Create petal shape (teardrop/leaf)
      const petalPath = createPetalPath(radius, angleStep * 0.8);
      
      g.append('path')
        .attr('d', petalPath)
        .attr('transform', `rotate(${(angle * 180) / Math.PI})`)
        .attr('fill', color)
        .attr('stroke', styleConfig.foreground)
        .attr('stroke-width', 1)
        .attr('opacity', 0.8);
      
      // Add split number at tip of petal
      const tipX = Math.cos(angle) * radius;
      const tipY = Math.sin(angle) * radius;
      
      g.append('text')
        .attr('x', tipX)
        .attr('y', tipY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', styleConfig.text)
        .attr('font-family', styleConfig.font)
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(`${index + 1}`);
    });
    
    // Center circle
    g.append('circle')
      .attr('r', maxRadius * 0.15)
      .attr('fill', styleConfig.accent)
      .attr('stroke', styleConfig.foreground)
      .attr('stroke-width', 2);
    
    // Center text with metric info
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', styleConfig.background)
      .attr('font-family', styleConfig.font)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(metric.toUpperCase());
    
    // Title
    if (activity.name) {
      svg.append('text')
        .attr('x', centerX)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('fill', styleConfig.text)
        .attr('font-family', styleConfig.font)
        .attr('font-size', '24px')
        .attr('font-weight', 'bold')
        .text(activity.name);
    }
    
    // Subtitle
    const subtitle = [
      `${(activity.totalDistance / 1000).toFixed(1)} km`,
      `${splits.length} splits`,
      formatTime(activity.totalTime),
    ].join(' · ');
    
    svg.append('text')
      .attr('x', centerX)
      .attr('y', 52)
      .attr('text-anchor', 'middle')
      .attr('fill', styleConfig.textSecondary)
      .attr('font-family', styleConfig.font)
      .attr('font-size', '14px')
      .text(subtitle);
    
    // Legend/scale info
    const avgValue = validSplits.reduce((sum, sm) => sum + sm.value, 0) / validSplits.length;
    const unit = metric === 'cadence' ? 'spm' : metric === 'power' ? 'W' : 'min/km';
    
    svg.append('text')
      .attr('x', 20)
      .attr('y', height - 20)
      .attr('fill', styleConfig.textSecondary)
      .attr('font-family', styleConfig.font)
      .attr('font-size', '12px')
      .text(`Avg ${metric}: ${avgValue.toFixed(1)} ${unit}`);
    
    // Best split info
    const bestSplit = validSplits.reduce((best, current) => 
      current.split.pace < best.split.pace ? current : best
    );
    
    svg.append('text')
      .attr('x', width - 20)
      .attr('y', height - 20)
      .attr('text-anchor', 'end')
      .attr('fill', styleConfig.textSecondary)
      .attr('font-family', styleConfig.font)
      .attr('font-size', '12px')
      .text(`Fastest: Split ${bestSplit.split.index + 1} (${formatPace(bestSplit.split.pace)})`);
    
  }, [activity, style, width, height, metric, styleConfig]);
  
  return <svg ref={svgRef} width={width} height={height} />;
}

// Create a petal/leaf shaped path
function createPetalPath(radius: number, angleWidth: number): string {
  const halfAngle = angleWidth / 2;
  const controlRadius = radius * 0.6;
  
  const path = d3.path();
  
  // Start at center
  path.moveTo(0, 0);
  
  // Curve to one side
  path.quadraticCurveTo(
    Math.sin(halfAngle) * controlRadius,
    -Math.cos(halfAngle) * controlRadius,
    0, -radius
  );
  
  // Curve to other side
  path.quadraticCurveTo(
    -Math.sin(halfAngle) * controlRadius,
    -Math.cos(halfAngle) * controlRadius,
    0, 0
  );
  
  path.closePath();
  return path.toString();
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