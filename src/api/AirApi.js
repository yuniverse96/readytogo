// src/api/AirApi.js
export const getAirQuality = async (sidoName) => {
  const serviceKey = process.env.REACT_APP_AIRKOREA_API_KEY;
  const params = new URLSearchParams({
    serviceKey,
    returnType: 'json',
    sidoName,
    numOfRows: '100',
    pageNo: '1',
    ver: '1.0',
  });

  const url = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?${params}`;
  const response = await fetch(url);
  const result = await response.json();

  const items = result?.response?.body?.items;

  if (!items || items.length === 0) {
    console.warn('대기질 데이터 없음, 이전 캐시 사용 예정');
    return null;
  }

  // 성공하면 localStorage에 저장
  localStorage.setItem(`airQuality-${sidoName}`, JSON.stringify(items));
  return items;
};
