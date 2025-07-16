import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Join from './Join';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // 경로 끝이 /login 인 경우만 기본 로그인 영역 보임
  const isRootLogin = location.pathname.endsWith('/login');

  return (
    <>
      {isRootLogin && (
        <>
          <div className='login'>
            로그인 인풋영역
          </div>
          <button onClick={() => navigate('join')}>회원가입</button>
        </>
      )}

      <Routes>
        <Route path="join" element={<Join />} />
      </Routes>
    </>
  );
}

export default Login;
