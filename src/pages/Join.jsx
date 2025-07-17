import { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import AuthInput from '../component/AuthInput';

function Join() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });

  const [isIdChecked, setIsIdChecked] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'userId') setIsIdChecked(false);
  };

  // 아이디 중복확인
  const checkDuplicateId = async () => {
    const userId = formData.userId.trim();
    if (!userId) {
      alert('아이디를 입력해주세요.');
      return;
    }

    try {
      const userDocRef = doc(db, 'userIds', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        alert('이미 사용 중인 아이디입니다.');
        setIsIdChecked(false);
      } else {
        alert('사용 가능한 아이디입니다.');
        setIsIdChecked(true);
      }
    } catch (error) {
      console.error('중복 확인 실패:', error);
      alert('중복 확인 중 오류가 발생했습니다.');
      setIsIdChecked(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { userId, email, password, passwordConfirm } = formData;

    if (!userId || !email || !password || !passwordConfirm) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    if (!isIdChecked) {
      alert('아이디 중복확인을 해주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      // 회원가입 시도
      await createUserWithEmailAndPassword(auth, email, password);

      // Firestore에 아이디-이메일 매핑 저장
      const userDocRef = doc(db, 'userIds', userId);
      await setDoc(userDocRef, { email });

      alert('회원가입 성공! 로그인 페이지로 이동합니다.');
      navigate('/readytogo/login');
    } catch (error) {
      console.error('회원가입 실패:', error);

      if (error.code === 'auth/email-already-in-use') {
        alert('이미 가입된 이메일입니다.');
      } else {
        alert('회원가입 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div id="join">
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AuthInput
            label="아이디"
            type="text"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            showLabel="inline"
            placeholder="아이디를 입력하세요"
          />
          <button type="button" onClick={checkDuplicateId} style={{ height: '30px' }}>
            중복확인
          </button>
        </div>

        <AuthInput
          label="이메일"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          showLabel="inline"
          placeholder="이메일을 입력하세요"
        />
        <AuthInput
          label="비밀번호"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          showLabel="inline"
          autoComplete="new-password"
          placeholder="비밀번호를 입력하세요"
        />
        <AuthInput
          label="비밀번호 확인"
          type="password"
          name="passwordConfirm"
          value={formData.passwordConfirm}
          onChange={handleChange}
          showLabel="inline"
          autoComplete="new-password"
          placeholder="비밀번호를 다시 입력하세요"
        />

        <div id="btn_submit">
          <button type="submit" className="btn_submit">가입하기</button>
        </div>
      </form>
    </div>
  );
}

export default Join;
