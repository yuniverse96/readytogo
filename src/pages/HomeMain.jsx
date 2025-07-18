import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../AuthContext';
import useUserId from '../hooks/useUserId';

function HomeMain() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const userId = useUserId(); // 커스텀 훅 호출해서 userId 받아오기

  const handleButtonClick = async () => {
    if (user) {
      try {
        await signOut(auth);      // Firebase 로그아웃
        setUser(null);            // Context 상태 초기화
        navigate('/home');
      } catch (error) {
        console.error('로그아웃 실패:', error);
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div>
      <h2>홈페이지</h2>

      {user && userId && <p>{userId}님 반가워요</p>}

      <button onClick={handleButtonClick}>
        {user ? '로그아웃' : '로그인'}
      </button>
    </div>
  );
}

export default HomeMain;
