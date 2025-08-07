import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { convertGRID_GPS, getBaseDateTime, getShortTermForecast } from '../api/WeatherApi';
import AuthInput from '../component/AuthInput';
import Header from '../component/Header';

export default function ResultCloset() {
  const [nearestRec, setNearestRec] = useState(null);
  const [shortTermData, setShortTermData] = useState(null);
  const [inputTime, setInputTime] = useState(''); // 시간 입력 상태
  const user = auth.currentUser;

  // "오전 7시", "오후 7시", "7시" -> "0700", "1900", "0700" 변환 함수
  const parseKoreanHour = (input) => {
    // "오전" or "오후" + optional space + 숫자 + "시"
    const ampmMatch = input.match(/^(오전|오후)?\s*(\d{1,2})시$/);
    if (!ampmMatch) return null;

    let hour = Number(ampmMatch[2]);
    const ampm = ampmMatch[1];

    if (ampm === '오후' && hour < 12) hour += 12;
    if (ampm === '오전' && hour === 12) hour = 0; // 12시는 0시로 처리

    const hourStr = String(hour).padStart(2, '0');
    return hourStr + '00';
  };

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

  useEffect(() => {
    if (!nearestRec || !nearestRec.coordinates) return;

    const { lat, lng } = nearestRec.coordinates;
    const { nx, ny } = convertGRID_GPS(Number(lat), Number(lng));
    const { base_date, base_time } = getBaseDateTime();

    getShortTermForecast(nx, ny, base_date, base_time)
      .then(data => setShortTermData(data))
      .catch(err => console.error('단기예보 API 호출 실패:', err));
  }, [nearestRec]);

  // 오늘 날짜 문자열 (YYYYMMDD)
  const today = new Date();
  const yyyy = today.getFullYear().toString();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}${mm}${dd}`;

  // 입력값 변환
  const convertedTime = parseKoreanHour(inputTime);

  // 필터링
  const filteredTemps = shortTermData && convertedTime
    ? shortTermData.filter(
        item =>
          item.category === 'TMP' &&
          item.fcstDate === todayStr &&
          item.fcstTime === convertedTime
      )
    : [];

  if (!user) return <p>로그인 후 이용해주세요.</p>;
  if (!nearestRec) return <p>추천 문서가 없습니다.</p>;

  return (
    <div id='result_closet'>
      <h2>오늘과 가장 가까운 추천 문서</h2>
      <pre>{JSON.stringify(nearestRec, null, 2)}</pre>

      <h3>단기예보 데이터</h3>
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
            filteredTemps.map((temp) => (
              <div key={`${temp.fcstDate}-${temp.fcstTime}`}>
                {temp.fcstDate} {temp.fcstTime} 기온: {temp.fcstValue}°C
              </div>
            ))
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
