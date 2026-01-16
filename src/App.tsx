import { CameraPreview } from './components/CameraPreview';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header - compact on mobile, more spacious on desktop */}
      <header className="py-4 md:py-6 px-4 text-center shrink-0">
        <h1 className="text-2xl md:text-4xl font-bold text-white">FormCheck</h1>
        <p className="text-gray-400 text-xs md:text-sm mt-1 md:mt-2">
          Real-time exercise form feedback
        </p>
      </header>

      {/* Main camera preview area - fills most of viewport on mobile */}
      <main className="flex-1 flex items-start md:items-center justify-center px-2 md:px-4 pb-4 md:pb-8">
        <div className="w-full md:max-w-3xl lg:max-w-4xl h-full md:h-auto">
          <CameraPreview />
        </div>
      </main>
    </div>
  );
}

export default App;
