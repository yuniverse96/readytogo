import { useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import '../style/intro.css';

function Intro() {
  const navigate = useNavigate();
  const topWrapRef = useRef(null);
  const textWrapRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {

    //오늘 날짜 비교해서 intro 건너뛰기
    const today = new Date().toISOString().split('T')[0];
    const skipDate = localStorage.getItem('introSkipDate');

    if (skipDate === today) {
      navigate('/home');
      return;
    }

    const lines = textWrapRef.current.querySelectorAll("p");

    // 초기 상태 세팅 (깜빡임 방지)
    gsap.set(lines, { yPercent: 100, autoAlpha: 0 });
    gsap.set(lines[0], { yPercent: 0, autoAlpha: 1 });

    const tl = gsap.timeline();

    // 1. top_wrap 전체가 아래에서 올라오며 등장
    tl.fromTo(
      topWrapRef.current,
      { y: 100, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out" }
    )

    // 2. 텍스트 블럭 페이드인
    .fromTo(
      textWrapRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.5 },
      "+=0.3"
    )

    // 3. 텍스트 롤업 애니메이션 시작
    .add(() => {
      let currentIndex = 0;
      const rollTl = gsap.timeline({ delay: 1 });

      for (let i = 1; i < lines.length; i++) {
        rollTl.to(lines[currentIndex], {
          yPercent: -100,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power2.inOut"
        }).fromTo(
          lines[i],
          { yPercent: 100, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: "power2.inOut" },
          "<"
        );
        currentIndex = i;
      }

      // 4. 마지막 문장 후 버튼 등장
      rollTl.to(buttonRef.current, {
        autoAlpha: 1,
        duration: 2,
        ease: "power2.out",
        delay: 1
      });
    });
  }, []);

  const handleStart = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('introSkipDate', today);
    navigate('/home');
  };

  return (
    <div id="intro">
      <div className="top_wrap" ref={topWrapRef}>
        <div className="logo_wrap">
          <img src={`${process.env.PUBLIC_URL}/images/logo.png`} alt="logo" />
        </div>

        <div className="txt_ani" ref={textWrapRef}>
          <p>더 이상 날씨 때문에<br />괴로워 하지 마세요.</p>
          <p>바깥 날씨는 잊고<br />나만의 하루를 시작하세요.</p>
        </div>
      </div>

      <div className="btn_wrap" ref={buttonRef}>
        <button onClick={handleStart}>시작하기</button>
      </div>

    </div>
  );
}

export default Intro;
