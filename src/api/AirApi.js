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

  const url = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('시도별 실시간 대기질 정보를 가져오지 못했습니다');

  const json = await res.json();
  // items 배열이 들어있을 거고, 그 안에 측정소별 실시간 데이터가 있을 거야.
  // 없으면 빈 배열 처리
  return json.response?.body?.items || [];
};
