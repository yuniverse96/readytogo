import React, {  useRef, useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, where, orderBy, limit, getDocs, 
  doc, updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../AuthContext';
import KakaoMapSearch from '../component/KakaoMap';
import useSearchStore from '../store/useSearchStore';
import { gsap } from 'gsap';

import PopAlert,{useAlert} from '../component/PopAlert';

import '../style/recommend.css';

function SpotArea() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [docId, setDocId] = useState(null); // 최신 문서 ID 저장
  const [loading, setLoading] = useState(true);
  const [isPlaceSelected, setIsPlaceSelected] = useState(false);
  const setAddress = useSearchStore(state => state.setAddress);
  const [meetingTime, setMeetingTime] = useState('');
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');


  //현재 시간 반환
  const now = new Date();
  let currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // 현재 시각 이후의 시간만 선택
  if (currentMinute >= 50) {
    currentHour += 1; // 50분 이상이면 다음 시간부터
  }
  
  const hours = Array.from({ length: 24 - currentHour }, (_, i) => (currentHour + i).toString().padStart(2, '0'));
  
  // 분 배열
  const allMinutes = ['00', '10', '20', '30', '40', '50'];
  
  // 선택 가능한 분
  function getAvailableMinutes(hour) {
    if (parseInt(hour) === now.getHours()) {
      return allMinutes.filter(min => parseInt(min) > currentMinute);
    }
    return allMinutes;
  }
  

  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    setFormData(prev => ({
      ...prev,
      meetingTime: `${hour}:${selectedMinute || '00'}`,
    }));
  };
  
  const handleMinuteSelect = (minute) => {
    setSelectedMinute(minute);
    setFormData(prev => ({
      ...prev,
      meetingTime: `${selectedHour || '00'}${minute}`,
    }));
  };
  

  //커스텀 얼럿.
  const { showAlert } = useAlert();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // uid가 같은 문서 중 time 기준 최신 1개
        const q = query(
          collection(db, 'recommendations'),
          where('uid', '==', user.uid),
          orderBy('time', 'desc'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const latestDoc = querySnapshot.docs[0];
          setFormData(latestDoc.data());
          setDocId(latestDoc.id);
        } else {
          showAlert("이전 정보를 찾을 수 없습니다.", [
            { text: "입력하러 가기", onClick: () => navigate("/recommend") }
          ]);
        }
      } catch (error) {
        console.error('Firestore read error:', error);
        showAlert(`데이터를 불러오는데 실패했습니다: ${error.message}`, [
          { text: "확인",onClick: () => {}, className:"close"}
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (!user || loading) {
    return <div>로딩 중...</div>;
  }

  const handleCoordinateSelect = (lat, lng, placeName, selected) => {
    setFormData(prev => ({
      ...prev,
      coordinates: { lat, lng },
      meetingPlace: placeName,
      meetingTime: meetingTime,
    }));
    setIsPlaceSelected(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      showAlert("로그인 후 이용해주세요!", [
        { text: "로그인하러 가기", onClick: () => navigate("/login") },
        { text: "취소",onClick: () => {}, className:"close"}
      ]);
      return;
    }

    if (!docId) {
      showAlert('업데이트할 문서를 찾을 수 없습니다.', [
        { text: "확인",onClick: () => {}, className:"close"}
      ]);
      return;
    }

    try {
      await updateDoc(doc(db, 'recommendations', docId), {
        ...formData,
        uid: user.uid,
        email: user.email,
      });
      showAlert('제출 완료.', [
        { text: "확인",onClick: () => navigate("/result_closet")}
      ]);
      setAddress('');
      
      // 제출 후 초기화
      setFormData({
        meetingPlace: '',
        coordinates: { lat: null, lng: null },
        meetingTime: '',
      });
      setIsPlaceSelected(false);
    } catch (error) {
      console.error('제출 실패:', error);
      showAlert('제출 실패했습니다. 다시 시도해주세요.', [
        { text: "확인",onClick: () => {}, className:"close"}
      ]);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home'); // 기본 경로
    }
  };

  return (
    <div id="map">
      <div className="top_nav">
        <div className="btn_wrap prev_btn">
          <button onClick={handleGoBack}>이전</button>
        </div>
        <div className="btn_wrap go_home">
          <button type="button" onClick={() => navigate('/home')}>
            나가기
          </button>
        </div>
      </div>

      <div className='map_wrap'>
        <div className='top_title'>
          오늘 갈 곳은 어디인가요?
        </div>
        <form onSubmit={handleSubmit} id="recommendForm">
          <KakaoMapSearch onSelectCoordinate={handleCoordinateSelect} />

        <div className='time_picker'>
          <ul className="hour_list">
              {hours.map(h => (
                <li
                  key={h}
                  className={selectedHour === h ? 'selected' : ''}
                  onClick={() => handleHourSelect(h)}
                >
                  {h}시
                </li>
              ))}
          </ul>
          <ul className="minute_list">
            {getAvailableMinutes(selectedHour).map(m => (
              <li
                key={m}
                className={selectedMinute === m ? 'selected' : ''}
                onClick={() => handleMinuteSelect(m)}
              >
                {m}분
              </li>
            ))}
          </ul>
        </div>

          <div className='submit_btn'>
            <button type="submit" disabled={!isPlaceSelected}>추천받기</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SpotArea;
