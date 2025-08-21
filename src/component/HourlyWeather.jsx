import { useEffect, useState } from "react";
import { convertGRID_GPS, getBaseDateTime, getShortTermForecast, getUltraShortTermForecast } from "../api/WeatherApi";

function getWeatherIcon(pty, sky) {
  switch (pty) {
    case '1': return 'rainy';
    case '2': return 'snow_rain';
    case '3': return 'snow';
    case '4': return 'rainy';
    case '5': return 'rainy';
    case '6': return 'snow_rain';
    case '7': return 'snowy';
  }
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
    const fetchWeatherData = async () => {
      if (!lat || !lng || !meetingTime) return;

      try {
        const { nx, ny } = convertGRID_GPS(lat, lng);
        const { base_date, base_time } = getBaseDateTime();

        // 초단기예보: 날씨 아이콘용
        let ultraData = await getUltraShortTermForecast(nx, ny, base_date, base_time);
        // 단기예보: TMP(기온)용
        let shortData = await getShortTermForecast(nx, ny, base_date, base_time);

        if ((!ultraData || ultraData.length === 0) && (!shortData || shortData.length === 0)) return;

        const today = new Date();
        const fcstDate = today.toISOString().slice(0,10).replace(/-/g,"");
        let startHour = parseInt(meetingTime.slice(0, 2), 10);
        const currentMinute = today.getMinutes();
        if (currentMinute >= 0) startHour = (startHour + 1) % 24;

        const targets = Array.from({ length: 5 }, (_, i) => (startHour + i) % 24);

        const hours = targets.map(hour => {
          const targetTime = String(hour).padStart(2,'0') + '00';
          // TMP는 단기예보에서
          const tmpMatch = shortData?.find(d => d.category === "TMP" && d.fcstDate === fcstDate && d.fcstTime === targetTime);
          // PTY/SKY는 초단기예보에서
          const ptyMatch = ultraData?.find(d => d.category === "PTY" && d.fcstDate === fcstDate && d.fcstTime === targetTime);
          const skyMatch = ultraData?.find(d => d.category === "SKY" && d.fcstDate === fcstDate && d.fcstTime === targetTime);

          return {
            hour,
            temp: tmpMatch ? tmpMatch.fcstValue : null,
            weatherText: getWeatherIcon(ptyMatch?.fcstValue || '0', skyMatch?.fcstValue || '1')
          };
        });

        setHourlyData(hours);
      } catch (err) {
        console.error("예보 불러오기 실패:", err);
      }
    };

    fetchWeatherData();
  }, [lat, lng, meetingTime]);

  return (
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
  );
}
