// src/api/AirApi.js
export const getAirQuality = async (stationName) => {
    const serviceKey =  process.env.REACT_APP_AIRKOREA_API_KEY;
    const params = new URLSearchParams({
      serviceKey,
      returnType: 'json',
      stationName,
      dataTerm: 'DAILY',
      numOfRows: '1',
      pageNo: '1',
      ver: '1.3',
    });
  
    const url = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?${params.toString()}`;
  
    const res = await fetch(url);
    if (!res.ok) throw new Error('대기질 정보를 가져오지 못했습니다');
    const json = await res.json();
    return json.response.body.items[0];
  };
  