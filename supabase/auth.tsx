import { createContext, useContext, useEffect, useState } from "react";
import { User, signIn as authSignIn, signUp as authSignUp, signOut as authSignOut, getSession } from "../src/lib/auth";
import { db } from "../src/lib/db";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    profileImageFile?: File,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  uploadProfileImage: (
    userId: string,
    file: File,
    fullName: string,
  ) => Promise<string>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store token in localStorage
const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      getSession(token).then(({ data, error }) => {
        if (data?.session?.user) {
          setUser(data.session.user);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    profileImageFile?: File,
  ) => {
    const { data, error } = await authSignUp(email, password, fullName);
    if (error) throw error;

    if (data?.user) {
      setUser(data.user);
      if (data.session?.access_token) {
        localStorage.setItem(TOKEN_KEY, data.session.access_token);
      }

      // If profile image is provided, upload it
      if (profileImageFile) {
        try {
          await uploadProfileImage(data.user.id, profileImageFile, fullName);
        } catch (uploadError) {
          console.error("Profile image upload failed:", uploadError);
          // Don't throw error, account creation should still succeed
        }
      }
    }
  };

  const uploadProfileImage = async (
    userId: string,
    file: File,
    fullName: string,
  ) => {
    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type");
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error("File too large");
    }

    // Compress and convert to WebP
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    const maxSize800 = 800;
    const ratio = Math.min(maxSize800 / img.width, maxSize800 / img.height);
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;

    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

    const webpBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), "image/webp", 0.9);
    });

    const fileName = `${userId}/avatar.webp`;

    // Upload to local server
    const formData = new FormData();
    formData.append("file", webpBlob, fileName);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload-profile-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const uploadData = await response.json();

      // Update profile in database
      const { error: profileError } = await db.from("profiles").upsert({
        id: userId,
        full_name: fullName,
        avatar_url: uploadData.fileName, // Use the returned path
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      return uploadData.url;
    } catch (uploadError: any) {
      throw new Error(uploadError.message || "Upload failed");
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authSignIn(email, password);
    if (error) throw error;
    
    if (data?.user) {
      setUser(data.user);
      if (data.session?.access_token) {
        localStorage.setItem(TOKEN_KEY, data.session.access_token);
      }
    }
  };

  const signOut = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      await authSignOut(token);
      localStorage.removeItem(TOKEN_KEY);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, uploadProfileImage }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
