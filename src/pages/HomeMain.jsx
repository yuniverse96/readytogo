import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../AuthContext';
import useUserId from '../hooks/useUserId';
import { useWeather } from '../hooks/useWeather';

function HomeMain() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const userId = useUserId();

  // ✅ 여기서 lat/lon 상태 만들어서 geolocation으로 설정
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLon(pos.coords.longitude);
        },
        (err) => {
          console.error('위치 정보 오류:', err);
        }
      );
    } else {
      console.error('이 브라우저는 위치 정보 기능을 지원하지 않음');
    }
  }, []);
  
  const { weatherInfo, isLoading, error } = useWeather(); 


  const handleButtonClick = async () => {
    if (user) {
      try {
        await signOut(auth);
        setUser(null);
        navigate('/home');
      } catch (error) {
        console.error('로그아웃 실패:', error);
      }
    } else {
      navigate('/login');
    }
  };

  if (isLoading) return <div>날씨 불러오는 중...</div>;
  if (error) return <div>날씨 에러 발생: {error.message}</div>;

  return (
    <div>
      <h2>홈페이지</h2>
      {user && userId && <p>{userId}님 반가워요</p>}

      <button onClick={handleButtonClick}>
        {user ? '로그아웃' : '로그인'}
      </button>

      <br /><br />

      {user && <button onClick={() => navigate('/recommend')}>추천받기</button>}

      {weatherInfo && (
        <div>
          <h2>날씨 정보</h2>
          <p>기온: {weatherInfo.TMP} °C</p>
          <p>습도: {weatherInfo.REH} % ({weatherInfo.humidityStatus})</p>
          <p>풍속: {weatherInfo.WSD} m/s ({weatherInfo.windSpeedStatus})</p>
          <p>대기질: {weatherInfo.PM10} ({weatherInfo.airQualityStatus})</p>
        </div>
      )}
    </div>
  );
}

export default HomeMain;
