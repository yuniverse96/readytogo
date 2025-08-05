// hooks/useAutoLogout.js
import { useEffect, useContext } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../AuthContext';

const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24시간

export default function useAutoLogout() {
  const { user, setUser } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;

    const loginTime = localStorage.getItem('loginTime');
    const now = Date.now();

    if (loginTime && now - Number(loginTime) > MAX_SESSION_DURATION) {
      signOut(auth)
        .then(() => {
          console.log('24시간 지나서 자동 로그아웃');
          localStorage.removeItem('loginTime');
          setUser(null);
        })
        .catch((error) => {
          console.error('자동 로그아웃 실패:', error);
        });
    }
  }, [user]);
}
