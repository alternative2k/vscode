import { useState, FormEvent } from 'react';
import type { User } from '../types/auth';

interface PasswordGateProps {
  onLogin: (password: string) => User | null;
}

export function PasswordGate({ onLogin }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const user = onLogin(password);
    if (!user) {
      setError(true);
      setPassword('');
    }
    // On success, parent handles state change and this component unmounts
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-800 rounded-xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          FormCheck
        </h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          Enter password to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Password"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">Incorrect password</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            style={{ minHeight: '48px' }}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
