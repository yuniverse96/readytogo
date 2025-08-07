// src/hooks/useShortWeather.js
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getUltraShortTermForecast,
  getNowTermForecast,
  convertGRID_GPS,
  getBaseDateTime,
} from '../api/RealtimeWeatherApi';
import { getAirQuality } from '../api/AirApi';

const DEFAULT_COORDINATES = {
  lat: 37.5665,
  lon: 126.9780,
};

const getHumidityStatus = reh => {
  if (reh === undefined) return '보통';
  if (reh >= 40 && reh <= 60) return '좋음';
  else if ((reh >= 30 && reh < 40) || (reh > 60 && reh <= 70)) return '보통';
  else if ((reh >= 20 && reh < 30) || (reh > 70 && reh <= 79)) return '나쁨';
  else return '매우 나쁨';
};

const getWindSpeedStatus = wsd => {
  if (wsd === undefined) return '보통';
  if (wsd >= 1 && wsd <= 3) return '좋음';
  else if (wsd >= 4 && wsd <= 5) return '보통';
  else if (wsd >= 6 && wsd <= 7) return '나쁨';
  else return '매우 나쁨';
};

const getAirQualityStatus = pm10 => {
  if (pm10 === undefined || pm10 === null || isNaN(Number(pm10))) return '보통';
  const value = Number(pm10);
  if (value <= 30) return '좋음';
  if (value <= 80) return '보통';
  if (value <= 150) return '나쁨';
  return '매우 나쁨';
};

const PTY_ICON_MAP = {
  '0': 'sunny', '1': 'rain', '2': 'rain_snow', '3': 'snow',
  '4': 'shower', '5': 'drizzle', '6': 'drizzle_snow', '7': 'snow_wind',
};

const SKY_ICON_MAP = {
  '1': 'clear', '3': 'cloudy', '4': 'overcast',
};

const WEATHER_DESCRIPTION_MAP = {
  // PTY가 1 (비)
  'rain_overcast': '하늘이 흐리고 비가 내려요.',
  'rain_cloudy': '구름이 많고 비가 내려요.',
  'rain_sunny': '비가 내려요.',

  // PTY가 2 (비/눈)
  'rain_snow_overcast': '하늘이 흐리고 비와 눈이 내려요.',
  'rain_snow_cloudy': '구름이 많고 비와 눈이 내려요.',
  'rain_snow_sunny': '비와 눈이 내려요.',

  // PTY가 3 (눈)
  'snow_overcast': '하늘이 흐리고 눈이 내려요.',
  'snow_cloudy': '구름이 많고 눈이 내려요.',
  'snow_sunny': '눈이 내려요.',

  // PTY가 4 (소나기)
  'shower_overcast': '하늘이 흐리고 소나기가 내려요.',
  'shower_cloudy': '구름이 많고 소나기가 내려요.',
  'shower_sunny': '소나기가 내려요.',

  // PTY가 5 (빗방울)
  'drizzle_overcast': '하늘이 흐리고 빗방울이 떨어져요.',
  'drizzle_cloudy': '구름이 많고 빗방울이 떨어져요.',
  'drizzle_sunny': '빗방울이 떨어져요.',

  // PTY가 6 (빗방울 + 눈날림)
  'drizzle_snow_overcast': '하늘이 흐리고 빗방울과 눈이 날려요.',
  'drizzle_snow_cloudy': '구름이 많고 빗방울과 눈이 날려요.',
  'drizzle_snow_sunny': '빗방울과 눈이 날려요.',

  // PTY가 7 (눈날림)
  'snow_wind_overcast': '하늘이 흐리고 눈이 날려요.',
  'snow_wind_cloudy': '구름이 많고 눈이 날려요.',
  'snow_wind_sunny': '눈이 날려요.',

  // PTY가 0 (강수 없음) → SKY만 봐야 함
  'overcast': '하늘이 흐려요.',
  'cloudy': '구름이 많아요.',
  'sunny': '맑은 날씨예요.',
};


//초단기예보 sky정보
const extractForecastSky = (forecastData) => {
  if (!forecastData) return undefined;

  const forecastMap = forecastData.reduce((acc, cur) => {
    acc[cur.category] = cur.fcstValue;
    return acc;
  }, {});

  return forecastMap.SKY;
};

const getWeatherIcon = (pty, sky) => {
  const ptyClass = PTY_ICON_MAP[pty]; // ex. 'rain', 'sunny'
  const skyClass = SKY_ICON_MAP[sky]; // ex. 'cloudy', 'clear'

  if (!ptyClass) return '';

  // sky가 clear거나 undefined/null일 때는 sky 생략
  if (!skyClass || skyClass === 'clear') {
    return ptyClass;
  }

  return `${skyClass}_${ptyClass}`;
};

//초단기실황 현재 모든 정보
const buildWeatherInfo = (shortData, airData, skyValue) => {
  if (!shortData) return null;
  const weatherInfo = shortData.reduce((acc, cur) => {
    acc[cur.category] = cur.obsrValue;
    return acc;
  }, {});

  weatherInfo.humidityStatus = getHumidityStatus(Number(weatherInfo.REH));
  weatherInfo.windSpeedStatus = getWindSpeedStatus(Number(weatherInfo.WSD));

  let firstStation = Array.isArray(airData) ? airData[0] : airData;
  if (firstStation) {
    const pm10Raw = firstStation.pm10Value;
    const pm10 = !isNaN(Number(pm10Raw)) ? Number(pm10Raw) : null;
    weatherInfo.pm10 = pm10;
    weatherInfo.pm10Grade = pm10Raw;
    weatherInfo.airQualityStatus = getAirQualityStatus(pm10);
  } else {
    weatherInfo.pm10 = null;
    weatherInfo.pm10Grade = null;
    weatherInfo.airQualityStatus = '보통';
  }

  weatherInfo.SKY = skyValue;

  const icon = getWeatherIcon(weatherInfo.PTY, weatherInfo.SKY);

  weatherInfo.weatherIcon = icon;
  weatherInfo.weatherDescription = WEATHER_DESCRIPTION_MAP[icon] || '날씨 정보를 불러올 수 없어요';
  weatherInfo.weatherColor = SKY_ICON_MAP[weatherInfo.SKY] || 'default';
 
  return weatherInfo;
};

export const useShortWeather = (lat, lon, targetTime) => {
  const [coordinates, setCoordinates] = useState(null);
  const [locationName, setLocationName] = useState('서울특별시 중구');
  const [sidoName, setSidoName] = useState('서울');
  const [localArea, setLocalArea] = useState('서울');
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (lat && lon) setCoordinates({ lat, lon });
  }, [lat, lon]);

  useEffect(() => {
    if (!lat || !lon) return;
    if (!window.kakao?.maps?.services) return;
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2RegionCode(lon, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        const region = result.find(r => r.region_type === 'H');
        if (region) {
          const cityName = extractCityName(region);
          setSidoName(cityName);
          setLocationName(`${region.region_1depth_name} ${region.region_2depth_name}`);
          setLocalArea(extractLocalArea(region.region_1depth_name));
        }
      }
    });
  }, [lat, lon]);

  const extractCityName = (region) => {
    const { region_1depth_name, region_2depth_name } = region;
    if (/(특별시|광역시|세종)/.test(region_1depth_name)) {
      return region_1depth_name.replace(/(특별시|광역시|특별자치시)/, '');
    }
    const match = region_2depth_name.match(/^(\S+?)(시|군|구)/);
    return match ? match[1] : region_2depth_name;
  };

  const extractLocalArea = (region1depth) => {
    const map = {
      '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구',
      '인천광역시': '인천', '광주광역시': '광주', '대전광역시': '대전',
      '울산광역시': '울산', '세종특별자치시': '세종', '경기도': '경기',
      '강원도': '강원', '충청북도': '충북', '충청남도': '충남', '전라북도': '전북',
      '전라남도': '전남', '경상북도': '경북', '경상남도': '경남', '제주특별자치도': '제주'
    };
    return map[region1depth] || region1depth;
  };

  const { base_date, base_time } = getBaseDateTime(new Date());
  const { nx, ny } = coordinates ? convertGRID_GPS(coordinates.lat, coordinates.lon) : { nx: null, ny: null };
  
  //초단기 실황
  const {
    data: nowWeatherData,
    isLoading: nowWeatherLoading,
    error: nowWeatherError,
    refetch: refetchNowWeather,
  } = useQuery({
    queryKey: ['nowWeather', nx, ny, base_date, base_time],
    queryFn: () => getNowTermForecast(nx, ny, base_date, base_time),
    enabled: !!nx && !!ny,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 60,
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
  });



  //초단기 예보
  const {
    data: shortWeatherData,
    isLoading: shortWeatherLoading,
    error: shortWeatherError,
    refetch: refetchShortWeather,
    dataUpdatedAt: shortWeatherUpdatedAt,
  } = useQuery({
    queryKey: ['shortWeather', nx, ny, base_date, base_time],
    queryFn: () => getUltraShortTermForecast(nx, ny, base_date, base_time),
    enabled: !!nx && !!ny,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 60,
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
    refetchInterval: hasError ? 10000 : false,
  });

  const {
    data: airData,
    isLoading: airLoading,
    error: airError,
    refetch: refetchAir,
  } = useQuery({
    queryKey: ['airQuality', localArea],
    queryFn: async () => {
      const result = await getAirQuality(localArea);
      if (result) {
        localStorage.setItem(`airQuality-${localArea}`, JSON.stringify(result));
        return result;
      }
      const cached = localStorage.getItem(`airQuality-${localArea}`);
      return cached ? JSON.parse(cached) : null;
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const sky = extractForecastSky(shortWeatherData); // 예보용 API
  const weatherInfo = buildWeatherInfo(nowWeatherData, airData, sky);


  const defaultWeatherInfo = {
    T1H: '--ºC',
    weatherDescription: '날씨 정보 불러오는중...',
    weatherIcon: 'sunny',
    weatherColor: 'default',
    windSpeedStatus: '보통',
    humidityStatus: '보통',
    airQualityStatus: '보통',
    pm10: null,
    pm10Grade: '보통',
  };
  

  const finalWeatherInfo = weatherInfo ?? defaultWeatherInfo;

  useEffect(() => {
    if (shortWeatherUpdatedAt) setLastRefreshTime(new Date(shortWeatherUpdatedAt));
  }, [shortWeatherUpdatedAt]);

  return {
    isLoading: shortWeatherLoading || airLoading,
    error: shortWeatherError || airError,
    weatherInfo: finalWeatherInfo,
    locationName,
    lastRefreshTime,
    refetch: () => {
      refetchShortWeather();
      refetchAir();
    },
  };
};