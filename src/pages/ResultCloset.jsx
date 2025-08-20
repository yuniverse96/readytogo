import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSearchStore from '../store/useSearchStore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import useUserId from '../hooks/useUserId';
import { useWeather } from '../hooks/useWeather';
import IconWeather from '../component/IconWeather';
import HourlyWeather from '../component/HourlyWeather';
import Loading from '../component/Loading';
import '../style/resultCloset.css';

export default function ResultCloset() {
  const [nearestRec, setNearestRec] = useState(null);
  const [shortTermData, setShortTermData] = useState(null);
  
  const { mode } = useParams(); // 'recommend' | 'current'

  const user = auth.currentUser;
  const navigate = useNavigate();
  const userId = useUserId();

  //가장 가까운 추천 문서 가져오기
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

  //파라미터 recommend일때 meetingTime 없으면 /spotarea로 이동
  useEffect(() => {
    if (mode === 'recommend') {
      if (nearestRec && !nearestRec.meetingTime) {
        navigate('/spotarea');
      }
    }
  }, [mode, nearestRec, navigate]);

  //currunt일때 정보 가져오기.
  const { currentPosition } = useSearchStore();
  const currentLat = currentPosition.lat;
  const currentLng = currentPosition.lon;


  //recommend냐 currunt냐에 따라 정보 제공 수정.
  const lat = mode === 'recommend' ? nearestRec?.coordinates?.lat : currentLat;
  const lng = mode === 'recommend' ? nearestRec?.coordinates?.lng : currentLng;
  const meetingTime = mode === 'recommend'
  ? nearestRec?.meetingTime
  : `${String(new Date().getHours()).padStart(2,'0')}${String(new Date().getMinutes()).padStart(2,'0')}`;


  // useWeather 훅 사용
  const { recommendInfo, locationName, estimatedFeelLevel, isLoading } = useWeather(
    lat,
    lng,
    meetingTime,
    nearestRec?.constitution,
    nearestRec?.condition,
    nearestRec?.uid
  );

  const FEEL_LEVEL_TEXT = {
    socold: '매우 추운',
    cold: '추운',
    normal: '보통인',
    hot: '더운',
    sohot: '매우 더운'
  };
  const feelText = FEEL_LEVEL_TEXT[estimatedFeelLevel] || '--';


  const formatTime = (timeStr) => {
    if (!timeStr || timeStr.length !== 4) return timeStr;
    return `${timeStr.slice(0,2)}:${timeStr.slice(2,4)}`;
  };
  if (isLoading || !recommendInfo) return <Loading />;
  return (
    <div id="result_closet">
      <section className="recommend_wrap">
        <div className="title">
          <h2><b>오늘의</b> 추천코디</h2>
          {mode == 'currunt' && (
            <p className='area'>{locationName}</p>
          )}
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
              {mode === 'recommend' && (
                <>
                 <b>{nearestRec?.meetingTime ? formatTime(nearestRec.meetingTime) : '--'}</b>시
                </>
              )}
             
                {mode === 'recommend' && (
                  <>
                    <b>{nearestRec?.meetingPlace}</b>에는
                  </>
                )}
                {mode === 'currunt' && (
                  <>
                   <b>{locationName}</b>에 계시는군요
                  </>
                )}
              <br/>
              <b>{recommendInfo.recommendation}</b> 가 적당해요!
          </p>    
          <p className='notice'> 체감온도는 <b>{recommendInfo.feelTemp.toFixed(1)}°C</b> 입니다. <br/>{userId}님에게 <b className={estimatedFeelLevel}>{feelText}</b> 온도에요.</p>
        </div>
      </section>

      <section className='hourly_data'>
        <HourlyWeather lat={lat} lng={lng} meetingTime={meetingTime} />
      </section>
    </div>
  );
}
