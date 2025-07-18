import { useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import '../style/login.css'

function Welcome() {
    const navigate = useNavigate();
    //페이지 액샨
    const topWrapRef = useRef(null);
    const buttonRef = useRef(null);



    useEffect(() => {
        const tl = gsap.timeline();
      
        // topWrap 등장
        tl.fromTo(
          topWrapRef.current,
          { y: 100, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out" }
        )
      
        // 버튼 등장 (0.2초 딜레이 후)
        .to(buttonRef.current, {
          autoAlpha: 1,
          duration: 0.3,
          ease: "power2.out",
        }); // 이전 애니메이션 종료 후 0.2초 뒤 실행
      }, []);
      



    

  return (
    <div id="welcome">
        <div className="top_img"ref={topWrapRef}>
            <div className="img_wrap">
                 <img src={`${process.env.PUBLIC_URL}/images/welcome.png`} alt="top" />
            </div>
        </div>
        <div className="btn_all" ref={buttonRef}>
            <div className="btn_wrap home">
                <button type="button" onClick={() => navigate('/home')}>홈으로</button>
            </div>
            <div className="btn_wrap recommend">
                <button  type="button" onClick={() => navigate('/recommend')}>추천받기</button>
            </div>
        </div>
      
    </div>
  );
}

export default Welcome;
