import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState,useRef } from 'react';
import { gsap } from 'gsap';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, getFirestore, doc, getDoc } from "firebase/firestore";
import { AuthContext } from '../AuthContext';
import useUserId from '../hooks/useUserId';
import { useWeather } from '../hooks/useWeather';
import {useShortWeather} from '../hooks/useShortWeather';
import AuthInput from '../component/AuthInput';
import useSearchStore from '../store/useSearchStore';

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



  // const { weatherInfo, locationName,lastRefreshTime, isLoading, error, refetch } = useWeather(lat,lon); 
  // if (isLoading) return <div>날씨 불러오는 중...</div>;
  // if (error) return <div>날씨 에러 발생: {error.message}</div>;
  const { weatherInfo, locationName, lastRefreshTime, isLoading, error, refetch } = useShortWeather(lat, lon);

  const handleRefreshClick = () => {
    refetch(); // 데이터 재요청
  };


const handleSearchClick = async () => {
  if (!userId || !user?.uid) {
    alert("로그인 후 이용해주세요!");
    navigate('/login');
    return;
  }

  const db = getFirestore();
  const uid = user.uid;

  try {
    // recommendations 컬렉션에서 uid가 일치하는 문서 중 최신 날짜순 정렬
    const q = query(
      collection(db, "recommendations"),
      where("uid", "==", user.uid),
      orderBy("time", "desc"),  // 문서 안에 date 필드가 있어야 해 (예: 2025-08-06)
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const latestDoc = querySnapshot.docs[0];
      console.log("최신 문서 ID:", latestDoc.id);
      console.log("최신 문서 데이터:", latestDoc.data());

      navigate('/spotarea');
    } else {
      alert("아직 정보를 입력하지 않으셨어요! 정보를 먼저 입력해 주시면 도와드릴게요.");
      navigate('/recommend');
    }

  } catch (error) {
    alert("정보 조회 중 에러가 발생했습니다.");
    console.error("Firestore 문서 조회 에러:", error);
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
      case '매우 나쁨':
        return 'sobad';
      default:
        return ''; // 혹시 모를 예외
    }
  };


  return (
    <div id='home'>      
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

      <section className='weather_wrap'>
          <div className={`weather_big ${weatherInfo?.weatherColor || 'default'}`}>
            <div className='refresh' onClick={handleRefreshClick}>
              <p
                ref={firstRef}
                style={{ opacity: showFirst ? 1 : 0 }}
              >
                {locationName || "위치 정보 없음"}
              </p>
              <p
                ref={secondRef}
                style={{ opacity: showFirst ? 0 : 1 }}
              >
                {getTimeSinceRefresh(lastRefreshTime) || "최근 업데이트 없음"}
              </p>
            </div>

            <div className='icon_box'>
              {weatherInfo
                ? <IconWeather type={weatherInfo.weatherIcon} />
                : <div className="placeholder-icon"></div>}
            </div>

            <div className='info_box'>
              <h3>{weatherInfo?.T1H ? `${weatherInfo.T1H}°C` : "정보 없음"}</h3>
              <p className='weather_txt'>
                {weatherInfo
                  ? `${weatherInfo.weatherDescription}`
                  : "날씨 정보를 불러올 수 없습니다"}
              </p>
            </div>
          </div>

          <ul className='weather_condition'>
              <li className={`wind ${getStatusClass(weatherInfo?.windSpeedStatus)}`}>
                <p>바람 {weatherInfo?.windSpeedStatus || "보통"}</p>
              </li>
              <li className={`reh ${getStatusClass(weatherInfo?.humidityStatus)}`}>
                <p>습도 {weatherInfo?.humidityStatus || "보통"}</p>
              </li>
              <li className={`air ${getStatusClass(weatherInfo?.airQualityStatus)}`}>
                <p>대기질 {weatherInfo?.airQualityStatus || "보통"}</p>
              </li>
          </ul>
        {/* <div>강수상태: {weatherInfo?.RN1 || "정보 없음"}</div>
        <div>하늘상태: {weatherInfo?.SKY || "정보 없음"}</div>
        <div>icon명: {weatherInfo?.weatherIcon || "정보 없음"}</div> */}
      </section>
      <section className='recommend_wrap'>
      <div 
          className='recommend_today'  
          onClick={() => {
            if (!user) {
              alert("로그인 후 이용해주세요!");
              navigate('/login');
              return;
            }
            navigate('/result_closet');
          }}
        >
          <h3>오늘의<br/>추천 코디</h3>
          <span className='icon_wrap'></span>
        </div>
        <div 
            className='recommend_write' 
            onClick={() => {
              if (!user) {
                alert("로그인 후 이용해주세요!");
                navigate('/login');
                return;
              }
              navigate('/recommend');
            }}
          >
          <h3>오늘의<br/>체감 기록</h3>
          <span className='icon_wrap'></span>
        </div>
      </section>
      <section className='ad_zone'>
        <div className='ad_banner'>
          <img src={`${process.env.PUBLIC_URL}/images/musinsa_ad.png`} alt="ad" />
        </div>
      </section>
    </div>
  );
}

export default HomeMain;
