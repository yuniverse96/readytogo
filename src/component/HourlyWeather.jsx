import { useEffect, useState } from "react";
import { convertGRID_GPS, getBaseDateTime, getShortTermForecast } from "../api/WeatherApi";

function getWeatherIcon(pty, sky) {
    // PTY 우선
    switch (pty) {
      case '0': // 강수 없음
        break; // PTY 없으면 SKY로 판단
      case '1': return 'rainy';         // 비
      case '2': return 'snow_rain';     // 진눈깨비
      case '3': return 'snow';          // 눈
      case '4': return 'rainy';         // 소나기 
      case '5': return 'rainy';       // 비로 통합
      case '6': return 'snow_rain';     // 눈+이슬비 -> 진눈깨비
      case '7': return 'snowy';          // 눈+바람 -> 눈구름
      default: return 'sunny';          // 예외 처리
    }
  
    // PTY가 없으면 SKY로 판단
    switch (sky) {
      case '1': return 'sunny';
      case '3': return 'partlycloudy';
      case '4': return 'overcast_cloudy';
      default: return 'sunny';
    }
  }
  

export default function HourlyWeather({ lat, lng, meetingTime }) {
  const [hourlyData, setHourlyData] = useState([]);

  useEffect(() => {
    const fetchShortTermData = async () => {
      if (!lat || !lng || !meetingTime) return;

      try {
        const { nx, ny } = convertGRID_GPS(lat, lng);
        const { base_date, base_time } = getBaseDateTime();
        const data = await getShortTermForecast(nx, ny, base_date, base_time);
        if (!data) return;

        const today = new Date();
        const fcstDate = today.toISOString().slice(0,10).replace(/-/g,"");

        let startHour = parseInt(meetingTime.slice(0, 2), 10);
        const currentMinute = today.getMinutes();
        // 현재 시각 포함하지 않으려면 +1
        if (currentMinute >= 0) startHour = (startHour + 1) % 24;

        const targets = Array.from({ length: 5 }, (_, i) => (startHour + i) % 24);

        const hours = targets.map(hour => {
          const targetTime = String(hour).padStart(2,'0') + '00';
          const tmpMatch = data.find(d => d.category === "TMP" && d.fcstDate === fcstDate && d.fcstTime === targetTime);
          const ptyMatch = data.find(d => d.category === "PTY" && d.fcstDate === fcstDate && d.fcstTime === targetTime);
          const skyMatch = data.find(d => d.category === "SKY" && d.fcstDate === fcstDate && d.fcstTime === targetTime);

          return {
            hour,
            temp: tmpMatch ? tmpMatch.fcstValue : null,
            weatherText: getWeatherIcon(ptyMatch?.fcstValue || '0', skyMatch?.fcstValue || '1')
          };
        });

        setHourlyData(hours);
      } catch (err) {
        console.error("단기예보 불러오기 실패:", err);
      }
    };

    fetchShortTermData();
  }, [lat, lng, meetingTime]);

  return (
    <>
      <ul>
        {hourlyData.map((item, i) => (
          <li key={i}>
            <span className="time">{String(item.hour).padStart(2, "0")}:00</span>
            <div className={`icon_wrap ${item.weatherText}`}>
                <img src={`${process.env.PUBLIC_URL}/images/mini_${item.weatherText}.svg`} alt={item.weatherText}/>
            </div>
            <p className="temp">{item.temp !== null ? `${item.temp}°C` : "--"}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
