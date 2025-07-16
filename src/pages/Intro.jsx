import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useNavigate } from 'react-router-dom';
import '../style/intro.css';

const icons = [
    "/images/sun.png",
    "/images/cloudy.png",
    "/images/snow.png",
    "/images/thunder.png",
    "/images/sun_cloudy.png",
    "/images/rain.png"
  ];
  

function Intro() {
  const navigate = useNavigate(); 
  const imgRef = useRef(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      gsap.to(imgRef.current, {
        duration: 0.5,
        rotateY: 90,
        opacity: 0,
        ease: "power1.in",
        onComplete: () => {
          setCurrentIdx((prev) => (prev + 1) % icons.length);

          gsap.fromTo(imgRef.current,
            { rotateY: -90, opacity: 0 },
            {
              duration: 0.5,
              rotateY: 0,
              opacity: 1,
              ease: "power1.out"
            }
          );
        }
      });
    }, 2000); // 2초마다 전환

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="intro">
      <div className='img_animation'>
        <img
          ref={imgRef}
          className="weather-icon"
          src={icons[currentIdx]}
          alt="weather"
        />
      </div>

      <div className='txt_box'>
        <h2>오늘 어디가?</h2>
        <p>where are you going?</p>
      </div>

      <div className='btn_wrap'>
        <button onClick={() => navigate('/Home')}>시작하기</button>
      </div>
    </div>
  );
}

export default Intro;
