function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-white mb-8">FormCheck</h1>
      <div className="bg-gray-800 rounded-lg p-8 text-center max-w-md w-full mx-4">
        <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center mb-4">
          <p className="text-gray-400">Camera preview will appear here</p>
        </div>
        <p className="text-gray-400 text-sm">
          Real-time exercise form feedback
        </p>
      </div>
    </div>
  )
}

export default App
