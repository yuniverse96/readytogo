// src/hooks/useWeather.js
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getShortTermForecast,
  convertGRID_GPS,
  getBaseDateTime,
} from '../api/WeatherApi';
import { getAirQuality } from '../api/AirApi';

const DEFAULT_COORDINATES = {
  lat: 37.5665,
  lon: 126.9780,
};
//어제 날씨 호출
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const year = yesterday.getFullYear().toString();
  const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
  const day = yesterday.getDate().toString().padStart(2, '0');

  return `${year}${month}${day}`; // "20250730" 형식
};

const extractTMPFromForecast = (forecastData, targetHour) => {
  if (!forecastData) return null;

  const forecastHour = typeof targetHour === 'number' 
    ? `${Math.floor(targetHour / 3) * 3}`.padStart(2, '0') + '00' 
    : '1500';

  const filtered = forecastData.filter(item => item.fcstTime === forecastHour);
  const tmpItem = filtered.find(item => item.category === 'TMP');

  return tmpItem ? Number(tmpItem.fcstValue) : null;
};
//어제 오늘 날씨 비교 
/////// 계절별 기온 멘트가 상이함.
const getSeason = (month) => {
  if ([3, 4, 5].includes(month)) return 'spring';
  if ([6, 7, 8].includes(month)) return 'summer';
  if ([9, 10, 11].includes(month)) return 'fall';
  return 'winter';
};
const getTempComparisonMessage = (todayTemp, yesterdayTemp, currentMonth) => {
  if (todayTemp == null || yesterdayTemp == null) return '';

  const diff = todayTemp - yesterdayTemp;
  const absDiff = Math.abs(diff);
  const season = getSeason(currentMonth);

  // 계절별 텍스트 조건
  const message = {
    summer: {
      up: ['어제와 비슷해요.', '어제보다 조금 더 더워요.', '어제보다 더 더워요.', '어제보다 훨씬 더 더워요.'],
      down: ['어제보다 조금 시원해요.', '어제보다 더 시원해요.', '어제보다 훨씬 더 시원해요.'],
    },
    winter: {
      up: ['어제와 비슷해요.', '어제보다 조금 더 따뜻해요.', '어제보다 더 따뜻해요.', '어제보다 훨씬 더 따뜻해요.'],
      down: ['어제보다 조금 더 추워요.', '어제보다 더 추워요.', '어제보다 훨씬 더 추워요.'],
    },
    spring: {
      up: ['어제와 비슷해요.', '기온이 조금 올랐어요.', '기온이 많이 올랐어요.', '기온이 크게 올랐어요.'],
      down: ['기온이 조금 내렸어요.', '기온이 많이 내렸어요.', '기온이 크게 떨어졌어요.'],
    },
    fall: {
      up: ['어제와 비슷해요.', '약간 따뜻해졌어요.', '더 따뜻해졌어요.', '훨씬 더 따뜻해졌어요.'],
      down: ['약간 쌀쌀해졌어요.', '더 쌀쌀해졌어요.', '훨씬 더 쌀쌀해졌어요.'],
    },
  };

  const t = message[season];

  // 조건별 분기
  if (absDiff < 2) return t.up[0];

  if (diff >= 2 && diff < 5) return t.up[1];
  if (diff >= 5 && diff < 10) return t.up[2];
  if (diff >= 10) return t.up[3];

  if (diff <= -2 && diff > -5) return t.down[0];
  if (diff <= -5 && diff > -10) return t.down[1];
  if (diff <= -10) return t.down[2];

  return '';
};



const getHumidityStatus = (reh) => {
  if (reh === undefined) return '정보 없음';
  if (reh >= 40 && reh <= 60) return "좋음";
  else if ((reh >= 30 && reh < 40) || (reh > 60 && reh <= 70)) return "보통";
  else if ((reh >= 20 && reh < 30) || (reh > 70 && reh <= 79)) return "나쁨";
  else return "매우 나쁨";
};

const getWindSpeedStatus = (wsd) => {
  if (wsd === undefined) return '정보 없음';
  if (wsd >= 1 && wsd <= 3) return "좋음";
  else if (wsd >= 4 && wsd <= 5) return "보통";
  else if (wsd >= 6 && wsd <= 7) return "나쁨";
  else return "매우 나쁨";
};

const getAirQualityStatus = (pm10) => {
    if (pm10 === undefined || pm10 === null) return '정보 없음';
    if (pm10 <= 25) return '좋음';
    if (pm10 <= 50) return '보통';
    if (pm10 <= 75) return '나쁨';
    return '매우 나쁨';
  };
  

export const useWeather = (targetHour) => {
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoordinates({ lat: latitude, lon: longitude });
        },
        () => {
          setCoordinates(DEFAULT_COORDINATES);
        }
      );
    } else {
      setCoordinates(DEFAULT_COORDINATES);
    }
  }, []);

  const { base_date, base_time } = getBaseDateTime();
  const yesterdayDate = getYesterdayDate();

  const { nx, ny } = coordinates
    ? convertGRID_GPS(coordinates.lat, coordinates.lon)
    : { nx: null, ny: null };
  // 오늘 예보
  const {
    data: forecastData,
    isLoading: forecastLoading,
    error: forecastError,
    refetch: refetchForecast,
  } = useQuery({
    queryKey: ['shortTermForecast', nx, ny, base_date, base_time],
    queryFn: () => getShortTermForecast(nx, ny, base_date, base_time),
    enabled: !!nx && !!ny,
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 5,
  });

    // 어제 예보
    const {
      data: yesterdayForecastData,
      isLoading: yesterdayLoading,
      error: yesterdayError,
      refetch: refetchYesterday,
    } = useQuery({
      queryKey: ['shortTermForecast', nx, ny, yesterdayDate, base_time],
      queryFn: () => getShortTermForecast(nx, ny, yesterdayDate, base_time),
      enabled: !!nx && !!ny,
      staleTime: 1000 * 60 * 60,
    });


  //대기질 api
  const {
    data: airData,
    isLoading: airLoading,
    error: airError,
    refetch: refetchAir,
  } = useQuery({
    queryKey: ['airQuality', '중구'], // 필요 시 위치 기반 측정소명 가져오는 로직 가능
    queryFn: () => getAirQuality('중구'),
    staleTime: 1000 * 60 * 10,
  });

  let weatherInfo = null;

  if (forecastData) {
    const now = new Date();
    const hour = typeof targetHour === 'number' ? targetHour : now.getHours();
    const forecastHour = Math.floor(hour / 3) * 3;
    const forecastTimeStr = `${forecastHour.toString().padStart(2, '0')}00`;

    const filteredItems = forecastData.filter(item => item.fcstTime === forecastTimeStr);

    weatherInfo = filteredItems.reduce((acc, cur) => {
      acc[cur.category] = cur.fcstValue;
      return acc;
    }, {});

    // 상태 정보 추가
    weatherInfo.humidityStatus = getHumidityStatus(Number(weatherInfo.REH));
    weatherInfo.windSpeedStatus = getWindSpeedStatus(Number(weatherInfo.WSD));
  }

  if (weatherInfo && airData) { 
    const pm10 = Number(airData.pm10Value);
    weatherInfo.pm10 = pm10;
    weatherInfo.pm10Grade = airData.pm10Grade;
    weatherInfo.airQualityStatus = getAirQualityStatus(Number(weatherInfo.pm10));
  }

   // 어제와 비교해 멘트 생성
   if (weatherInfo && yesterdayForecastData) {
    const now = new Date();
    const hour = typeof targetHour === 'number' ? targetHour : now.getHours();
    const month = now.getMonth() + 1; //

    const todayTemp = extractTMPFromForecast(forecastData, hour);
    const yesterdayTemp = extractTMPFromForecast(yesterdayForecastData, hour);

    weatherInfo.tempComparisonMsg = getTempComparisonMessage(todayTemp, yesterdayTemp, month); 
  }

  return {
    isLoading: forecastLoading || airLoading,
    error: forecastError || airError,
    weatherInfo,
    refetch: () => {
      refetchForecast();
      refetchAir();
      refetchYesterday();

    },
  };
};

