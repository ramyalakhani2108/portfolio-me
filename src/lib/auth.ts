// API endpoint for backend server
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface Session {
  user: User;
  token: string;
}

// Fetch helper function
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { data: null, error: { message: data.error || 'Request failed' } };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('API request error:', error);
    return { data: null, error: { message: error.message } };
  }
};

// Sign up
export async function signUp(email: string, password: string, fullName?: string) {
  const result = await apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  });

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      user: result.data.user,
      session: { access_token: result.data.token }
    },
    error: null
  };
}

// Sign in
export async function signIn(email: string, password: string) {
  const result = await apiFetch('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (result.error) {
    return { data: null, error: result.error };
  }

  return {
    data: {
      user: result.data.user,
      session: { access_token: result.data.token }
    },
    error: null
  };
}

// Sign out
export async function signOut(token: string) {
  return { error: null };
}

// Get session (stored in localStorage)
export async function getSession(token: string) {
  if (!token) {
    return { data: { session: null }, error: null };
  }

  // Token validation could be added here
  return {
    data: { session: { user: null, access_token: token } },
    error: null
  };
}

// Update user
export async function updateUser(userId: string, data: Partial<User>) {
  return {
    data: null,
    error: { message: 'Not implemented' }
  };
}
