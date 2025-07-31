import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ReactComponent as Sunnny } from '../asset/sunny.svg';
import { ReactComponent as PartlyCloudy } from '../asset/partlyCloudy.svg';
import { ReactComponent as Rainy } from '../asset/rainy.svg';
import { ReactComponent as Snowy } from '../asset/snowy.svg';
import { ReactComponent as RainThunder } from '../asset/rainThunder.svg';

const IconWeather = ({ type }) => {
  const iconRef = useRef(null);

  useEffect(() => {
    if (!iconRef.current) return;

    gsap.killTweensOf(iconRef.current); // 이전 애니메이션 제거

    if (type === 'sunny') {
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
      
    } else {
      // sunny가 아니면 그냥 opacity 1로 유지
      gsap.to(iconRef.current, { opacity: 1, y: 0, rotate: 0, duration: 0.3 });
    }
  }, [type]);

  const renderIcon = () => {
    switch (type) {
      case 'sunny':
        return (
          <div ref={iconRef} style={{ display: 'inline-block', position: 'relative' }}>
            <Sunnny width={100} height={100} />
          </div>
        );
      case 'partlyCloudy':
        return (
          <div ref={iconRef}>
            <PartlyCloudy width={100} height={100} />
          </div>
        );
      case 'rain':
        return (
          <div ref={iconRef}>
            <Rainy width={100} height={100} />
          </div>
        );
      case 'snow':
        return (
          <div ref={iconRef}>
            <Snowy width={100} height={100} />
          </div>
        );
      case 'thunder':
        return (
          <div ref={iconRef}>
            <RainThunder width={100} height={100} />
          </div>
        );
      default:
        return null;
    }
  };

  return <>{renderIcon()}</>;
};

export default IconWeather;
