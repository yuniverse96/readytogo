import { Routes, Route, useNavigate } from 'react-router-dom';
import HomeMain from './HomeMain';
import Login from './Login';

function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h2>🏠 Home 페이지</h2>
      
      <button onClick={() => navigate('/login')}>로그인</button>

      <Routes>
        <Route path="/" element={<HomeMain />} />
        <Route path="login/*" element={<Login />} />
      </Routes>
    </div>
  );
}

export default Home;
