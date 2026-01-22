import { CameraPreview } from './components/CameraPreview';
import { PasswordGate } from './components/PasswordGate';
import { useAuth } from './hooks/useAuth';
import { useAppLock } from './hooks/useAppLock';

function App() {
  const { isAuthed, user, login, logout } = useAuth();
  const { isLocked, isLoading: isLockLoading, toggleLock } = useAppLock();

  // Show password gate if not authenticated
  if (!isAuthed) {
    return <PasswordGate onLogin={login} />;
  }

  // Show locked screen for non-admin users when app is locked
  if (isLocked && !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            App Locked
          </h1>
          <p className="text-gray-400 text-sm md:text-base mb-6">
            The app is currently locked by an administrator.
          </p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Main app when authenticated
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header - compact on mobile, more spacious on desktop */}
      <header className="py-4 md:py-6 px-4 shrink-0">
        {/* Mobile: stacked layout with title/controls separated */}
        {/* Desktop: title centered with absolute positioned controls */}
        <div className="flex flex-col md:block md:relative md:text-center">
          {/* Mobile header row: title left, controls right */}
          <div className="flex items-center justify-between md:hidden mb-1">
            <h1 className="text-2xl font-bold text-white">FormCheck</h1>
            {/* Mobile controls */}
            <div className="flex items-center gap-2">
              {/* Lock toggle - admin only */}
              {user?.isAdmin && (
                <button
                  onClick={toggleLock}
                  disabled={isLockLoading}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    isLocked
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  } ${isLockLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label={isLocked ? 'Unlock app' : 'Lock app'}
                  title={isLocked ? 'App is locked - click to unlock' : 'Click to lock app'}
                >
                  {isLockLoading ? '...' : isLocked ? 'Locked' : 'Unlocked'}
                </button>
              )}
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          </div>
          <p className="text-gray-400 text-xs md:hidden">
            Real-time exercise form feedback
          </p>

          {/* Desktop: centered title */}
          <h1 className="hidden md:block text-4xl font-bold text-white">FormCheck</h1>
          <p className="hidden md:block text-gray-400 text-sm mt-2">
            Real-time exercise form feedback
          </p>

          {/* Desktop: absolute positioned controls */}
          <div className="hidden md:flex absolute top-4 right-4 items-center gap-2">
            {/* Lock toggle - admin only */}
            {user?.isAdmin && (
              <button
                onClick={toggleLock}
                disabled={isLockLoading}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  isLocked
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                } ${isLockLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={isLocked ? 'Unlock app' : 'Lock app'}
                title={isLocked ? 'App is locked - click to unlock' : 'Click to lock app'}
              >
                {isLockLoading ? '...' : isLocked ? 'Locked' : 'Unlocked'}
              </button>
            )}

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
