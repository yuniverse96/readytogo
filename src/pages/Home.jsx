import { Routes, Route, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import HomeMain from './HomeMain';
import Login from './Login';
import { AuthContext } from '../AuthContext';

function Home() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext); // user, setUser 받아옴

  const handleButtonClick = () => {
    if (user) {
      // 로그아웃 처리: setUser(null) 해주고 firebase signOut 호출도 해야 함
      setUser(null);
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  return (
    <div>
    

      <Routes>
        <Route path="/" element={<HomeMain />} />
        <Route path="login/*" element={<Login />} />
      </Routes>
    </div>
  );
}

export default Home;
