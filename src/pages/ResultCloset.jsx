import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import useUserId from '../hooks/useUserId';
import { convertGRID_GPS, getBaseDateTime, getShortTermForecast } from '../api/WeatherApi';
import { useWeather } from '../hooks/useWeather';
import IconWeather from '../component/IconWeather';
import '../style/resultCloset.css';



export default function ResultCloset() {
  const [nearestRec, setNearestRec] = useState(null);
  const [shortTermData, setShortTermData] = useState(null);
  const user = auth.currentUser;
  const navigate = useNavigate();
  const userId = useUserId();
  // console.log(`오늘과 가장 가까운 기록 문서 ${nearestRec?.date} 기준.`);
  // 가장 가까운 추천 문서 가져오기
  useEffect(() => {
    if (!user) return;
    const fetchNearestRecommendation = async () => {
      try {
        const q = query(collection(db, 'recommendations'), where('uid', '==', user.uid));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setNearestRec(null);
          return;
        }

        const today = new Date();
        const todayNum = Number(`${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`);
        const diff = (dateStr) => Math.abs(Number(dateStr.replace(/-/g, '')) - todayNum);

        let closestDoc = null;
        let minDiff = Infinity;
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.date) {
            const currentDiff = diff(data.date);
         
            if (currentDiff < minDiff) {
              minDiff = currentDiff;
              closestDoc = { id: doc.id, ...data };
            }
          }
        });
        
        setNearestRec(closestDoc);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };
    fetchNearestRecommendation();
  }, [user]);

  // meetingTime 없으면 /spotarea로 이동
  useEffect(() => {
    if (nearestRec && !nearestRec.meetingTime) {
      navigate('/spotarea');
    }
  }, [nearestRec, navigate]);

  // useWeather 훅 사용
  const { recommendInfo, locationName, estimatedFeelLevel, isLoading } = useWeather(
    nearestRec?.coordinates?.lat,
    nearestRec?.coordinates?.lng,
    nearestRec?.meetingTime,
    nearestRec?.constitution,
    nearestRec?.condition,
    nearestRec?.uid
  );

  // HHMM → "16:10"
  const formatMeetingTime = (timeStr) => {
    if (!timeStr || timeStr.length !== 4) return timeStr;
    const hour = timeStr.slice(0, 2);
    const min = timeStr.slice(2, 4);
    return `${hour}:${min}`;
  };

  const FEEL_LEVEL_TEXT = {
    socold: '완전 추울',
    cold: '추울',
    normal: '보통일',
    hot: '더울',
    sohot: '완전 더울'
  };
  const feelText = FEEL_LEVEL_TEXT[estimatedFeelLevel] || '정보 없음';


  const formatTime = (timeStr) => {
    if (!timeStr || timeStr.length !== 4) return timeStr;
    return `${timeStr.slice(0,2)}:${timeStr.slice(2,4)}`;
  };
  if (isLoading || !recommendInfo) return <div id='loading_wrap'><span className='loading_icon'></span></div>;
  return (
    <div id="result_closet">
      <section className="recommend_wrap">
        <div className="title">
          <h2><b>오늘의</b> 추천코디</h2>
          <p className='area'>{locationName}</p>
        </div>
        <div className="recommend_box">

  {/* 상위 날씨 정보 */}
          <div className='weather_box'>
            <div className='temp'>
              <div className='icon'>
                 <IconWeather type={recommendInfo?.weatherIcon}  />
              </div>
              <p>{recommendInfo.TMP}°C</p>
            </div>
            {recommendInfo.minTemp && recommendInfo.maxTemp && (
              <ul className='rh_temp'>
                <li><span>▲</span> 최고 {recommendInfo.maxTemp}°</li>
                <li><span>▼</span> 최저 {recommendInfo.minTemp}°</li>
              </ul>
            )}
          </div>
          
  {/* 의류추천 아이콘 */}
          <div className='closet_icon'>
            <img src={`${process.env.PUBLIC_URL}/images/${estimatedFeelLevel}.png`} alt={`${estimatedFeelLevel}`} />
          </div>
          <p className='recommend_txt'>
              오늘 <b>{nearestRec?.meetingTime ? formatTime(nearestRec.meetingTime) : '--'}</b>시 <b>{nearestRec?.meetingPlace}</b>에 방문할 예정이시군요? <br/>
              <b>{recommendInfo.recommendation}</b> 가 적당해요!
          </p>    
          <p className='notice'> 체감온도는 <b>{recommendInfo.feelTemp.toFixed(1)}°C</b> 입니다. {userId}님께 <b className={estimatedFeelLevel}>{feelText}</b>거예요.</p>
        </div>
      </section>
    </div>
  );
}
