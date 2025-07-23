

import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../AuthContext';
import KakaoMapSearch from '../component/KakaoMap';
import '../style/recommend.css';

function SpotArea() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
  
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaceSelected, setIsPlaceSelected] = useState(false);
  
    useEffect(() => {
      const fetchData = async () => {
        if (!user) return; // user 없으면 fetch 중단
  
        setLoading(true);
        const dateStr = new Date().toISOString().slice(0, 10);
        const docId = `${user.uid}_${dateStr}`;
        const docRef = doc(db, 'recommendations', docId);
  
        try {
          const docSnap = await getDoc(docRef);
  
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("SpotArea loaded:", data);
            setFormData(data);
          } else {
            alert("이전 정보를 찾을 수 없습니다.");
            navigate('/recommend');
          }
        } catch (error) {
          console.error("Firestore read error:", error);
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
      setFormData((prev) => ({
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
  
      const dateStr = new Date().toISOString().slice(0, 10);
      const docId = `${user.uid}_${dateStr}`;
  
      try {
        await updateDoc(doc(db, 'recommendations', docId), {
          ...formData,
          uid: user.uid,
          email: user.email,
          date: dateStr,
        });
        alert('제출 완료!');
        // 제출 후 초기화할 때도 formData가 null이면 에러날 수 있음 주의
        setFormData({
          meetingPlace: '',
          coordinates: { lat: null, lng: null },
        });
        setIsPlaceSelected(false);
      } catch (error) {
        console.error('제출 실패:', error);
        alert('제출 실패했습니다. 다시 시도해주세요.');
      }
      console.log('docId:', docId);
      console.log('formData:', formData);
    };
  
    return (
      <div className="select-location-page">
        <h2>만남 장소를 선택해주세요</h2>
        <form onSubmit={handleSubmit} id="recommendForm">
          <KakaoMapSearch onSelectCoordinate={handleCoordinateSelect} />
          <button type="submit" disabled={!isPlaceSelected}>
            추천받기
          </button>
        </form>
      </div>
    );
  }
  

  
export default SpotArea;



