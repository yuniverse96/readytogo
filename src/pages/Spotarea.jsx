import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, where, orderBy, limit, getDocs, 
  doc, updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../AuthContext';
import KakaoMapSearch from '../component/KakaoMap';
import useSearchStore from '../store/useSearchStore';
import '../style/recommend.css';

function SpotArea() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [docId, setDocId] = useState(null); // 최신 문서 ID 저장
  const [loading, setLoading] = useState(true);
  const [isPlaceSelected, setIsPlaceSelected] = useState(false);
  const setAddress = useSearchStore(state => state.setAddress);

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
          alert('이전 정보를 찾을 수 없습니다.');
          navigate('/recommend');
        }
      } catch (error) {
        console.error('Firestore read error:', error);
        alert(`데이터를 불러오는데 실패했습니다: ${error.message}`);
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
    }));
    setIsPlaceSelected(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('로그인 후 이용해주세요.');
      return;
    }

    if (!docId) {
      alert('업데이트할 문서를 찾을 수 없습니다.');
      return;
    }

    try {
      await updateDoc(doc(db, 'recommendations', docId), {
        ...formData,
        uid: user.uid,
        email: user.email,
      });
      alert('제출 완료!');
      setAddress('');
      navigate('/result_closet');

      // 제출 후 초기화
      setFormData({
        meetingPlace: '',
        coordinates: { lat: null, lng: null },
      });
      setIsPlaceSelected(false);
    } catch (error) {
      console.error('제출 실패:', error);
      alert('제출 실패했습니다. 다시 시도해주세요.');
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
          <div className='submit_btn'>
            <button type="submit" disabled={!isPlaceSelected}>추천받기</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SpotArea;
