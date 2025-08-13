import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/export")({
  component: Export,
});

function Export() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Export Options</h1>
      
      <div className="bg-neutral-900 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">🖼️ Print Formats</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: '24×36" Poster', res: '7200×10800' },
            { name: '18×24" Print', res: '5400×7200' },
            { name: '12×18" Print', res: '3600×5400' },
          ].map(format => (
            <button
              key={format.name}
              className="p-4 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors text-left"
            >
              <div className="font-semibold">{format.name}</div>
              <div className="text-sm text-neutral-400">{format.res} @ 300 DPI</div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-neutral-900 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📱 Social Media</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: 'Instagram Post', ratio: '1:1', res: '2048×2048' },
            { name: 'Instagram Story', ratio: '9:16', res: '1080×1920' },
            { name: 'Twitter/X', ratio: '16:9', res: '1920×1080' },
          ].map(format => (
            <button
              key={format.name}
              className="p-4 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors text-left"
            >
              <div className="font-semibold">{format.name}</div>
              <div className="text-sm text-neutral-400">{format.ratio} • {format.res}</div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-neutral-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">⚙️ Export Settings</h2>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded" />
            <span>Include activity QR code</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded" />
            <span>Add watermark</span>
          </label>
        </div>
      </div>
      
      <div className="mt-8 text-center text-neutral-500">
        <p>Upload an activity in the Studio to enable export options</p>
      </div>
    </div>
  );
}