import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../AuthContext';
import useUserId from '../hooks/useUserId';
import { useWeather } from '../hooks/useWeather';
import AuthInput from '../component/AuthInput';
import useSearchStore from '../store/useSearchStore';
import Header from '../component/Header';

import '../style/home.css'

function HomeMain() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const userId = useUserId();

  const address = useSearchStore(state => state.address);
  const setAddress = useSearchStore(state => state.setAddress);

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
  if (isLoading) return <div>날씨 불러오는 중...</div>;
  if (error) return <div>날씨 에러 발생: {error.message}</div>;

  const handleSearchClick = () => {
    // 필요하면 여기서 searchAddress 유효성 검사 가능
    navigate('/spotarea');
  };

  return (
    <div id='home'>
         <Header />
      <section className='top_area'>
        {user && userId &&  <h2><b>{userId}</b>님, 안녕하세요!</h2>}
        <AuthInput
          label=""
          type="text"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          showLabel="search_input"
          placeholder="오늘 어디가세요?"
          showBtn="search"
          btnText="검색"
          onButtonClick={handleSearchClick}
        />
      </section>

      {weatherInfo && (
        <div>
          <h2>날씨 정보</h2>
          <p>기온: {weatherInfo.TMP} °C</p>
          <p>습도: {weatherInfo.REH} % ({weatherInfo.humidityStatus})</p>
          <p>풍속: {weatherInfo.WSD} m/s ({weatherInfo.windSpeedStatus})</p>
          <p>대기질: {weatherInfo.PM10} ({weatherInfo.airQualityStatus})</p>
        </div>
      )}

      {user && <button type='button' className='go_recommend' onClick={() => navigate('/recommend')}>추천받기</button>}
    </div>
  );
}

export default HomeMain;
