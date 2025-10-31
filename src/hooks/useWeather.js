// src/hooks/useWeather.js
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { getShortTermForecast, convertGRID_GPS, getBaseDateTime } from '../api/WeatherApi';

// 날씨 아이콘 매핑
const PTY_ICON_MAP = { '0':'clear','1':'rain','2':'rain_snow','3':'snow','4':'shower','5':'drizzle','6':'drizzle_snow','7':'snow_wind' };
const SKY_ICON_MAP = { '1':'sunny','3':'cloudy','4':'overcast' };

// 습도/풍속 상태
const getHumidityStatus = reh => reh === undefined ? '정보 없음' : reh >= 40 && reh <= 60 ? '좋음' : (reh >= 30 && reh < 40) || (reh > 60 && reh <= 70) ? '보통' : (reh >= 20 && reh < 30) || (reh > 70 && reh <= 79) ? '나쁨' : '매우 나쁨';
const getWindSpeedStatus = wsd => wsd === undefined ? '정보 없음' : wsd >= 1 && wsd <= 3 ? '좋음' : wsd >= 4 && wsd <= 5 ? '보통' : wsd >= 6 && wsd <= 7 ? '나쁨' : '매우 나쁨';
function getWeatherIcon(pty, sky){ const icons=[]; if(pty && pty!=='0') icons.push(PTY_ICON_MAP[pty]||'unknown'); if(sky) icons.push(SKY_ICON_MAP[sky]||'unknown'); return icons.join('_'); }

// 개인 체질/조건 보정
const constitutionAdjust = { SH: t => t + (t-24)*0.2, SC: t => t-(24- t)*0.2, NHC: t=>t, SHC: t=>t+(t-24)*0.2-(24- t)*0.2 };
const CONDITION_SCORE = { socold: -3, cold: -1.5, normal: 0, hot: 1.5, sohot: 3 };

// 체감온도 계산 (계절/습도/풍속 반영)
function calcFeelTemp(realTemp, constitution, condition, month, reh, wsd){
  let temp = realTemp + (CONDITION_SCORE[condition] ?? 0);
  if([12,1,2].includes(month)) temp -= 1.5;
  if([6,7,8].includes(month)) temp += 1.5;
  if(reh !== undefined){ if(reh>70) temp +=1; else if(reh<30) temp -=1; }
  if(wsd !== undefined && wsd >= 4) temp -=1;
  if(constitutionAdjust[constitution]) temp = constitutionAdjust[constitution](temp);
  return temp;
}

// 유저 문서 기반 체감 점수 계산
function calcUserFeelScore({temperature, constitution, condition, season}){
  let temp = Number(temperature.replace('+',''));
  temp += CONDITION_SCORE[condition] ?? 0;
  if(season === 'summer') temp += 1.5;
  else if(season === 'winter') temp -= 1.5;
  if(constitutionAdjust[constitution]) temp = constitutionAdjust[constitution](temp);
  return temp;
}

// 계절 mismatch 보정 맵
const SEASON_MISMATCH = {
  winter: {winter:0, spring:-1, summer:-3, autumn:-1.5},
  spring: {winter:-1, spring:0, summer:-1.5, autumn:-1},
  summer: {winter:-3, spring:-1.5, summer:0, autumn:-1},
  autumn: {winter:-1.5, spring:-1, summer:-1, autumn:0}
};

// 선형보간 + 계절 mismatch + 범위 밖 처리
function interpolateUserFeels(targetTemp, userData) {
  if (!userData || userData.length === 0) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const currentSeason = [12,1,2].includes(month) ? 'winter'
                     : [6,7,8].includes(month) ? 'summer'
                     : [3,4,5].includes(month) ? 'spring'
                     : 'autumn';

  const data = userData
    .filter(u => u.temperature)
    .map(u => {
      // 사용자가 기록한 상대 체감 점수
      let feel = calcUserFeelScore(u);

      // 계절 mismatch 보정 (상대값)
      if (u.season && u.season !== currentSeason) {
        feel += SEASON_MISMATCH[currentSeason][u.season] || 0;
      }

      return {
        temp: Number(u.temperature.replace('+','')),
        feel,
        condition: u.condition
      };
    })
    .sort((a,b)=>a.temp-b.temp);

  // 선형보간
  let interpolated = null;
  for (let i = 0; i < data.length - 1; i++) {
    const curr = data[i], next = data[i+1];
    if (targetTemp >= curr.temp && targetTemp <= next.temp) {
      interpolated = curr.feel + (targetTemp - curr.temp) * (next.feel - curr.feel) / (next.temp - curr.temp);
      break;
    }
  }

  // 범위 밖 처리
  if (interpolated === null) {
    if (targetTemp < data[0].temp) interpolated = data[0].feel - (data[0].temp - targetTemp);
    else interpolated = data[data.length-1].feel + (targetTemp - data[data.length-1].temp);
  }

  return interpolated;
}

// 점수 -> 레벨 매핑
function mapFeelScoreToLevel(score){
  if(score <= 5) return 'socold';
  if(score > 5 && score <= 10) return 'cold';
  if(score > 10 && score <= 15) return 'normal';
  if(score > 15 && score <= 18) return 'hot';
  return 'sohot';
}

// 옷 추천
function getClothesRecommendation(score){
  if(score <= 4) return '패딩, 두꺼운 코트, 목도리';
  if(score <= 8) return '코트, 니트, 기모 바지';
  if(score <= 12) return '니트, 자켓, 코튼팬츠';
  if(score <= 16) return '가디건, 얇은 니트, 청바지';
  return '반팔, 얇은 셔츠, 슬랙스';
}


// 오늘 최고/최저
function getDailyMinMaxTemp(data){
  let min=null, max=null;
  data.forEach(i=>{
    if(i.category==='TMN') min=Number(i.fcstValue);
    if(i.category==='TMX') max=Number(i.fcstValue);
  });
  return {min,max};
}

// 주소
function extractCityName(region){ return region.region_1depth_name; }
function extractLocalArea(sidoName){ return sidoName; } 

// Firestore 유저 문서
async function getAllUserDocs(userId){
  if(!userId) return [];
  const q = query(collection(db, "recommendations"), where("uid", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

// 훅
export const useWeather = (lat, lon, targetHour, constitution='NHC', condition='normal', userId=null)=>{
  const [coordinates,setCoordinates] = useState(null);
  const [locationName,setLocationName] = useState('');
  const [sidoName,setSidoName] = useState('');
  const [localArea,setLocalArea] = useState('');
  const [lastRefreshTime,setLastRefreshTime]=useState(null);
  const [estimatedFeel, setEstimatedFeel] = useState(null);
  const [estimatedFeelLevel, setEstimatedFeelLevel] = useState(null);
  const [recommendInfo, setRecommendInfo] = useState(null);

  useEffect(()=>{if(lat && lon) setCoordinates({lat,lon});},[lat,lon]);

  useEffect(() => {
    if (!lat || !lon) return;
    if (!window.kakao?.maps?.services) return;
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2RegionCode(lon, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        const region = result.find(r => r.region_type === 'H');
        if (region) {
          setSidoName(extractCityName(region));
          setLocationName(`${region.region_1depth_name} ${region.region_2depth_name}`);
          setLocalArea(extractLocalArea(region.region_1depth_name));
        }
      }
    });
  }, [lat, lon]);

  const {base_date,base_time}=getBaseDateTime();
  const {nx,ny}=coordinates?convertGRID_GPS(coordinates.lat,coordinates.lon):{nx:null,ny:null};
  const {data: forecastData,isLoading,error,refetch,dataUpdatedAt}=useQuery({
    queryKey:['shortTermForecast',nx,ny,base_date,base_time],
    queryFn:()=>getShortTermForecast(nx,ny,base_date,base_time),
    enabled:!!nx && !!ny,
    staleTime:1000*60*10,
    refetchInterval:1000*60*5
  });

  useEffect(()=>{
    if(!forecastData) return;
  
    (async()=>{
      const now=new Date();
      const month = now.getMonth()+1;
      const hour = typeof targetHour==='number' ? targetHour : now.getHours();
      const forecastHour = Math.floor(hour/3)*3;
      const forecastTimeStr = `${forecastHour.toString().padStart(2,'0')}00`;
  
      const filteredItems = forecastData.filter(i=>i.fcstTime===forecastTimeStr);
      const tempInfo = filteredItems.reduce((acc,cur)=>{ acc[cur.category]=cur.fcstValue; return acc; },{});
      const {min,max} = getDailyMinMaxTemp(forecastData);
      const realTemp = Number(tempInfo.TMP);
      const feelTemp = calcFeelTemp(realTemp, constitution, condition, month, Number(tempInfo.REH), Number(tempInfo.WSD));
      
      let estFeel = null;
      let estFeelLevel = null;
  
      if(userId){
        const allUserDocs = await getAllUserDocs(userId);
        const interpolatedFeels = allUserDocs
          .map(doc=>interpolateUserFeels(realTemp,[doc]))
          .filter(v=>v!==null);
  
        if(interpolatedFeels.length > 0){
          estFeel = interpolatedFeels.reduce((a,b)=>a+b,0)/interpolatedFeels.length;
          estFeelLevel = mapFeelScoreToLevel(estFeel);
  
          setEstimatedFeel(estFeel);
          setEstimatedFeelLevel(estFeelLevel);
  
          console.log('[useWeather] interpolatedFeels:', interpolatedFeels);
          console.log('[useWeather] averaged score (estFeel):', estFeel);
          console.log('[useWeather] mapped level:', estFeelLevel);
        }
      }
  
      // 최종 체감 온도 결정: estFeel 있으면 그것, 없으면 feelTemp
      const finalFeelTemp = Math.max(Math.min(estFeel ?? feelTemp, realTemp + 6), realTemp - 6);
      const recommendation = getClothesRecommendation(finalFeelTemp);
      const weatherIcon = getWeatherIcon(tempInfo.PTY, tempInfo.SKY);
  
      setRecommendInfo({
        ...tempInfo,
        feelTemp,
        estimatedFeel: estFeel,
        estimatedFeelLevel: estFeelLevel,
        recommendation,
        weatherIcon,
        humidityStatus: getHumidityStatus(Number(tempInfo.REH)),
        windSpeedStatus: getWindSpeedStatus(Number(tempInfo.WSD)),
        minTemp: min,
        maxTemp: max
      });
    })();
  },[forecastData, targetHour, constitution, condition, userId]);
  
  useEffect(()=>{if(dataUpdatedAt) setLastRefreshTime(new Date(dataUpdatedAt));},[dataUpdatedAt]);

  return {isLoading, error, recommendInfo, locationName, sidoName, localArea, lastRefreshTime, refetch, estimatedFeel, estimatedFeelLevel};
};
