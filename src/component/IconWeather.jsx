import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ReactComponent as Sunnny } from '../asset/sunny.svg';
import { ReactComponent as Cloudy } from '../asset/cloudy.svg';
import { ReactComponent as Rainy } from '../asset/rainy.svg';
import { ReactComponent as Snowy } from '../asset/snowy.svg';
import { ReactComponent as Overcast } from '../asset/partlyCloudy.svg';


const IconWeather = ({ type }) => {
  const iconRef = useRef(null);

  useEffect(() => {
    if (!iconRef.current) return;

    gsap.killTweensOf(iconRef.current); // 이전 애니메이션 제거
    //맑음
    if (type === 'sunny' || type === 'default') {
      const tl = gsap.timeline();
    
      tl.fromTo(
        iconRef.current.querySelector('#sun-core'),
        { y: 100, opacity: 0, scale: 0, transformOrigin: '32px 32.5px' },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'power2.out',
          transformOrigin: '32px 32.5px',
        }
      )
      .fromTo(
        iconRef.current.querySelector('#sun-rays'),
        { opacity: 0, rotation: 0, transformOrigin: '50% 50%' },
        { opacity: 1, rotation: 0, duration: 0.5, transformOrigin: '50% 50%' },
        ">0" // 동그라미 애니메이션 끝나고 바로 시작
      )
      .to(
        iconRef.current.querySelector('#sun-rays'),
        {
          rotation: 360,
          duration: 10,
          ease: 'linear',
          repeat: -1,
          transformOrigin: '50% 50%',
        }
      );
      
    } else if(type === 'cloudy')  {
      //구름많음
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
          tl.to(iconRef.current, {x: -2,  y: -8, rotation: 2, duration: 3, ease: 'sine.inOut' })
          .to(iconRef.current, {x: 2, y: 0, rotation: -2, duration: 3, ease: 'sine.inOut' });
    }else if (type === 'overcast') {
      const rays = iconRef.current.querySelector('.rays');
      const cloud = iconRef.current.querySelector('#cloud');
      if (!cloud) return;
    
      if (!rays) return;
    
      gsap.killTweensOf(rays);
    
      gsap.fromTo(
        rays,
        { scale: 1, transformOrigin: '32px 32px' },
        {
          scale: 1.1,
          duration: 1.5,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
          transformOrigin:'32px 32px',
        }
      );

      gsap.to(cloud, {
        x: 5,           // 좌우 흔들림 강도 (5px 왔다 갔다)
        duration: 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }
     else if (type === 'rain' || type === 'rain_overcast' || type === 'rain_cloudy' || type === 'rain_sunny' )  {

      const cloud = iconRef.current.querySelector('.cloud');
      const drops = iconRef.current.querySelectorAll('.drop'); 

      // 모든 애니메이션 초기화

      gsap.killTweensOf(cloud);
      gsap.killTweensOf(drops);

       // 구름 흔들림 애니메이션
      if (cloud) {
        const tl = gsap.timeline({ repeat: -1, yoyo: true });
        tl.to(cloud, { y: 4, rotation: 0, duration: 3, ease: 'sine.inOut' })
          .to(cloud, { y: 0, rotation: 0, duration: 3, ease: 'sine.inOut' });
      }
  
      drops.forEach((drop, index) => {
        gsap.fromTo(
          drop,
          { y: 0, opacity: 1 },
          {
            y: 15,             // 15px 아래로 떨어짐
            opacity: 0,        // 점점 사라짐
            duration: 0.7,
            ease: 'power1.in',
            repeat: -1,
            repeatDelay: 0.3,
            yoyo: false,
            delay: index * 0.2, // 빗방울마다 딜레이 달리해서 연달아 떨어지는 효과
          }
        );
      });
    } else if (type === 'snow') {
      const snowLayer = iconRef.current.querySelector('.snow-layer');
    
      const createSnowflake = () => {
        const flake = document.createElement('div');
        flake.classList.add('flake');
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.width = `${Math.random() * 5 + 5}px`;
        flake.style.height = flake.style.width;
        flake.style.opacity = Math.random() * 0.5 + 0.5;
        snowLayer.appendChild(flake);
    
        gsap.to(flake, {
          y: 300,
          duration: Math.random() * 3 + 3,
          ease: 'none',
          onComplete: () => flake.remove(),
        });
      };
    
      const interval = setInterval(() => {
        createSnowflake();
      }, 300);
    
      return () => clearInterval(interval);
    }
    
     else {
      // sunny가 아니면 그냥 opacity 1로 유지
      gsap.to(iconRef.current, { opacity: 1, y: 0, rotate: 0, duration: 0.3 });
    }
  }, [type]);
  const renderIcon = () => {
    switch (type) {
        case 'sunny':
        case 'default':
        return (
          <div ref={iconRef} style={{ display: 'inline-block', position: 'relative' }}>
            <Sunnny />
          </div>
        );

      case 'overcast':
        return (
          <div ref={iconRef} style={{ display: 'inline-block', position: 'relative' }}>
            <Overcast/>
          </div>
        );
      case 'cloudy':
      return (
        <div ref={iconRef} style={{ display: 'inline-block', position: 'relative' }}>
          <Cloudy/>
        </div>
      );
      case 'rain':
      case 'rain_overcast':
      case 'rain_cloudy':
      case 'rain_sunny':
      return (
        <div ref={iconRef} style={{ display: 'inline-block', position: 'relative' }}>
          <Rainy/>
        </div>
      );
      case 'snow':
      return (
        <div ref={iconRef} style={{ display: 'inline-block', position: 'relative' }}>
          <Snowy/>
          <div className="snow-layer"></div>
        </div>
      );
     
      default:
        return null;
    }
  };

  return <>{renderIcon()}</>;
};

export default IconWeather;
