import { useState, useEffect } from 'react';
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

  const [formError, setFormError] = useState({
    userId: { msg: '', type: '' },
    email: { msg: '', type: '' },
    password: { msg: '', type: '' },
    passwordConfirm: { msg: '', type: '' }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    setFormError(prev => ({
      ...prev,
      [name]: { msg: '', type: '' }
    }));

    if (name === 'userId') setIsIdChecked(false);
  };

  // 비밀번호 디바운스 검사
  useEffect(() => {
    const timer = setTimeout(() => {
      const password = formData.password;

      if (!password) {
        setFormError(prev => ({
          ...prev,
          password: { msg: '', type: '' }
        }));
        return;
      }

      const isValid = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,12}$/.test(password);

      setFormError(prev => ({
        ...prev,
        password: {
          msg: isValid
            ? '사용 가능한 비밀번호입니다.'
            : '영문 숫자를 포함한 4자~12자여야 합니다.',
          type: isValid ? 'success' : 'error'
        }
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.password]);

  // 비밀번호 확인 디바운스 검사
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!formData.passwordConfirm) {
        setFormError(prev => ({
          ...prev,
          passwordConfirm: { msg: '', type: '' }
        }));
        return;
      }

      const isMatch = formData.password === formData.passwordConfirm;

      setFormError(prev => ({
        ...prev,
        passwordConfirm: {
          msg: isMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.',
          type: isMatch ? 'success' : 'error'
        }
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.passwordConfirm, formData.password]);

  //비밀번호 확인
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const checkDuplicateId = async () => {
    const userId = formData.userId.trim();

    if (!userId) {
      setFormError(prev => ({
        ...prev,
        userId: { msg: '아이디를 입력해주세요.', type: 'error' }
      }));
      return;
    }

    try {
      const userDocRef = doc(db, 'userIds', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setFormError(prev => ({
          ...prev,
          userId: { msg: '이미 사용 중인 아이디입니다.', type: 'error' }
        }));
        setIsIdChecked(false);
      } else {
        setFormError(prev => ({
          ...prev,
          userId: { msg: '사용 가능한 아이디입니다.', type: 'success' }
        }));
        setIsIdChecked(true);
      }
    } catch (error) {
      setFormError(prev => ({
        ...prev,
        userId: { msg: '중복 확인 중 오류가 발생했습니다.', type: 'error' }
      }));
      setIsIdChecked(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { userId, email, password, passwordConfirm } = formData;

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{4,12}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const errors = {
      userId: { msg: '', type: '' },
      email: { msg: '', type: '' },
      password: { msg: '', type: '' },
      passwordConfirm: { msg: '', type: '' }
    };

    let hasError = false;

    if (!userId) {
      errors.userId = { msg: '아이디를 입력해주세요.', type: 'error' };
      hasError = true;
    } else if (!isIdChecked) {
      errors.userId = { msg: '아이디 중복확인을 해주세요.', type: 'error' };
      hasError = true;
    }

    if (!email) {
      errors.email = { msg: '이메일을 입력해주세요.', type: 'error' };
      hasError = true;
    } else if (!emailRegex.test(email)) {
      errors.email = { msg: '올바른 이메일 형식을 입력하세요.', type: 'error' };
      hasError = true;
    }

    if (!password) {
      errors.password = { msg: '비밀번호를 입력해주세요.', type: 'error' };
      hasError = true;
    } else if (!passwordRegex.test(password)) {
      errors.password = { msg: '영문 숫자를 포함한 4자~12자여야 합니다.', type: 'error' };
      hasError = true;
    }

    if (!passwordConfirm) {
      errors.passwordConfirm = { msg: '비밀번호 확인을 입력해주세요.', type: 'error' };
      hasError = true;
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = { msg: '비밀번호가 일치하지 않습니다.', type: 'error' };
      hasError = true;
    }

    if (hasError) {
      setFormError(errors);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);

      const userDocRef = doc(db, 'userIds', userId);
      await setDoc(userDocRef, { email });

      alert('회원가입 성공! 로그인 페이지로 이동합니다.');
      navigate('/readytogo/login');
    } catch (error) {
      console.error('회원가입 실패:', error);
      if (error.code === 'auth/email-already-in-use') {
        setFormError(prev => ({
          ...prev,
          email: { msg: '이미 가입된 이메일입니다.', type: 'error' }
        }));
      } else {
        alert('회원가입 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div id="join">
        <div className='top_img'>
            <div className='img_wrap'>
            <img src={`${process.env.PUBLIC_URL}/images/join_top.png`} alt="logo" />
            </div>
        </div>
        <form onSubmit={handleSubmit}>
            <AuthInput
            label="아이디"
            type="text"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            showLabel="top"
            placeholder="아이디를 입력하세요"
            showBtn="check"
            onButtonClick={checkDuplicateId}
            btnText="중복확인"
            msg={formError.userId.msg}
            msgType={formError.userId.type}
            />
            <AuthInput
            label="이메일"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            showLabel="top"
            placeholder="이메일을 입력하세요"
            msg={formError.email.msg}
            msgType={formError.email.type}
            />
            <AuthInput
            label="비밀번호"
            type={showPassword ? 'text':'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            showLabel="top"
            placeholder="비밀번호는 8자리 이상 입력하세요"
            showBtn={`show${showPassword ? ' on' : ''}`}
            onButtonClick={togglePassword}
            btnText=""
            msg={formError.password.msg}
            msgType={formError.password.type}
            />
            <AuthInput
            label="비밀번호 확인"
            type={showPassword ? 'text':'password'}
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            showLabel="top"
            placeholder="비밀번호를 다시 입력하세요"
            showBtn="show"
            onButtonClick={togglePassword}
            btnText=""
            msg={formError.passwordConfirm.msg}
            msgType={formError.passwordConfirm.type}
            />
            <div id="btn_submit">
            <button type="submit" className="btn_submit">회원가입</button>
            </div>
        </form>
    </div>
  );
}

export default Join;
