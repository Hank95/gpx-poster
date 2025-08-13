import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          GPX Poster
        </h1>
        <p className="text-xl text-neutral-400">
          Transform your activities into beautiful, minimal art
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-neutral-900 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">🎨 Visualizations</h2>
          <ul className="space-y-2 text-neutral-300">
            <li>• <strong>Pace Ribbon:</strong> Dynamic line thickness based on pace</li>
            <li>• <strong>Elevation Skyline:</strong> Beautiful elevation profiles</li>
            <li>• <strong>Topo Ghost:</strong> Faint contour lines under track</li>
            <li>• <strong>Pulse Path:</strong> HR waveform along route</li>
            <li>• <strong>Cadence Rosette:</strong> Radial split visualization</li>
            <li>• <strong>Custom Styles:</strong> Minimal, Neon, Blueprint, Retro</li>
          </ul>
        </div>
        
        <div className="bg-neutral-900 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">📊 Features</h2>
          <ul className="space-y-2 text-neutral-300">
            <li>• GPX, FIT, and TCX file support (Strava/Garmin exports)</li>
            <li>• Heart rate, cadence, and power data</li>
            <li>• Automatic metric computation</li>
            <li>• Split detection and analysis</li>
            <li>• High-res export for prints</li>
            <li>• Social media aspect ratios</li>
          </ul>
        </div>
      </div>
      
      <div className="text-center">
        <Link
          to="/studio"
          className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          Get Started →
        </Link>
      </div>
      
      <div className="mt-16 text-center text-neutral-500 text-sm">
        <p>Upload your GPX, FIT, or TCX file and create stunning visualizations of your runs, rides, and hikes.</p>
      </div>
    </div>
  );
}