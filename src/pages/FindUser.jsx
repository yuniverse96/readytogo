import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import AuthInput from "../component/AuthInput";
import '../style/login.css'
function FindUser() {
    const navigate = useNavigate();
  const { mode } = useParams(); // "id" or "password"
  const [formData, setFormData] = useState({ userId: "", email: "" });
  const [foundId, setFoundId] = useState(null);
  const [foundPassword, setFoundPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 아이디 찾기
  const handleFindId = async () => {
    try {
      const q = query(
        collection(db, "userIds"),
        where("email", "==", formData.email)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // 문서 ID가 userId
        const userId = snapshot.docs[0].id;
        setFoundId(userId);
        setMessage("");
      } else {
        setFoundId(null);
        setMessage("해당 이메일로 가입된 아이디가 없습니다.");
      }
    } catch (err) {
      console.error(err);
      setMessage("아이디 찾기 중 오류가 발생했습니다.");
    }
  };

  // 비밀번호 찾기
  const handleFindPassword = async () => {
    try {
      const q = query(
        collection(db, "userIds"),
        where("email", "==", formData.email)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setMessage("가입되지 않은 이메일입니다.");
        return;
      }

      const userData = snapshot.docs[0].data();
      const docId = snapshot.docs[0].id;

      // userId 확인
      if (docId === formData.userId) {
        const auth = getAuth();
        await sendPasswordResetEmail(auth, formData.email);
        setMessage("비밀번호 재설정 메일을 발송했습니다.");
        setFoundPassword(true); 
      } else {
        setMessage("아이디와 이메일이 일치하지 않거나, 가입되지 않은 계정입니다.");
        setFoundPassword(false); 
      }
    } catch (error) {
      console.error(error);
      setMessage("비밀번호 찾기 중 오류가 발생했습니다.");
      setFoundPassword(false); 
    }
  };

  return (
    <div id="find_wrap">
        <div className="back_btn">
            <button onClick={() => navigate(-1)}>뒤로가기</button>
        </div>
        {/* 아이디찾기 */}
        {mode === "id" && (
                <>
                    <h2>아이디 찾기</h2>
                   
                    { !foundId && (
                        <>
                            <AuthInput
                                label="이메일"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                showLabel="top"
                                placeholder="가입 시 입력한 이메일"
                            />
                            {message && !foundId && <p className="error">{message}</p>}
                            <div className="btn_wrap"><button onClick={handleFindId}>찾기</button></div>
                        </>
                    )}

                    {foundId && (
                        <div className="result">
                            <p>가입하신 아이디는 <strong>{foundId}</strong> 입니다.</p>
                            <div className="btn_wrap"><button onClick={()=>{ navigate("/find/password");}}>패스워드 찾기</button></div>
                            <div className="btn_wrap dark"><button onClick={()=>{ navigate("/login");}}>로그인</button></div>
                        </div>
                    )}
                   
                </>
        )}
        {/* 패스워드찾기 */}
        {mode === "password" && (
            <>
                <h2>비밀번호 찾기</h2>

                {!foundPassword && (
                <>
                    <ul className="input_all">
                        <li>
                        <AuthInput
                            label="아이디"
                            type="text"
                            name="userId"
                            value={formData.userId}
                            onChange={handleChange}
                            showLabel="top"
                            placeholder="가입 시 입력한 아이디"
                        />
                        </li>
                        <li>
                        <AuthInput
                            label="이메일"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            showLabel="top"
                            placeholder="가입 시 입력한 이메일"
                        />
                        </li>
                    </ul>
                    {!foundPassword && message && <p className="error">{message}</p>}

                    <div className="btn_wrap">
                        <button onClick={handleFindPassword}>비밀번호 재설정</button>
                    </div>
                </>
                )}

                {foundPassword && message && (
                    <div className="result">
                        <p>가입시 입력하신 이메일(<strong>{formData.email}</strong>)로<br/>비밀번호 재설정url을 보냈습니다!</p>
                        <div className="btn_wrap"><button onClick={()=>{ navigate("/home");}}>홈으로</button></div>
                        <div className="btn_wrap dark"><button onClick={()=>{ navigate("/login");}}>로그인</button></div>
                    </div>
                )}
            </> 
        )}

      {mode !== "id" && mode !== "password" && (
        <div>잘못된 접근입니다.</div>
      )}
    </div>
  );
}

export default FindUser;
