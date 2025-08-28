import { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../AuthContext";
import PopAlert,{useAlert} from '../component/PopAlert';
import Loading from '../component/Loading';
import ListCard from '../component/ListCard';
import '../style/recommend_list.css'


const RecommendList = () => {
    const navigate = useNavigate();
    const { user, isAuthLoading } = useContext(AuthContext);
    const [codiList, setCodiList] = useState([]);
    const [isLoading, setLoading] = useState(true);
    const { showAlert } = useAlert(); 

  useEffect(() => {
    const fetchCodiList = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "savedCodi"),
          where("uid", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);

        const list = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.savedAt.toDate() - a.savedAt.toDate()); // 최신순 정렬

        setCodiList(list);
      } catch (error) {
        console.error("코디 목록 불러오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchCodiList();
  }, [user]);
  const colors = ['red','orange', 'yellow', 'blue', 'green', 'purple'];

  const shuffledColors = useMemo(() => {
      const arr = [...colors];
      for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
  }, []); 

   // 삭제 함수
   const handleRemove = (id) => {
    showAlert("삭제하시겠습니까?", [
        { 
            text: "예", 
            onClick: async () => {
                try {
                    await deleteDoc(doc(db, "savedCodi", id));
                    setCodiList(prev => prev.filter(codi => codi.id !== id));
                } catch (error) {
                    console.error("삭제 실패:", error);
                }
            } 
        },
        { text: "아니요" , onClick: () => {}, className:"close"} // 취소용
    ]);
};



  // Auth 확인 중이거나 데이터 로딩 중이면 로딩 표시
  if (isAuthLoading || isLoading) return <Loading />;

  // 로그인 안 된 경우 안내
  if (!user) return <p>로그인 후 이용해주세요.</p>;



  // 코디 리스트 렌더링
  return (
    <div id="recommend_list">
      <h2><b>저장한 코디</b> 모음</h2>
      {codiList.length === 0 ? (
        <p>아직 저장된 코디가 없어요.</p>
      ) : (
        <ul className="card_wrap">
            <li className="go_recommend" onClick={() => navigate('/recommend')}><p>데이터가 많을수록<br/>추천이 정확하게 떠요.</p></li>
            {codiList.map((codi, index) => {
                const colorClass = shuffledColors[index % shuffledColors.length]; 
                return (
                    <li key={codi.id} className={`card_box ${colorClass}`}>
                        <ListCard codi={codi} onRemove={handleRemove}/>
                    </li>
                );
            })}
        </ul>
      )}
    </div>
  );
};

export default RecommendList;
