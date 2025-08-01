// src/hooks/useShortWeather.js
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
getUltraShortTermForecast,         // 초단기 예보 API 함수 (가정)
  convertGRID_GPS,
  getBaseDateTime,
} from '../api/RealtimeWeatherApi';

const DEFAULT_COORDINATES = {
    lat: 37.5665,  // 서울시 중구
    lon: 126.9780,
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
  
const PTY_ICON_MAP = {
  '0': 'clear',
  '1': 'rain',
  '2': 'rain_snow',
  '3': 'snow',
  '4': 'shower',
  '5': 'drizzle',
  '6': 'drizzle_snow',
  '7': 'snow_wind',
};

const SKY_ICON_MAP = {
  '1': 'sunny',
  '3': 'cloudy',
  '4': 'overcast',
};

const WEATHER_DESCRIPTION_MAP = {
  'rain_overcast': '하늘이 흐리고 비가 내려요.',
  'rain_cloudy': '구름이 많고, 비가내려요.',
  'rain_sunny': '비가 와요.',
  'snow_cloudy': '구름이 많고, 눈이와요.',
  'rain': '비가 내려요.',
  'snow': '눈이 와요.',
  'overcast': '하늘이 흐려요.',
  'cloudy': '구름이 많아요.',
  'sunny': '맑은 날씨예요.',
  'rain_snow_cloudy': '구름이 많고 비와 눈이 내려요.',
};

function getWeatherIcon(pty, sky) {
  const icons = [];

  if (pty && pty !== '0') {
    icons.push(PTY_ICON_MAP[pty] || 'unknown');
  }

  if (sky) {
    icons.push(SKY_ICON_MAP[sky] || 'unknown');
  }

  return icons.join('_');
}

export const useShortWeather = (lat, lon, targetTime) => {
  const [coordinates, setCoordinates] = useState(null);
  const [locationName, setLocationName] = useState('서울특별시 중구');
  const [sidoName, setSidoName] = useState('서울');
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  useEffect(() => {
    if (lat && lon) setCoordinates({ lat, lon });
  }, [lat, lon]);

  // 카카오 API 지역명 가져오기 (기존과 동일)
  useEffect(() => {
    if (!lat || !lon) return;
    if (!window.kakao?.maps?.services) {
      setLocationName('서울특별시 중구');
      return;
    }

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2RegionCode(lon, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        const region = result.find(r => r.region_type === 'H');
        if (region) {
          const cityName = extractCityName(region);
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
    if (/(특별시|광역시|세종)/.test(region_1depth_name)) {
      return region_1depth_name.replace(/(특별시|광역시|특별자치시)/, '');
    }
    return region_2depth_name.replace(/시$/, '');
  };

  // 시간 처리 - 초단기예보는 targetTime: "HHmm" 형식 (예: "1430")를 받아서 그대로 쓰거나 없으면 현재 시간 기준으로 세팅
  const { base_date, base_time } = getBaseDateTime(targetTime);

  const { nx, ny } = coordinates
    ? convertGRID_GPS(coordinates.lat, coordinates.lon)
    : { nx: null, ny: null };

  // 초단기 예보 쿼리
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
    refetchInterval: 1000 * 60 * 3,
    onSuccess: (data) => {
      console.log('초단기예보 API 성공:', data);
    },
    onError: (error) => {
      console.error('초단기예보 API 에러:', error);
    }
  });


  // 대기질 API 쿼리 (기존 그대로)
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
      if (!res.ok) throw new Error(`HTTP 에러: ${res.status}`);
      const json = await res.json();

      if (json.response?.header?.resultCode !== '00') {
        throw new Error(`API 오류: ${json.response.header.resultMsg || '알 수 없음'}`);
      }

      return json.response.body.items || [];
    },
    staleTime: 1000 * 60 * 60,
    retry: 1,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('대기질 API 에러:', error);
    },
  });

  let weatherInfo = null;

  if (shortWeatherData) {
    // 초단기예보 데이터에서 필요한 카테고리별 값만 추출
    weatherInfo = shortWeatherData.reduce((acc, cur) => {
      acc[cur.category] = cur.fcstValue;
      return acc;
    }, {});

    weatherInfo.humidityStatus = getHumidityStatus(Number(weatherInfo.REH));
    weatherInfo.windSpeedStatus = getWindSpeedStatus(Number(weatherInfo.WSD));
  }

  if (weatherInfo && airData) {
    let firstStation = null;

    if (Array.isArray(airData)) {
      firstStation = airData.length > 0 ? airData[0] : null;
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

  useEffect(() => {
    if (shortWeatherUpdatedAt) {
      setLastRefreshTime(new Date(shortWeatherUpdatedAt));
    }
  }, [shortWeatherUpdatedAt]);

  return {
    isLoading: shortWeatherLoading || airLoading,
    error: shortWeatherError || airError,
    weatherInfo,
    locationName,
    lastRefreshTime,
    refetch: () => {
      refetchShortWeather();
      refetchAir();
    },
  };
};
