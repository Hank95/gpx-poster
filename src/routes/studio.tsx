import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { parseGPXFile } from "../utils/gpxParser";
import { parseFITFile } from "../utils/fitParser";
import { processActivity } from "../utils/dataProcessor";
import { PaceRibbon } from "../components/visualizations/PaceRibbon";
import { ElevationSkyline } from "../components/visualizations/ElevationSkyline";
import type { ProcessedActivity, VisualizationTemplate, StylePreset } from "../types/activity";

export const Route = createFileRoute("/studio")({
  component: Studio,
});

function Studio() {
  const [activity, setActivity] = useState<ProcessedActivity | null>(null);
  const [template, setTemplate] = useState<VisualizationTemplate>('ribbon');
  const [style, setStyle] = useState<StylePreset>('minimal');
  const [colorBy, setColorBy] = useState<'hr' | 'pace' | 'elevation'>('pace');
  const [thicknessScale, setThicknessScale] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      let rawActivity;
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.gpx')) {
        rawActivity = await parseGPXFile(file);
      } else if (fileName.endsWith('.fit')) {
        rawActivity = await parseFITFile(file);
      } else {
        throw new Error('Unsupported file format. Please upload a GPX or FIT file.');
      }
      
      const processed = processActivity(rawActivity);
      setActivity(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  }, [processFile]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files.find(f => 
      f.name.toLowerCase().endsWith('.gpx') || 
      f.name.toLowerCase().endsWith('.fit')
    );
    
    if (file) {
      await processFile(file);
    } else {
      setError('Please drop a GPX or FIT file');
    }
  }, [processFile]);
  
  const visualizationWidth = 1200;
  const visualizationHeight = template === 'skyline' ? 400 : 800;
  
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">GPX Poster Studio</h1>
        
        {!activity && (
          <div 
            className="bg-neutral-900 rounded-lg p-8 mb-8"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <label className="block">
              <div className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-neutral-700 hover:border-neutral-500'
              }`}>
                <svg className="w-12 h-12 mb-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-neutral-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-neutral-500">GPX or FIT files (Strava exports supported)</p>
                {isProcessing && <p className="mt-4 text-blue-400">Processing...</p>}
                {error && <p className="mt-4 text-red-400">{error}</p>}
              </div>
              <input
                type="file"
                className="hidden"
                accept=".gpx,.fit"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
            </label>
          </div>
        )}
        
        {activity && (
          <>
            {(activity.averageHR || activity.maxHR) && (
              <div className="bg-neutral-900 rounded-lg p-4 mb-6">
                <div className="flex flex-wrap gap-6 text-sm">
                  {activity.averageHR && (
                    <div>
                      <span className="text-neutral-400">Avg HR:</span>
                      <span className="ml-2 font-semibold">{Math.round(activity.averageHR)} bpm</span>
                    </div>
                  )}
                  {activity.maxHR && (
                    <div>
                      <span className="text-neutral-400">Max HR:</span>
                      <span className="ml-2 font-semibold">{Math.round(activity.maxHR)} bpm</span>
                    </div>
                  )}
                  {activity.processedPoints[0]?.cadence && (
                    <div>
                      <span className="text-neutral-400">Avg Cadence:</span>
                      <span className="ml-2 font-semibold">
                        {Math.round(
                          activity.processedPoints.reduce((sum, p) => sum + (p.cadence || 0), 0) / 
                          activity.processedPoints.filter(p => p.cadence).length
                        )} spm
                      </span>
                    </div>
                  )}
                  {activity.processedPoints[0]?.power && (
                    <div>
                      <span className="text-neutral-400">Avg Power:</span>
                      <span className="ml-2 font-semibold">
                        {Math.round(
                          activity.processedPoints.reduce((sum, p) => sum + (p.power || 0), 0) / 
                          activity.processedPoints.filter(p => p.power).length
                        )} W
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="bg-neutral-900 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Visualization Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Template</label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as VisualizationTemplate)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ribbon">Pace Ribbon</option>
                    <option value="skyline">Elevation Skyline</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as StylePreset)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="minimal">Minimal Mono</option>
                    <option value="neon">Neon Heat</option>
                    <option value="blueprint">Blueprint</option>
                    <option value="retro">Retro Topo</option>
                  </select>
                </div>
                
                {template === 'ribbon' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Color By</label>
                      <select
                        value={colorBy}
                        onChange={(e) => setColorBy(e.target.value as 'hr' | 'pace' | 'elevation')}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pace">Pace</option>
                        <option value="hr">Heart Rate</option>
                        <option value="elevation">Elevation</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Thickness Scale: {thicknessScale.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={thicknessScale}
                        onChange={(e) => setThicknessScale(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setActivity(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors"
                >
                  Upload New File
                </button>
              </div>
            </div>
            
            <div className="bg-neutral-900 rounded-lg p-6 overflow-auto">
              <div className="flex justify-center">
                {template === 'ribbon' && (
                  <PaceRibbon
                    activity={activity}
                    style={style}
                    width={visualizationWidth}
                    height={visualizationHeight}
                    colorBy={colorBy}
                    thicknessScale={thicknessScale}
                  />
                )}
                {template === 'skyline' && (
                  <ElevationSkyline
                    activity={activity}
                    style={style}
                    width={visualizationWidth}
                    height={visualizationHeight}
                    showSplits={true}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}