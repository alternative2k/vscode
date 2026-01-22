import { CameraPreview } from './components/CameraPreview';
import { PasswordGate } from './components/PasswordGate';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthed, user, login, logout } = useAuth();

  // Show password gate if not authenticated
  if (!isAuthed) {
    return <PasswordGate onLogin={login} />;
  }

  // Main app when authenticated
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header - compact on mobile, more spacious on desktop */}
      <header className="py-4 md:py-6 px-4 text-center shrink-0 relative">
        <h1 className="text-2xl md:text-4xl font-bold text-white">FormCheck</h1>
        <p className="text-gray-400 text-xs md:text-sm mt-1 md:mt-2">
          Real-time exercise form feedback
        </p>

        {/* User info and logout - small, unobtrusive */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="text-gray-400 text-xs">
            {user?.name}
            {user?.isAdmin && (
              <span className="text-blue-400 ml-1">(Admin)</span>
            )}
          </span>
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-300 text-xs md:text-sm transition-colors"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
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
