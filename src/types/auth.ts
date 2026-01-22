export interface User {
  id: string;        // Unique ID for folder paths: "sean", "guest1"
  name: string;      // Display name: "Sean"
  password: string;  // Login password
  isAdmin: boolean;  // Can toggle lock, immune to lock
}

export interface AuthState {
  user: User | null;
  isAuthed: boolean;
}
