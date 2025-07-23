import { useEffect, useRef, useState } from 'react';
import AuthInput from './AuthInput';

function KakaoMapSearch({onSelectCoordinate}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [address, setAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [coords, setCoords] = useState(null);
  const [selected, setSelected] = useState(false);
  const [search, setSearch] = useState(true);

  // 지도 초기화
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      const container = mapRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780),
        level: 3,
      };
      const mapInstance = new window.kakao.maps.Map(container, options);
      setMap(mapInstance);
    }
  }, []);

  // 주소/장소 검색
  const handleSearch = () => {
    const places = new window.kakao.maps.services.Places();
    setSearch(true);
    places.keywordSearch(address, function (data, status) {
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data); // 결과 저장
      } else {
        setSearchResults([]);
        alert('장소를 찾을 수 없습니다.');
      }
    });
  };

  // 유저가 특정 항목 선택했을 때
  const handleSelectPlace = (place) => {
    const lat = place.y;
    const lng = place.x;
    const placeName =place.place_name
    const moveLatLon = new window.kakao.maps.LatLng(lat, lng);

    map.panTo(moveLatLon);

    new window.kakao.maps.Marker({
      map,
      position: moveLatLon,
    });

    setCoords({ lat, lng });
    setSelected(true);
    setSearch(false);
    setAddress(placeName);
    // 부모에게 좌표 전달
    if (onSelectCoordinate) {
      onSelectCoordinate(lat, lng, placeName, true);

    }


  };

  useEffect(() => {
    if (searchResults.length === 0) {
      setSelected(false);
      if (onSelectCoordinate) {
        onSelectCoordinate(null, null, null, false);
      }
    }
  }, [searchResults]);


  return (
    <>
        <div className={`search_box ${search ? 'on' : ''}`}>
          <AuthInput
              label=""
              type="text"
              name="adress"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setSearch(true);
                setSearchResults([]);
              }}
              showLabel="search_input"
              placeholder="목적지를 입력해 주세요."
              showBtn="search"
              onButtonClick={handleSearch}
              btnText="검색"
          />

          {/* 검색 결과 리스트 */}
          <div className='search_list'>
            {search && searchResults.length > 0 && (
              <ul className='map_lists'>
                {searchResults.map((place) => (
                  <li
                    key={place.id}
                    onClick={() => handleSelectPlace(place)}
                    className= 'adress'
                  >
                    <h4>{place.place_name}</h4>
                    <p>{place.road_address_name || place.address_name}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      {/* 지도 표시 */}
      <div className='map_box'>
        <div ref={mapRef} className="map_area" />
      </div>

    </>
  );
}

export default KakaoMapSearch;
