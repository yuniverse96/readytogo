// src/api/WeatherApi.js
import axios from 'axios';

// 1. 위경도 → 격자 좌표 변환 함수 (기상청 공식 방식 기반)
// 여긴 서울 기준 대충 하드코딩한 예시 (필요시 정밀하게 구현 가능)
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
  const RADDEG = 180.0 / Math.PI;

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

  // 기상청 발표 시간 리스트 (하루 8회)
  const timeList = [2300, 2000, 1700, 1400, 1100, 800, 500, 200];
  let base_time = '0200';
  let base_date = now;

  for (let t of timeList) {
    const hour = Math.floor(t / 100);
    const min = t % 100;
    const checkTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, min);

    if (now >= checkTime) {
      base_time = t.toString().padStart(4, '0');
      break;
    }
  }

  // 0시~1시59분 사이면 전날 23시 발표 시간 기준
  if (now.getHours() < 2) {
    base_date = new Date(now.getTime() - 86400000);
    base_time = '2300';
  }

  const yyyy = base_date.getFullYear();
  const mm = (base_date.getMonth() + 1).toString().padStart(2, '0');
  const dd = base_date.getDate().toString().padStart(2, '0');

  return {
    base_date: `${yyyy}${mm}${dd}`,
    base_time,
  };
};

// 3. 단기예보 조회 함수
export const getShortTermForecast = async (nx, ny, base_date, base_time) => {
    const serviceKey = process.env.REACT_APP_KMA_SERVICE_KEY; // 인코딩된 키
  
    const response = await axios.get('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst', {
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
    });
  

    // 방어 로직 추가
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
  