import { useState } from 'react';
import { 
  exportPresets, 
  exportSVG, 
  exportWithPreset, 
  batchExport,
  generateExportFilename,
  type ExportOptions 
} from '../utils/exportHelper';
import type { ProcessedActivity } from '../types/activity';

interface ExportControlsProps {
  activity?: ProcessedActivity;
  visualization: string;
}

export function ExportControls({ activity, visualization }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png');
  const [exportScale, setExportScale] = useState(2);

  const handleExport = async (options: ExportOptions, filename: string) => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;
    
    setIsExporting(true);
    try {
      await exportSVG(svgElement, filename, options);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePresetExport = async (presetKey: keyof typeof exportPresets) => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;
    
    const filename = generateExportFilename(
      activity?.name,
      activity?.date,
      visualization
    );
    
    setIsExporting(true);
    try {
      await exportWithPreset(svgElement, filename, presetKey);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchExport = async (category: 'print' | 'social' | 'wallpaper') => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;
    
    const filename = generateExportFilename(
      activity?.name,
      activity?.date,
      visualization
    );

    let presetKeys: (keyof typeof exportPresets)[] = [];
    
    if (category === 'print') {
      presetKeys = ['poster-24x36', 'poster-18x24', 'print-8x10'];
    } else if (category === 'social') {
      presetKeys = ['instagram-post', 'instagram-story', 'facebook-post', 'twitter-post'];
    } else if (category === 'wallpaper') {
      presetKeys = ['wallpaper-4k', 'wallpaper-1080p'];
    }
    
    setIsExporting(true);
    try {
      await batchExport(svgElement, filename, presetKeys);
      alert(`Batch export completed! Downloaded ${presetKeys.length} files.`);
    } catch (error) {
      console.error('Batch export failed:', error);
      alert('Batch export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomExport = async () => {
    const svgElement = document.querySelector('svg');
    if (!svgElement) return;

    const options: ExportOptions = {
      format: exportFormat,
      scale: exportScale,
      quality: exportFormat === 'jpg' ? 0.95 : undefined,
    };

    const filename = generateExportFilename(
      activity?.name,
      activity?.date,
      visualization
    );

    await handleExport(options, filename);
  };

  const presetGroups = {
    print: ['poster-24x36', 'poster-18x24', 'print-8x10'],
    social: ['instagram-post', 'instagram-story', 'facebook-post', 'twitter-post'],
    wallpaper: ['wallpaper-4k', 'wallpaper-1080p'],
  } as const;

  return (
    <div className="bg-neutral-900 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-neutral-100">Export Poster</h3>
          
          {/* Quick Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handlePresetExport('instagram-post')}
              disabled={isExporting}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              📱 Instagram
            </button>
            <button
              onClick={() => handlePresetExport('poster-18x24')}
              disabled={isExporting}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              🖼️ Print
            </button>
            <button
              onClick={() => handlePresetExport('wallpaper-4k')}
              disabled={isExporting}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
            >
              🖥️ Wallpaper
            </button>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded"
        >
          <svg 
            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {isExporting && (
        <div className="mt-2 text-sm text-blue-400 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exporting...
        </div>
      )}
      
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* All Export Options */}
          <div className="grid grid-cols-3 gap-4">
            {/* Print Quality */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-300 uppercase tracking-wide">
                  🖼️ Print
                </span>
                <button
                  onClick={() => handleBatchExport('print')}
                  disabled={isExporting}
                  className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  All
                </button>
              </div>
              <div className="space-y-1">
                {presetGroups.print.map((presetKey) => {
                  const preset = exportPresets[presetKey];
                  return (
                    <button
                      key={presetKey}
                      onClick={() => handlePresetExport(presetKey)}
                      disabled={isExporting}
                      className="w-full text-left p-2 text-xs border border-neutral-700 rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-neutral-200">{preset.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-300 uppercase tracking-wide">
                  📱 Social
                </span>
                <button
                  onClick={() => handleBatchExport('social')}
                  disabled={isExporting}
                  className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
                >
                  All
                </button>
              </div>
              <div className="space-y-1">
                {presetGroups.social.map((presetKey) => {
                  const preset = exportPresets[presetKey];
                  return (
                    <button
                      key={presetKey}
                      onClick={() => handlePresetExport(presetKey)}
                      disabled={isExporting}
                      className="w-full text-left p-2 text-xs border border-neutral-700 rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-neutral-200">{preset.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Export */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-neutral-300 uppercase tracking-wide">
                ⚙️ Custom
              </span>
              <div className="space-y-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'png' | 'jpg')}
                  className="w-full text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-200"
                >
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                </select>
                
                <select
                  value={exportScale}
                  onChange={(e) => setExportScale(parseInt(e.target.value))}
                  className="w-full text-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-200"
                >
                  <option value={1}>1x Quality</option>
                  <option value={2}>2x Quality</option>
                  <option value={3}>3x Quality</option>
                  <option value={4}>4x Quality</option>
                </select>

                <button
                  onClick={handleCustomExport}
                  disabled={isExporting}
                  className="w-full bg-neutral-700 text-neutral-200 py-1 px-2 rounded text-xs hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}