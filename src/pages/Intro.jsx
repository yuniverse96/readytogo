import { useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import '../style/intro.css';

function Intro() {
  const navigate = useNavigate();
  const logoRef = useRef(null);
  const textWrapRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const lines = textWrapRef.current.querySelectorAll("p");
    const tl = gsap.timeline();

    // 로고 올라오기
    tl.fromTo(
      logoRef.current,
      { y: 100, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out" }
    )

    // 텍스트 전체 블록 페이드인
    .fromTo(
      textWrapRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.5 },
      "+=0.2"
    )

    // 롤업 애니메이션
    .add(() => {
      gsap.set(lines, { yPercent: 100, autoAlpha: 0 });
      gsap.set(lines[0], { yPercent: 0, autoAlpha: 1 });
      let currentIndex = 0;

      const rollTl = gsap.timeline({ delay: 0.5 });
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

      rollTl.to(buttonRef.current, {
        autoAlpha: 1,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.5
      });
    });

  }, []);

  return (
    <div id="intro">
      <div className="top_wrap">
        <div className="logo_wrap" ref={logoRef}>
          <img src={`${process.env.PUBLIC_URL}/images/logo.png`} alt="logo" />
        </div>

        <div className="txt_ani" ref={textWrapRef}>
          <p>더 이상 날씨 때문에<br />괴로워 하지 마세요.</p>
          <p>바깥 날씨는 잊고<br />나만의 하루를 시작하세요.</p>
        </div>
      </div>

      <div className="btn_wrap" ref={buttonRef}>
        <button onClick={() => navigate('/home')}>시작하기</button>
      </div>
    </div>
  );
}

export default Intro;
