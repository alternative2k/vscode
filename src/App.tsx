import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="flex gap-4 mb-8">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo h-24 p-6 hover:drop-shadow-[0_0_2em_#646cffaa]" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo h-24 p-6 hover:drop-shadow-[0_0_2em_#61dafbaa] animate-spin-slow" alt="React logo" />
        </a>
      </div>
      <h1 className="text-5xl font-bold text-white mb-8">Vite + React</h1>
      <div className="card bg-gray-800 p-8 rounded-lg text-center">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="bg-gray-700 text-white px-6 py-3 rounded-lg text-lg font-medium hover:border-purple-500 border-2 border-transparent transition-colors"
        >
          count is {count}
        </button>
        <p className="text-gray-400 mt-4">
          Edit <code className="bg-gray-700 px-2 py-1 rounded">src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-gray-500 mt-8">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
