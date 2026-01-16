import { CameraPreview } from './components/CameraPreview';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 text-center">
        <h1 className="text-4xl font-bold text-white">FormCheck</h1>
        <p className="text-gray-400 text-sm mt-2">Real-time exercise form feedback</p>
      </header>

      {/* Main camera preview area */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-3xl">
          <CameraPreview />
        </div>
      </main>
    </div>
  );
}

export default App;
