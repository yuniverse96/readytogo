import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import useUserId from '../hooks/useUserId';
import { convertGRID_GPS, getBaseDateTime, getShortTermForecast } from '../api/WeatherApi';
import '../style/resultCloset.css';

// 체질 보정값
const constitutionAdjust = {
  'SH': (temp) => temp + (temp - 24) * 0.2,
  'SH': (temp) => temp - (24 - temp) * 0.2,
  'NHC': (temp) => temp,
  'SHC': (temp) => temp + (temp - 24) * 0.2 - (24 - temp) * 0.2
};

// 옷 기준 보정값
const conditionAdjust = {
  'sohot': +3,
  'hot': +1.5,
  'normal': 0,
  'cold': -1.5,
  'socold': -3
};

// 체감온도 계산
function calcFeelTemp(realTemp, constitution, condition) {
  let feelTemp = realTemp + (conditionAdjust[condition] ?? 0);
  if (constitutionAdjust[constitution]) {
    feelTemp = constitutionAdjust[constitution](feelTemp);
  }
  return feelTemp;
}

// 체감온도에 따른 상태
function getTempStatus(feelTemp) {
  if (feelTemp >= 28) return '더울';
  if (feelTemp <= 20) return '추울';
  return '적당할';
}

// 체감온도 기반 옷 추천
function getClothesRecommendation(feelTemp) {
  if (feelTemp >= 28) return '반팔, 반바지, 린넨 셔츠';
  if (feelTemp >= 23) return '반팔, 얇은 셔츠, 슬랙스';
  if (feelTemp >= 20) return '긴팔 셔츠, 가디건, 면바지';
  if (feelTemp >= 17) return '가디건, 얇은 니트, 청바지';
  if (feelTemp >= 12) return '니트, 자켓, 코튼팬츠';
  if (feelTemp >= 6)  return '코트, 니트, 기모 바지';
  return '패딩, 두꺼운 코트, 목도리';
}

// 보간 함수
function interpolateTemperature(data, targetDate, targetTime) {
  const temps = data
    .filter(item => item.category === 'TMP' && item.fcstDate === targetDate)
    .sort((a, b) => Number(a.fcstTime) - Number(b.fcstTime));

  if (temps.length === 0) return null;

  const targetMinutes = Number(targetTime.slice(0, 2)) * 60 + Number(targetTime.slice(2));

  let before = null;
  let after = null;

  for (let i = 0; i < temps.length; i++) {
    const fcstMinutes = Number(temps[i].fcstTime.slice(0, 2)) * 60 + Number(temps[i].fcstTime.slice(2));
    if (fcstMinutes <= targetMinutes) before = temps[i];
    if (fcstMinutes >= targetMinutes) {
      after = temps[i];
      break;
    }
  }

  if (!before) return Number(after.fcstValue);
  if (!after) return Number(before.fcstValue);
  if (before.fcstTime === after.fcstTime) return Number(before.fcstValue);

  const beforeMinutes = Number(before.fcstTime.slice(0, 2)) * 60 + Number(before.fcstTime.slice(2));
  const afterMinutes = Number(after.fcstTime.slice(0, 2)) * 60 + Number(after.fcstTime.slice(2));
  const ratio = (targetMinutes - beforeMinutes) / (afterMinutes - beforeMinutes);

  return Number(before.fcstValue) + ratio * (Number(after.fcstValue) - Number(before.fcstValue));
}

export default function ResultCloset() {
  const [nearestRec, setNearestRec] = useState(null);
  const [shortTermData, setShortTermData] = useState(null);
  const user = auth.currentUser;
  const navigate = useNavigate();
  const userId = useUserId();
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

  // HHMM → "16:10"
  const formatMeetingTime = (timeStr) => {
    if (!timeStr || timeStr.length !== 4) return timeStr;
    const hour = timeStr.slice(0, 2);
    const min = timeStr.slice(2, 4);
    return `${hour}:${min}`;
  };

  // 날씨 데이터 가져오기
  useEffect(() => {
    if (!nearestRec?.coordinates) return;
    const { lat, lng } = nearestRec.coordinates;
    const { nx, ny } = convertGRID_GPS(Number(lat), Number(lng));
    const { base_date, base_time } = getBaseDateTime();

    getShortTermForecast(nx, ny, base_date, base_time)
      .then(data => {
        setShortTermData(data);
      })
      .catch(err => console.error('단기예보 API 호출 실패:', err));
  }, [nearestRec]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const interpolatedTemp = shortTermData
    ? interpolateTemperature(shortTermData, todayStr, nearestRec?.meetingTime || "0000")
    : null;

  return (
    <div id='result_closet'>
      <h2>오늘과 가장 가까운 기록 문서 {nearestRec?.date} 기준.</h2>
   
      <br/>
      <h3>단기예보 데이터</h3>
      <p> {nearestRec?.meetingPlace}에서 {nearestRec?.meetingTime ? formatMeetingTime(nearestRec.meetingTime) : '정보 없음'} 시에 만나기로 했어요</p>

      {interpolatedTemp !== null ? (
        (() => {
          const feelTemp = calcFeelTemp(interpolatedTemp, nearestRec.constitution, nearestRec.condition);
          const status = getTempStatus(feelTemp);
          const recommendation = getClothesRecommendation(feelTemp);

          return (
            <div>
              <div>그곳의 온도는 {interpolatedTemp.toFixed(1)}°C 이고 </div>
              <div>체감온도는 {feelTemp.toFixed(1)}°C 입니다. {userId}님께 {status}거예요. </div>
              <div>추천 옷차림으로는 {recommendation}가 있어요!</div>
            </div>
          );
        })()
      ) : (
        <p>해당 시간에 대한 기온 정보가 없습니다.</p>
      )}
    </div>
  );
}
