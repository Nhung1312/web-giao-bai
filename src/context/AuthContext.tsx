import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from '../firebase';

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isLocalTeacher?: boolean;
}

interface AuthContextType {
  user: AppUser | User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  loginAsTeacher: (profile?: { name?: string; email?: string; avatar?: string }) => AppUser;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const LOCAL_TEACHER_STORAGE_KEY = 'toan_thcs_teacher_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Kiểm tra phiên đăng nhập Giáo viên đã lưu trong máy
    const savedLocal = localStorage.getItem(LOCAL_TEACHER_STORAGE_KEY);
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (parsed && parsed.uid) {
          setUser(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Lỗi đọc phiên giáo viên local:', e);
      }
    }

    // 2. Lắng nghe trạng thái đăng nhập từ Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Nếu Firebase chưa đăng nhập, kiểm tra xem có phiên local teacher không
        const local = localStorage.getItem(LOCAL_TEACHER_STORAGE_KEY);
        if (local) {
          try {
            setUser(JSON.parse(local));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User> => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Khi đăng nhập Google thành công, dọn dẹp session tạm
      localStorage.removeItem(LOCAL_TEACHER_STORAGE_KEY);
      setUser(result.user);
      setLoading(false);
      return result.user;
    } catch (error: any) {
      setLoading(false);
      console.error('Lỗi đăng nhập Google:', error);
      throw error;
    }
  };

  const loginAsTeacher = (profile?: { name?: string; email?: string; avatar?: string }): AppUser => {
    const teacherUser: AppUser = {
      uid: 'teacher_' + Date.now().toString(36),
      displayName: profile?.name?.trim() || 'Thầy/Cô Giáo viên Toán',
      email: profile?.email?.trim() || 'giaovien@toanthcs.edu.vn',
      photoURL: profile?.avatar || null,
      isLocalTeacher: true
    };
    try {
      localStorage.setItem(LOCAL_TEACHER_STORAGE_KEY, JSON.stringify(teacherUser));
    } catch (e) {
      console.warn('Không thể ghi phiên giáo viên vào localStorage:', e);
    }
    setUser(teacherUser);
    setLoading(false);
    return teacherUser;
  };

  const logout = async (): Promise<void> => {
    try {
      localStorage.removeItem(LOCAL_TEACHER_STORAGE_KEY);
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('Lỗi đăng xuất:', error);
      localStorage.removeItem(LOCAL_TEACHER_STORAGE_KEY);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        loginAsTeacher,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

