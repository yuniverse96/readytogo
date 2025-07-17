import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

import Join from './Join';
import AuthInput from '../component/AuthInput';
import '../style/login.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

// 경로 끝이 /login 인 경우만 기본 로그인 영역 보임
const isRootLogin = location.pathname.endsWith('/login');

//로그인 폼 
const [formData, setFormData] = useState({
  userId: '',
  userPass: ''
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

  // 로그인 제출 핸들러
  const loginSubmit = async (e) => {
    e.preventDefault();
    const { userId, userPass } = formData;
  
    if (!userId || !userPass) {
      alert("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, userId, userPass);
      const user = userCredential.user;
      console.log("로그인 성공!", user);
      navigate('/home');
    } catch (error) {
      console.error("로그인 실패:", error.code, error.message);
      
      let message = "로그인에 실패했습니다.";
      if (error.code === 'auth/user-not-found') {
        message = "등록되지 않은 이메일입니다.";
      } else if (error.code === 'auth/wrong-password') {
        message = "비밀번호가 올바르지 않습니다.";
      } else if (error.code === 'auth/invalid-email') {
        message = "유효하지 않은 이메일 형식입니다.";
      }
  
      alert(message);
    }
  };
  




  return (
    < div id='login'>

      {isRootLogin && (
        <>
          <div className='top_logo'>
              <div className='img_wrap'>
                <img src={`${process.env.PUBLIC_URL}/images/login.png`} alt="logo" />
              </div>
          </div>
          <div className='login_form'>
            <form onSubmit={loginSubmit}>
              <AuthInput
              label="아이디"
              type="text"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              showLabel="inline"
              />

            <AuthInput
              label="패스워드"
              type="password"
              name="userPass"
              value={formData.userPass}
              onChange={handleChange}
              showLabel="inline"
              autoComplete="off"
              />

              <div id="btn_submit">
                <button className='btn_submit' type='submit'>로그인 하기</button>
              </div>
             
            </form>
          </div>

          <div className='bottom_btn'>
            <p>계정이 아직 없으신가요?</p>
            <div id='btn_join'>
              <button onClick={() => navigate('join')}>회원가입</button>
            </div>
          </div>
         
        </>
      )}

      <Routes>
        <Route path="join" element={<Join />} />
      </Routes>
    </div>
  );
}

export default Login;
