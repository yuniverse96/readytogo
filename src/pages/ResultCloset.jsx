import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { convertGRID_GPS, getBaseDateTime, getShortTermForecast } from '../api/WeatherApi';
import AuthInput from '../component/AuthInput';
import Header from '../component/Header';
import '../style/resultCloset.css'

// 체질 보정값
const constitutionAdjust = {
  '더위 많이 탐': (temp) => temp + (temp - 24) * 0.2,
  '추위 많이 탐': (temp) => temp - (24 - temp) * 0.2,
  '보통': (temp) => temp,
  '둘 다 많이 탐': (temp) => temp + (temp - 24) * 0.2 - (24 - temp) * 0.2
};

// 옷 기준 보정값
const conditionAdjust = {
  '완전더움': +3,
  '더움': +1.5,
  '보통': 0,
  '추움': -1.5,
  '완전추움': -3
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
  if (feelTemp >= 28) return '덥다';
  if (feelTemp <= 20) return '춥다';
  return '적당하다';
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

export default function ResultCloset() {
  const [nearestRec, setNearestRec] = useState(null);
  const [shortTermData, setShortTermData] = useState(null);
  const [inputTime, setInputTime] = useState('');
  const user = auth.currentUser;

  // 시간 문자열 → 24시 기반 변환
  const parseKoreanHour = (input) => {
    const ampmMatch = input.match(/^(오전|오후)?\s*(\d{1,2})시$/);
    if (!ampmMatch) return null;
    let hour = Number(ampmMatch[2]);
    const ampm = ampmMatch[1];
    if (ampm === '오후' && hour < 12) hour += 12;
    if (ampm === '오전' && hour === 12) hour = 0;
    return String(hour).padStart(2, '0') + '00';
  };

  // 가장 가까운 추천 문서 가져오기
  useEffect(() => {
    if (!user) return;
    const fetchNearestRecommendation = async () => {
      try {
        const q = query(
          collection(db, 'recommendations'),
          where('uid', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setNearestRec(null);
          return;
        }

        const today = new Date();
        const todayNum = Number(
          `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
        );
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

  // 날씨 데이터 가져오기
  useEffect(() => {
    if (!nearestRec?.coordinates) return;
    const { lat, lng } = nearestRec.coordinates;
    const { nx, ny } = convertGRID_GPS(Number(lat), Number(lng));
    const { base_date, base_time } = getBaseDateTime();
    getShortTermForecast(nx, ny, base_date, base_time)
      .then(data => setShortTermData(data))
      .catch(err => console.error('단기예보 API 호출 실패:', err));
  }, [nearestRec]);

  // 오늘 날짜
  const today = new Date();
  const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  // 입력 시간 변환
  const convertedTime = parseKoreanHour(inputTime);

  // 해당 시간 기온 필터링
  const filteredTemps = shortTermData && convertedTime
    ? shortTermData.filter(
        item => item.category === 'TMP' && item.fcstDate === todayStr && item.fcstTime === convertedTime
      )
    : [];

  if (!user) return <p>로그인 후 이용해주세요.</p>;
  if (!nearestRec) return <p>추천 문서가 없습니다.</p>;

  return (
    <div id='result_closet'>
      <h2>오늘과 가장 가까운 기록 문서 기준.</h2>
      {/* <pre>{JSON.stringify(nearestRec, null, 2)}</pre> */}
      <br/>
      <h3>단기예보 데이터</h3>
      <p>과거의 시간은 입력 불가합니다.</p>
      {shortTermData ? (
        <>
          <AuthInput
            type="text"
            name="meetingTime"
            value={inputTime}
            onChange={(e) => setInputTime(e.target.value)}
            placeholder="시간 입력 (예: 15시, 오전 7시, 오후 7시)"
            maxLength={7}
            showLabel="top"
            style={{ padding: 8, fontSize: 16, marginBottom: 12 }}
          />

          {filteredTemps.length > 0 ? (
            filteredTemps.map((temp) => {
              const feelTemp = calcFeelTemp(
                Number(temp.fcstValue),
                nearestRec.constitution,
                nearestRec.condition
              );
              const status = getTempStatus(feelTemp);
              const recommendation = getClothesRecommendation(feelTemp);

              return (
                <div key={`${temp.fcstDate}-${temp.fcstTime}`} style={{ marginBottom: '12px' }}>
                  <div>예보 기온: {temp.fcstValue}°C</div>
                  <div>체감온도: {feelTemp.toFixed(1)}°C → {status}</div>
                  <div>추천 옷차림: {recommendation}</div>
                </div>
              );
            })
          ) : (
            <p>해당 시간에 대한 기온 정보가 없습니다.</p>
          )}
        </>
      ) : (
        <p>단기예보를 불러오는 중입니다...</p>
      )}
    </div>
  );
}
