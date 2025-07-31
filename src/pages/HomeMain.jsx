import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState,useRef } from 'react';
import { gsap } from 'gsap';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { AuthContext } from '../AuthContext';
import useUserId from '../hooks/useUserId';
import { useWeather } from '../hooks/useWeather';
import AuthInput from '../component/AuthInput';
import useSearchStore from '../store/useSearchStore';
import Header from '../component/Header';
import IconWeather from '../component/IconWeather';

import '../style/home.css'

function HomeMain() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const userId = useUserId();

  const address = useSearchStore(state => state.address);
  const setAddress = useSearchStore(state => state.setAddress);

  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);

  //애니메이션 이펙트용
  const [showFirst, setShowFirst] = useState(true);
  const firstRef = useRef(null);
  const secondRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // 텍스트 교체 애니메이션
      const tl = gsap.timeline({
        onComplete: () => setShowFirst(prev => !prev),
      });

      if (showFirst) {
        tl.to(firstRef.current, { opacity: 0, y: -10, duration: 0.5 })
          .to(secondRef.current, { opacity: 1, y: 0, duration: 0.5 }, ">"); 
      } else {
        tl.to(secondRef.current, { opacity: 0, y: -10, duration: 0.5 })
          .to(firstRef.current, { opacity: 1, y: 0, duration: 0.5 }, ">"); 
      }
    }, 3000); // 3초마다 전환

    return () => clearInterval(interval);
  }, [showFirst]);

  

  // 위치 요청 함수 분리
  const fetchCurrentPosition = () => {
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
  };

  useEffect(() => {
    fetchCurrentPosition();
  }, []);



  const { weatherInfo, locationName,lastRefreshTime, isLoading, error, refetch } = useWeather(lat,lon); 
  // if (isLoading) return <div>날씨 불러오는 중...</div>;
  // if (error) return <div>날씨 에러 발생: {error.message}</div>;

  const handleRefreshClick = () => {
    refetch(); // 데이터 재요청
  };

  const handleSearchClick = async () => {
    if (!userId) {
      // userId가 없으면 바로 recommend로 보내거나, 로그인 필요 알림 가능
      alert("로그인 후 이용가능합니다")
      navigate('/login');
      return;
    }
    
    const db = getFirestore();
    const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    const docId = `${userId}${today}`;
    const docRef = doc(db, "recommend", docId);

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        navigate('/spotarea');
      } else {
        alert("아직 정보를 입력하지 않으셨어요! 정보를 먼저 입력해 주시면 도와드릴게요.")
        navigate('/recommend');
      }
    } catch (error) {
      console.error("파이어베이스 문서 조회 실패:", error);
      // 실패했을때 강제로 추천하기로 이동.
      navigate('/recommend');
    }
  };

  //업데이트 상태
  const getTimeSinceRefresh = (time) => {
    if (!time) return '';
  
    const date = new Date(time);
  
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
  
    // 12시간 형식으로 변환
    const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
    return `업데이트 ${formattedHour}:${formattedMinutes} ${ampm}`;
  
  };

  //환경 상태
  const getStatusClass = (status) => {
    switch (status) {
      case '좋음':
        return 'good';
      case '보통':
        return 'soso';
      case '나쁨':
        return 'bad';
      default:
        return ''; // 혹시 모를 예외
    }
  };

  return (
    
    <div id='home'>
         <Header />
        
       <section className='top_area'>
       {(user && userId) ? (
          <h2><b>{userId}</b>님, 안녕하세요!</h2>
        ) : (
          <h2><b>방문자</b>님, 안녕하세요!</h2>
        )}
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
             <section className='weather_wrap'>
             <div className='weather_big'>
               <div className='refresh' onClick={handleRefreshClick} >
                    <p
                      ref={firstRef}
                      style={{
                        opacity: showFirst ? 1 : 0,
                       }}
                    >
                      {locationName}
                    </p>
                    <p
                      ref={secondRef}
                      style={{
                        opacity: showFirst ? 0 : 1,
                        y:0
                      }}
                    >
                      {getTimeSinceRefresh(lastRefreshTime)}
                    </p>
               </div>

               <div className='icon_box'>
                 {/* type에 날씨정보가 들어가면 알맞에 아이콘이 변경됨. 현재 임시 sunny*/}
                 <IconWeather type="sunny"></IconWeather>
               </div>
               <h3>{weatherInfo.TMP}°C</h3>
               <p className='weather_txt'>{weatherInfo?.tempComparisonMsg}</p>
             </div>
             <ul className='weather_condition'>
               <li className={`wind ${getStatusClass(weatherInfo.windSpeedStatus)}`}><p>바람 {weatherInfo.windSpeedStatus}</p></li>
               <li className={`reh ${getStatusClass(weatherInfo.humidityStatus)}`}><p>습도 {weatherInfo.humidityStatus}</p></li>
               <li className={`air ${getStatusClass(weatherInfo.airQualityStatus)}`}><p>대기질 {weatherInfo.airQualityStatus}</p></li>
             </ul>

              <div>강수상태: {weatherInfo.PTY}</div>
              <div>하늘상태: {weatherInfo.SKY}</div>
              <div>작동명: {weatherInfo.weatherIcon}</div>

           </section>
      )}



         
     
      {user && <button type='button' className='go_recommend' onClick={() => navigate('/recommend')}>추천받기</button>}
    </div>
  );
}

export default HomeMain;
