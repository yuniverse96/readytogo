import { createContext, useState, useEffect } from 'react';
import { auth } from './firebase'; // 네 파이어베이스 초기화 파일 경로 맞게 변경
import { onAuthStateChanged } from 'firebase/auth';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Firebase Auth 로그인 상태 변화 감지
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // 로그인 시 유저 정보, 로그아웃 시 null
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
