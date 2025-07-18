import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { useState, useContext } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import Join from './Join';
import AuthInput from '../component/AuthInput';
import '../style/login.css';

import { AuthContext } from '../AuthContext'; // 경로 조정

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const isRootLogin = location.pathname.endsWith('/login');

  const { setUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    userId: '',
    userPass: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const loginSubmit = async (e) => {
    e.preventDefault();
    const { userId, userPass } = formData;

    if (!userId || !userPass) {
      alert("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      const userDocRef = doc(db, 'userIds', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        alert('등록되지 않은 아이디입니다.');
        return;
      }

      const email = userDocSnap.data().email;

      const userCredential = await signInWithEmailAndPassword(auth, email, userPass);

      setUser(userCredential.user);

      navigate('/home');
    } catch (error) {
      console.error("로그인 실패:", error.code, error.message);
      let message = "로그인에 실패했습니다.";

      if (error.code === 'auth/wrong-password') {
        message = "비밀번호가 올바르지 않습니다.";
      } else if (error.code === 'auth/invalid-email') {
        message = "유효하지 않은 이메일 형식입니다.";
      }

      alert(message);
    }
  };

  return (
    <>
      {isRootLogin && (
        <div id='login'>
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
                <button className='btn_submit' type='submit'>로그인</button>
              </div>
            </form>

            <ul className='find_acc'>
              <li>
                <Link to="/find-id">아이디 찾기</Link>
              </li>
              <li className='line'></li>
              <li>
                <Link to="/find-password">비밀번호 찾기</Link>
              </li>
            </ul>
          </div>

          <div className='bottom_btn'>
            <p>계정이 아직 없으신가요?</p>
            <div id='btn_join'>
              <button onClick={() => navigate('join')}>회원가입</button>
            </div>
          </div>
        </div>
      )}

      <Routes>
        <Route path="join" element={<Join />} />
      </Routes>
    </>
  );
}

export default Login;
