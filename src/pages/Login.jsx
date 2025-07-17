import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
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
  userMail: '',
  userPass: ''
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

const loginSubmit = (e) => {
  e.preventDefault();
  console.log(formData);
}

  return (
    < div id='login'>
      {isRootLogin && (
        <>
          <div className='login_form'>
            <form onSubmit={loginSubmit}>
              <AuthInput
              label="이메일"
              type="email"
              name="userMail"
              value={formData.userMail}
              onChange={handleChange}
              />

            <AuthInput
              label="패스워드"
              type="password"
              name="userPass"
              value={formData.userPass}
              onChange={handleChange}
              />
              <div id="btn_submit">
                <button className='btn_submit' type='submit'>로그인 하기</button>
              </div>
             
            </form>
          </div>
          <div id='btn_join'>
            <button onClick={() => navigate('join')}>회원가입</button>
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
