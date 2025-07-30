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

  const { nx, ny } = coordinates
    ? convertGRID_GPS(coordinates.lat, coordinates.lon)
    : { nx: null, ny: null };
  //날씨 api
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

  return {
    isLoading: forecastLoading || airLoading,
    error: forecastError || airError,
    weatherInfo,
    refetch: () => {
      refetchForecast();
      refetchAir();
    },
  };
};

