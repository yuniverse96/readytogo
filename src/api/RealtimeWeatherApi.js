// src/api/RealtimeWeatherApi.js
import axios from 'axios';

// 1. 위경도 → 격자 좌표 변환 함수 (기상청 공식 방식 기반)
// 기존 그대로 유지
export const convertGRID_GPS = (lat, lon) => {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0;      // 격자 간격(km)
  const SLAT1 = 30.0;    // 투영 위도1(degree)
  const SLAT2 = 60.0;    // 투영 위도2(degree)
  const OLON = 126.0;    // 기준점 경도(degree)
  const OLAT = 38.0;     // 기준점 위도(degree)
  const XO = 43;         // 기준점 X좌표(GRID)
  const YO = 136;        // 기준점 Y좌표(GRID)

  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + (lat) * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
};

// 2. 발표일자/발표시간 계산 함수 (최근 발표 기준으로 자동 계산)
export const getBaseDateTime = () => {
  const now = new Date();

  // 초단기예보 기준 30분 단위 발표 시점에 맞춰서 계산
  // 10분 buffer 고려 (10분 전 데이터 기준)
  now.setMinutes(now.getMinutes() - 10);

  let base_time = '';
  let base_date = now;

  // 30분 단위로 base_time 계산 (00 or 30)
  const minutes = now.getMinutes();
  const hour = now.getHours();

  const roundedMin = minutes < 30 ? '00' : '30';
  base_time = `${hour.toString().padStart(2, '0')}${roundedMin}`;

  // 0시 0분 이전이면 전날로 날짜 조정
  if (hour === 0 && minutes < 10) {
    base_date = new Date(now.getTime() - 86400000);
    base_time = '2330';
  }

  const yyyy = base_date.getFullYear();
  const mm = (base_date.getMonth() + 1).toString().padStart(2, '0');
  const dd = base_date.getDate().toString().padStart(2, '0');

  return {
    base_date: `${yyyy}${mm}${dd}`,
    base_time,
  };
};

// 3. 초단기예보 조회 함수 (단기예보 대신 이걸로 바꿔서 쓰면 됨)
export const getUltraShortTermForecast = async (nx, ny, base_date, base_time) => {
  const serviceKey = process.env.REACT_APP_KMA_SERVICE_KEY;

  const response = await axios.get(
    'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst',
    {
      params: {
        serviceKey,
        pageNo: '1',
        numOfRows: '1000',
        dataType: 'JSON',
        base_date,
        base_time,
        nx,
        ny,
      },
    }
  );

  if (
    response.data.response &&
    response.data.response.header.resultCode === '00' &&
    response.data.response.body
  ) {
    return response.data.response.body.items.item;
  } else {
    throw new Error(`API 응답 실패: ${response.data.response?.header?.resultMsg || '응답 없음'}`);
  }
};
