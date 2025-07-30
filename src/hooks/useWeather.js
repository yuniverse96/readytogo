// src/hooks/useWeather.js
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getShortTermForecast,
  convertGRID_GPS,
  getBaseDateTime,
} from '../api/WeatherApi';

const DEFAULT_COORDINATES = {
  lat: 37.5665,
  lon: 126.9780,
};

const getHumidityStatus = (reh) => {
  if (reh === undefined) return '정보 없음';
  if (reh <= 60) return '좋음';
  if (reh <= 80) return '보통';
  return '나쁨';
};

const getWindSpeedStatus = (wsd) => {
  if (wsd === undefined) return '정보 없음';
  if (wsd <= 3) return '좋음';
  if (wsd <= 7) return '보통';
  return '나쁨';
};

const getAirQualityStatus = (pm10) => {
  if (pm10 === undefined) return '정보 없음';
  if (pm10 <= 30) return '좋음';
  if (pm10 <= 80) return '보통';
  return '나쁨';
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

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['shortTermForecast', nx, ny, base_date, base_time],
    queryFn: () => getShortTermForecast(nx, ny, base_date, base_time),
    enabled: !!nx && !!ny,
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 5,
  });

  let weatherInfo = null;

  if (data) {
    const now = new Date();
    const hour = typeof targetHour === 'number' ? targetHour : now.getHours();
    const forecastHour = Math.floor(hour / 3) * 3;
    const forecastTimeStr = `${forecastHour.toString().padStart(2, '0')}00`;

    const filteredItems = data.filter(item => item.fcstTime === forecastTimeStr);

    weatherInfo = filteredItems.reduce((acc, cur) => {
      acc[cur.category] = cur.fcstValue;
      return acc;
    }, {});

    // 상태 정보 추가
    weatherInfo.humidityStatus = getHumidityStatus(Number(weatherInfo.REH));
    weatherInfo.windSpeedStatus = getWindSpeedStatus(Number(weatherInfo.WSD));
    weatherInfo.airQualityStatus = getAirQualityStatus(Number(weatherInfo.PM10));
  }

  return {
    isLoading,
    error,
    weatherInfo,
    refetch,
  };
};
