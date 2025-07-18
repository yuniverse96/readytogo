import { useEffect, useState, useContext } from 'react';
import { doc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../AuthContext';

export default function useUserId() {
  const { user } = useContext(AuthContext);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (!user?.email) {
      setUserId(null);
      return;
    }

    const fetchUserId = async () => {
      try {
        const q = query(collection(db, 'userIds'), where('email', '==', user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          setUserId(docSnap.id);
        } else {
          setUserId(null);
        }
      } catch (error) {
        console.error('userId 조회 실패', error);
        setUserId(null);
      }
    };

    fetchUserId();
  }, [user]);

  return userId;
}
