import React, { useRef, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KakaoMapSearch from '../component/KakaoMap';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { Pagination, EffectFade } from 'swiper/modules';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore'; 
import { AuthContext } from '../AuthContext';
import '../style/recommend.css';

function Recommend() {
    const navigate = useNavigate();
    const swiperRef = useRef(null);
    const { user } = useContext(AuthContext);
    const inputRef = useRef(null);
    const spanRef = useRef(null);

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isNextEnabled, setIsNextEnabled] = useState(false);

    //영상 영하
    const [temperatureSign, setTemperatureSign] = useState('+'); 
    
 
  
    const topWearOptions = ['긴팔티', '반팔티','후드티', '민소매', '니트', '셔츠', '얇은 아우터','두꺼운 아우터'];
    const topInnerOptions = ['발열 이너웨어', '런닝/나시', '레이어드 반팔티', '레이어드 긴팔티'];

    const bottomWearOptions = ['긴바지', '반바지','짧은 스커트', '긴 스커트', '운동용  레깅스', '기모바지'];
    const bottomInnerOptions = ['발열 이너웨어', '속바지', '슬립', '스타킹'];
    const accessoryOptions = ['운동화', '샌들/슬리퍼', '구두', '방한 신발','스카프','머플러','캡모자','방한모자','장갑/핸드워머','니삭스/레그워머'];

  const [formData, setFormData] = useState({
    gender: '',
    age: '',
    constitution:'',
    season: '',
    temperature: '',
    topWear: [],
    topInner: [],
    bottomWear: [],
    bottomInner: [],
    accessory: [],
    meetingPlace: '',
    coordinates: { lat: null, lng: null },
  });

  const validateSlide = (slideIndex, data) => {
    switch (slideIndex) {
      case 0:
        return data.gender !== '' && data.age !== '';
      case 1:
        return data.constitution !== '';
      case 2:
        return data.season !== '' && data.temperature.trim() !== '';
      case 3:
        return data.topWear.length > 0 || data.topInner.length > 0;
      case 4:
        return data.bottomWear.length > 0 || data.bottomInner.length > 0;
      case 5:
        return true;
    }
  };
  
  
  const onSlideChangeHandler = (swiper, data) => {
    const idx = swiper.activeIndex;
    setCurrentSlide(idx);
    setIsNextEnabled(validateSlide(idx, data));
  };

  useEffect(() => {
    setIsNextEnabled(validateSlide(currentSlide, formData));
  }, [formData, currentSlide]);


  const [isLastSlide, setIsLastSlide] = useState(false);


  const handleSwiper = (where) => {
    if (swiperRef.current && where === 'next') {
      swiperRef.current.slideNext();
    } else if (swiperRef.current && where === 'prev') {
      swiperRef.current.slidePrev();
    }
  };

  const handleTempSaveAndGo = async () => {
    if (!user) {
      alert('로그인 후 이용해주세요.');
      return;
    }
  
    const dateStr = new Date().toISOString().slice(0, 10);
    const docId = `${user.uid}_${dateStr}`;
    const signedTemperature = `${temperatureSign}${formData.temperature}`;

    try {
      const { meetingPlace, coordinates, ...rest } = formData; // 위치 정보 제외
      await setDoc(doc(db, 'recommendations', docId), {
        ...rest,
        temperature: signedTemperature,
        uid: user.uid,
        email: user.email,
        date: dateStr,
      });

  
      navigate('/spotarea'); // 다음 페이지로 이동
    } catch (error) {
      console.error('임시 저장 실패:', error);
      alert('임시 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };
  

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCheckboxChange = (key, value, isChecked) => {
    setFormData((prev) => {
      const updated = isChecked
        ? [...prev[key], value] // 체크하면 추가
        : prev[key].filter((v) => v !== value); // 체크 해제하면 제거
  
      return { ...prev, [key]: updated };
    });
  };
  



  
  return (
    <div id="recommend">
      <div className="top_nav">
        <div className="btn_wrap prev_btn">
          <button type="button" onClick={() => handleSwiper('prev')}>이전</button>
        </div>

        <div className="btn_wrap go_home">
          <button type="button" onClick={() => navigate('/home')}>
            나가기
          </button>
        </div>

      </div>
      <form id="recommendForm">
        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={(swiper) => {
            setIsLastSlide(swiper.isEnd);
            onSlideChangeHandler(swiper, formData);
          }}        
          pagination={{ type: 'progressbar' }}
          effect={'fade'}
          modules={[Pagination, EffectFade]}
          allowTouchMove={false}
          className="rec_swiper"
          id="rec_swiper"
        >
         {/* 성별 나이 */}
          <SwiperSlide>
            <div className='form_select'>
                <div className='top_title'>
                    성별과 연령대를 알려주세요.
                </div>
                <h4>성별</h4>
                <ul className='gender'>
                    <li>
                        <input 
                            type="radio" 
                            id="female"
                            name="gender" 
                            value="female" 
                            checked={formData.gender === 'female'} 
                            onChange={() => handleChange('gender', 'female')}
                        /> 
                        <label htmlFor="female">여성</label>
                    </li>
                    <li>
                        <input 
                            type="radio" 
                            id="male"
                            name="gender" 
                            value="male" 
                            checked={formData.gender === 'male'} 
                            onChange={() => handleChange('gender', 'male')}
                            /> 
                        <label htmlFor="male">남성</label>
                    </li>
                </ul>
                <h4>나이</h4>
                <ul className='age'>
                    <li>
                        <input 
                            type="radio" 
                            id="teens"
                            name="age" 
                            value="teens" 
                            checked={formData.age === 'teens'} 
                            onChange={() => handleChange('age', 'teens')}
                        /> 
                        <label htmlFor="teens">10대</label>
                    </li>
                    <li>
                        <input 
                            type="radio" 
                            id="twenties"
                            name="age" 
                            value="twenties" 
                            checked={formData.age === 'twenties'} 
                            onChange={() => handleChange('age', 'twenties')}
                        /> 
                        <label htmlFor="twenties">20대</label>
                    </li>
                    <li>
                        <input 
                            type="radio" 
                            id="thirties"
                            name="age" 
                            value="thirties" 
                            checked={formData.age === 'thirties'} 
                            onChange={() => handleChange('age', 'thirties')}
                        /> 
                        <label htmlFor="thirties">30대</label>
                    </li>
                    <li>
                        <input 
                            type="radio" 
                            id="forties"
                            name="age" 
                            value="forties" 
                            checked={formData.age === 'forties'} 
                            onChange={() => handleChange('age', 'forties')}
                        /> 
                        <label htmlFor="forties">40대</label>
                    </li>
                    <li>
                        <input 
                            type="radio" 
                            id="fifties"
                            name="age" 
                            value="fifties" 
                            checked={formData.age === 'fifties'} 
                            onChange={() => handleChange('age', 'fifties')}
                        /> 
                        <label htmlFor="fifties">50대</label>
                    </li>
                </ul>
            </div>
          </SwiperSlide>
            {/* 민감도 */}
          <SwiperSlide>
            <div className='form_select'>
                <div className='top_title'>
                    추위나 더위에<br/>
                    얼마나 민감하신가요?
                </div>
                <ul className='constitution'>
                    <li>
                        <input 
                            type="radio" 
                            id="SH"
                            name="SH" 
                            value="SH" 
                            checked={formData.constitution === 'SH'} 
                            onChange={() => handleChange('constitution', 'SH')}
                        /> 
                        <label htmlFor="SH">더위를 많이 탐</label>
                    </li>
                    <li>
                        <input 
                            type="radio" 
                            id="SC"
                            name="SC" 
                            value="SC" 
                            checked={formData.constitution === 'SC'} 
                            onChange={() => handleChange('constitution', 'SC')}
                        /> 
                        <label htmlFor="SC">추위를 많이 탐</label>
                    </li>
                    <li>
                        <input 
                            type="radio" 
                            id="SHC"
                            name="SHC" 
                            value="SHC" 
                            checked={formData.constitution === 'SHC'} 
                            onChange={() => handleChange('constitution', 'SHC')}
                        /> 
                        <label htmlFor="SHC">둘다 많이 탐</label>
                    </li>
                    <li>
                        <input 
                            type="radio" 
                            id="NHC"
                            name="NHC" 
                            value="NHC" 
                            checked={formData.constitution === 'NHC'} 
                            onChange={() => handleChange('constitution', 'NHC')}
                        /> 
                        <label htmlFor="NHC">둘 다 많이 안 탐</label>
                    </li>
                   
                </ul>
            </div>
          </SwiperSlide>
            {/* 계절 온도 */}
          <SwiperSlide>
            <div className='form_select'>
                <div className='top_title'>
                   현재 기온을 알려주세요.
                </div>
                <ul className='season'>
                    <li>
                        <input 
                            type="radio" 
                            id="spring"
                            name="spring" 
                            value="spring" 
                            checked={formData.season === 'spring'} 
                            onChange={() => handleChange('season', 'spring')}
                        /> 
                        <label htmlFor="spring">봄</label>
                    </li>
                    <li>
                        <input 
                            type="radio" 
                            id="summer"
                            name="summer" 
                            value="summer" 
                            checked={formData.season === 'summer'} 
                            onChange={() => handleChange('season', 'summer')}
                        /> 
                        <label htmlFor="summer">여름</label>
                    </li>
                    <li>
                        <input 
                            type="radio" 
                            id="autumn"
                            name="autumn" 
                            value="autumn" 
                            checked={formData.season === 'autumn'} 
                            onChange={() => handleChange('season', 'autumn')}
                        /> 
                        <label htmlFor="autumn">가을</label>
                    </li>
                    <li>
                        <input 
                            type="radio" 
                            id="winter"
                            name="winter" 
                            value="winter" 
                            checked={formData.season === 'winter'} 
                            onChange={() => handleChange('season', 'winter')}
                        /> 
                        <label htmlFor="winter">겨울</label>
                    </li>
                   
                </ul>

                <div className='temp'>
                    <div className={formData.temperature ? 'temp_input hsv' : 'temp_input'}>
                      <ul className='ud_btn'>
                        <li className='btn_wrap min'>
                              <input 
                                  type="radio" 
                                  id="below"
                                  name="temp" 
                                  value="below" 
                                  checked={temperatureSign === '-'}
                                  onChange={() => setTemperatureSign('-')} 
                                  /> 
                              <label htmlFor='below'>-</label>
                          </li>
                        <li className='btn_wrap pls'>
                            <input 
                                type="radio" 
                                id="above"
                                name="temp" 
                                value="above" 
                                checked={temperatureSign === '+'}
                                onChange={() => setTemperatureSign('+')} 
                                /> 
                            <label htmlFor='above'>+</label>
                        </li>
                      </ul>
                    <input 
                        type='text'
                        inputMode="numeric"
                        name='temperature' 
                        id='temperature'
                        value={formData.temperature}
                        placeholder='0'
                        onChange={(e) => {
                          let value = e.target.value;
                      
                          if (/^-?\d{0,3}$/.test(value)) {
                            if (value === '' || value === '-') {
                              handleChange('temperature', value);
                              return;
                            }
                            const num = parseInt(value, 10);
                            if (num >= -99 && num <= 99) {
                              handleChange('temperature', value);
                            }
                          }
                        }}
                      />
                        <p>℃</p>
                    </div>
                   
                </div>
            </div>
          </SwiperSlide>
            {/* 상의 정보*/}
          <SwiperSlide>
            <div className='form_select'>
                <div className='top_title'>
                    현재 착용하고 있는<br/>
                    상의는 무엇인가요?
                </div>
                <h4>상의</h4>
                <ul className='top_wear'>
                    {topWearOptions.map((item, idx) => (
                        <li key={idx}>
                        <input
                            type="checkbox"
                            id={`topWear_${idx}`}
                            value={item}
                            checked={formData.topWear.includes(item)}
                            onChange={(e) =>
                            handleCheckboxChange('topWear', item, e.target.checked)
                            }
                        />
                        <label htmlFor={`topWear_${idx}`}>{item}</label>
                        </li>
                    ))}
                </ul>
                <h4>이너웨어</h4>
                <ul className='top_inner'>
                    {topInnerOptions.map((item, idx) => (
                        <li key={idx}>
                        <input
                            type="checkbox"
                            id={`topInner_${idx}`}
                            value={item}
                            checked={formData.topInner.includes(item)}
                            onChange={(e) =>
                            handleCheckboxChange('topInner', item, e.target.checked)
                            }
                        />
                        <label htmlFor={`topInner_${idx}`}>{item}</label>
                        </li>
                    ))}
                </ul>
            </div>
          </SwiperSlide>
            {/* 하의 정보 */}
          <SwiperSlide>
            <div className='form_select'>
                <div className='top_title'>
                    현재 착용하고 있는<br/>
                    하의는 무엇인가요?
                </div>
                <h4>하의</h4>
                <ul className='bottom_wear'>
                    {bottomWearOptions.map((item, idx) => (
                        <li key={idx}>
                        <input
                            type="checkbox"
                            id={`bottomWear_${idx}`}
                            value={item}
                            checked={formData.bottomWear.includes(item)}
                            onChange={(e) =>
                            handleCheckboxChange('bottomWear', item, e.target.checked)
                            }
                        />
                        <label htmlFor={`bottomWear_${idx}`}>{item}</label>
                        </li>
                    ))}
                </ul>
                <h4>이너웨어</h4>
                <ul className='bottom_inner'>
                    {bottomInnerOptions.map((item, idx) => (
                        <li key={idx}>
                        <input
                            type="checkbox"
                            id={`bottomInner_${idx}`}
                            value={item}
                            checked={formData.bottomInner.includes(item)}
                            onChange={(e) =>
                            handleCheckboxChange('bottomInner', item, e.target.checked)
                            }
                        />
                        <label htmlFor={`bottomInner_${idx}`}>{item}</label>
                        </li>
                    ))}
                </ul>
            </div>
          </SwiperSlide>
            {/* 악세사리 정보 */}
            <SwiperSlide>
            <div className='form_select'>
                <div className='top_title'>
                    그 외 착용한 아이템이 있나요?
                </div>
                <h4>신발 및 악세사리</h4>
                <ul className='accessory'>
                    {accessoryOptions.map((item, idx) => (
                        <li key={idx}>
                        <input
                            type="checkbox"
                            id={`accessory_${idx}`}
                            value={item}
                            checked={formData.accessory.includes(item)}
                            onChange={(e) =>
                            handleCheckboxChange('accessory', item, e.target.checked)
                            }
                        />
                        <label htmlFor={`accessory_${idx}`}>{item}</label>
                        </li>
                    ))}
                </ul>
            </div>
          </SwiperSlide>         
        </Swiper>

        

          <div className='next_btn'>
            {isLastSlide ? (
                <button type="button" onClick={handleTempSaveAndGo}>
                  다음 단계로
                </button>
              ) : (
                <button type="button" onClick={() => handleSwiper('next')} disabled={!isNextEnabled}>
                  다음으로
                </button>
              )}
          </div>

        
         
      </form>
    </div>
  );
}

export default Recommend;

