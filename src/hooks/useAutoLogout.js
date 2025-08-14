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

    // 로그인 시점 기록이 없으면 지금 시간으로 설정
    if (!localStorage.getItem('loginTime')) {
      localStorage.setItem('loginTime', Date.now());
    }

    const loginTime = Number(localStorage.getItem('loginTime'));
    const now = Date.now();
    const remainingTime = MAX_SESSION_DURATION - (now - loginTime);

    if (remainingTime <= 0) {
      // 이미 24시간 지났으면 바로 로그아웃
      signOut(auth)
        .then(() => {
          console.log('24시간 지나서 자동 로그아웃');
          localStorage.removeItem('loginTime');
          setUser(null);
        })
        .catch((error) => console.error('자동 로그아웃 실패:', error));
      return;
    }

    // 남은 시간만큼 타임아웃 설정
    const timeoutId = setTimeout(() => {
      signOut(auth)
        .then(() => {
          console.log('24시간 지나서 자동 로그아웃');
          localStorage.removeItem('loginTime');
          setUser(null);
        })
        .catch((error) => console.error('자동 로그아웃 실패:', error));
    }, remainingTime);

    // cleanup
    return () => clearTimeout(timeoutId);
  }, [user, setUser]);
}
