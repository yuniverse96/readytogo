// src/hooks/useWeather.js
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getShortTermForecast,
  convertGRID_GPS,
  getBaseDateTime,
} from '../api/WeatherApi';

const DEFAULT_COORDINATES = {
  lat: 37.5665,  // 서울시 중구
  lon: 126.9780,
};

// 어제 날짜 구하기
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const year = yesterday.getFullYear().toString();
  const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
  const day = yesterday.getDate().toString().padStart(2, '0');

  return `${year}${month}${day}`; // "YYYYMMDD" 형식
};

// 예보에서 특정 시간대 온도 추출
const extractTMPFromForecast = (forecastData, targetHour) => {
  if (!forecastData) return null;

  const forecastHour =
    typeof targetHour === 'number'
      ? `${Math.floor(targetHour / 3) * 3}`.padStart(2, '0') + '00'
      : '1500';

  const filtered = forecastData.filter(item => item.fcstTime === forecastHour);
  const tmpItem = filtered.find(item => item.category === 'TMP');

  return tmpItem ? Number(tmpItem.fcstValue) : null;
};

// 계절 판단
const getSeason = month => {
  if ([3, 4, 5].includes(month)) return 'spring';
  if ([6, 7, 8].includes(month)) return 'summer';
  if ([9, 10, 11].includes(month)) return 'fall';
  return 'winter';
};

// 오늘-어제 온도 비교 멘트 생성
const getTempComparisonMessage = (todayTemp, yesterdayTemp, currentMonth) => {
  if (todayTemp == null || yesterdayTemp == null) return '';

  const diff = todayTemp - yesterdayTemp;
  const absDiff = Math.abs(diff);
  const season = getSeason(currentMonth);

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
      down: ['약간 쌀쌀해졌어요.', '더 쌀쌀졌어요.', '훨씬 더 쌀쌀해졌어요.'],
    },
  };

  const t = message[season];

  if (absDiff < 2) return t.up[0];

  if (diff >= 2 && diff < 5) return t.up[1];
  if (diff >= 5 && diff < 10) return t.up[2];
  if (diff >= 10) return t.up[3];

  if (diff <= -2 && diff > -5) return t.down[0];
  if (diff <= -5 && diff > -10) return t.down[1];
  if (diff <= -10) return t.down[2];

  return '';
};

// 습도 상태 판단
const getHumidityStatus = reh => {
  if (reh === undefined) return '정보 없음';
  if (reh >= 40 && reh <= 60) return '좋음';
  else if ((reh >= 30 && reh < 40) || (reh > 60 && reh <= 70)) return '보통';
  else if ((reh >= 20 && reh < 30) || (reh > 70 && reh <= 79)) return '나쁨';
  else return '매우 나쁨';
};

// 풍속 상태 판단
const getWindSpeedStatus = wsd => {
  if (wsd === undefined) return '정보 없음';
  if (wsd >= 1 && wsd <= 3) return '좋음';
  else if (wsd >= 4 && wsd <= 5) return '보통';
  else if (wsd >= 6 && wsd <= 7) return '나쁨';
  else return '매우 나쁨';
};

// 대기질 상태 판단
const getAirQualityStatus = pm10 => {
  if (pm10 === undefined || pm10 === null || isNaN(Number(pm10))) return '정보 없음';

  const value = Number(pm10);

  if (value <= 30) return '좋음';
  if (value <= 80) return '보통';
  if (value <= 150) return '나쁨';
  return '매우 나쁨';
};

// 강수 및 하늘 상태 아이콘 매핑
const PTY_ICON_MAP = {
  '0': 'clear',      // 없음
  '1': 'rain',       // 비
  '2': 'rain_snow',  // 비/눈
  '3': 'snow',       // 눈
  '4': 'shower',     // 소나기
  '5': 'drizzle',    // 빗방울
  '6': 'drizzle_snow', // 빗방울눈날림
  '7': 'snow_wind',  // 눈날림
};

const SKY_ICON_MAP = {
  '1': 'sunny',      // 맑음
  '3': 'cloudy',     // 구름많음
  '4': 'overcast',   // 흐림
};

const WEATHER_DESCRIPTION_MAP = {
  'rain_overcast': '하늘이 흐리고 비가 내려요.',
  'rain_cloudy': '구름이 많고, 비가내려요.',
  'rain_sunny': '비가오고,',
  'snow_cloudy': '구름이 많고, 눈이와요.',
  'rain': '비가 내리고,',
  'snow': '눈이 오고,',
  'overcast': '하늘이 흐리고,',
  'cloudy': '구름이 많고,',
  'sunny': '맑은 날씨예요.',
  'rain_snow_cloudy': '구름이 많고 비와 눈이 내려요.',
  // 필요시 더 추가 가능
};

function getWeatherIcon(pty, sky) {
  const icons = [];

  // 강수 상태가 0이 아닐 때만 icon에 추가
  if (pty && pty !== '0') {
    icons.push(PTY_ICON_MAP[pty] || 'unknown');
  }

  // sky는 무조건 추가
  if (sky) {
    icons.push(SKY_ICON_MAP[sky] || 'unknown');
  }

  return icons.join('_');
}

export const useWeather = (lat, lon, targetHour) => {
  const [coordinates, setCoordinates] = useState(null);
  const [locationName, setLocationName] = useState('서울특별시 중구');
  const [sidoName, setSidoName] = useState('서울'); // 초기값
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  useEffect(() => {
    if (lat && lon) {
      setCoordinates({ lat, lon });
    }
  }, [lat, lon]);

  const refreshData = () => {
    setCoordinates({ lat, lon }); // 기존 좌표 다시 세팅하거나 새로고침 트리거
    setLastRefreshTime(new Date());
  };

  // 좌표 바뀔 때 카카오 API로 지역명 가져오기
  useEffect(() => {
    if (!lat || !lon) return;

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      setLocationName('서울특별시 중구');
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2RegionCode(lon, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        const region = result.find(r => r.region_type === 'H'); // 가장 정확한 구역
        if (region) {
          const cityName = extractCityName(region); // 여기에 '서울', '광주', '성남' 등이 나옴

          setSidoName(cityName);
          setLocationName(`${region.region_1depth_name} ${region.region_2depth_name}`);
        }
      } else {
        setSidoName('서울');
        setLocationName('서울특별시 중구');
      }
    });
  }, [lat, lon]);
  const extractCityName = (region) => {
    const { region_1depth_name, region_2depth_name } = region;

    // 1depth가 ~특별시, ~광역시, 세종특별자치시면 그대로 사용
    if (/(특별시|광역시|세종)/.test(region_1depth_name)) {
      return region_1depth_name.replace(/(특별시|광역시|특별자치시)/, '');
    }

    // 나머지 (ex: 경기도, 충청남도 등)는 2depth 사용
    return region_2depth_name.replace(/시$/, ''); // '성남시' → '성남' 등 정리
  };

  // 좌표 변환 (GRID 좌표)
  const { base_date, base_time } = getBaseDateTime();
  const yesterdayDate = getYesterdayDate();

  const { nx, ny } = coordinates
    ? convertGRID_GPS(coordinates.lat, coordinates.lon)
    : { nx: null, ny: null };

  // 오늘 단기예보
  const {
    data: forecastData,
    isLoading: forecastLoading,
    error: forecastError,
    refetch: refetchForecast,
    dataUpdatedAt: forecastUpdatedAt,  // react-query가 제공하는 최신 업데이트 시간
  } = useQuery({
    queryKey: ['shortTermForecast', nx, ny, base_date, base_time],
    queryFn: () => getShortTermForecast(nx, ny, base_date, base_time),
    enabled: !!nx && !!ny,
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 5,
  });

  // 어제 단기예보
  const {
    data: yesterdayForecastData,
    isLoading: yesterdayLoading,
    error: yesterdayError,
    refetch: refetchYesterday,
  } = useQuery({
    queryKey: ['shortTermForecast', nx, ny, yesterdayDate, base_time],
    queryFn: () => getShortTermForecast(nx, ny, yesterdayDate, base_time),
    enabled: !!nx && !!ny,
    staleTime: 1000 * 60 * 60,       // 1시간 캐시
    refetchInterval: 1000 * 60 * 60, // 1시간마다 재요청
    retry: 1,                       // 재시도 1회로 줄임
  });

  // 대기질 API - 여기서 fetch 직접 호출해서 resultCode 검사하고 에러 처리
  const {
    data: airData,
    isLoading: airLoading,
    error: airError,
    refetch: refetchAir,
  } = useQuery({
    queryKey: ['airQuality', sidoName],
    queryFn: async () => {
      const serviceKey = process.env.REACT_APP_AIRKOREA_API_KEY;
      const params = new URLSearchParams({
        serviceKey,
        returnType: 'json',
        sidoName,
        numOfRows: '100',
        pageNo: '1',
        ver: '1.0',
      });
      const url = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP 에러: ${res.status}`);
      }
      const json = await res.json();

      if (json.response?.header?.resultCode !== '00') {
        throw new Error(`API 오류: ${json.response.header.resultMsg || '알 수 없음'}`);
      }

      return json.response.body.items || [];
    },
    staleTime: 1000 * 60 * 60,  // 1시간 캐시
    retry: 1,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('대기질 API 에러:', error);
    },
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

    weatherInfo.humidityStatus = getHumidityStatus(Number(weatherInfo.REH));
    weatherInfo.windSpeedStatus = getWindSpeedStatus(Number(weatherInfo.WSD));
  }

  if (weatherInfo && airData) {
    let firstStation = null;

    if (Array.isArray(airData)) {
      if (airData.length > 0) {
        firstStation = airData[0];
      }
    } else if (typeof airData === 'object' && airData !== null) {
      firstStation = airData;
    }

    if (firstStation) {
      const pm10Raw = firstStation.pm10Value;

      const isValidPm10 =
        pm10Raw !== null &&
        pm10Raw !== undefined &&
        pm10Raw !== '' &&
        pm10Raw !== '-' &&
        !isNaN(Number(pm10Raw));

      const pm10 = isValidPm10 ? Number(pm10Raw) : NaN;

      if (!isNaN(pm10)) {
        weatherInfo.pm10 = pm10;
        weatherInfo.pm10Grade = pm10Raw;
        weatherInfo.airQualityStatus = getAirQualityStatus(pm10);
      } else {
        weatherInfo.pm10 = null;
        weatherInfo.pm10Grade = pm10Raw;
        weatherInfo.airQualityStatus = '정보 없음';
      }
    }
  }

  if (weatherInfo) {
    const icon = getWeatherIcon(weatherInfo.PTY, weatherInfo.SKY);
    const description = WEATHER_DESCRIPTION_MAP[icon] || '날씨 정보를 불러올 수 없어요';

    weatherInfo.weatherIcon = icon;
    weatherInfo.weatherDescription = description;
    weatherInfo.weatherColor = SKY_ICON_MAP[weatherInfo.SKY] || 'unknown';
  }

  if (weatherInfo && yesterdayForecastData) {
    const now = new Date();
    const hour = typeof targetHour === 'number' ? targetHour : now.getHours();
    const month = now.getMonth() + 1;

    const todayTemp = extractTMPFromForecast(forecastData, hour);
    const yesterdayTemp = extractTMPFromForecast(yesterdayForecastData, hour);

    weatherInfo.tempComparisonMsg = getTempComparisonMessage(todayTemp, yesterdayTemp, month);
  }

  useEffect(() => {
    if (forecastUpdatedAt) {
      setLastRefreshTime(new Date(forecastUpdatedAt));
    }
  }, [forecastUpdatedAt]);

  return {
    isLoading: forecastLoading || airLoading,
    error: forecastError || airError,
    weatherInfo,
    locationName,
    lastRefreshTime,
    refetch: () => {
      refetchForecast();
      refetchAir();
      refetchYesterday();
    },
  };
};
