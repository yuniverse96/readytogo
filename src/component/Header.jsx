import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import useUserId from '../hooks/useUserId';
import { AuthContext } from '../AuthContext';


function Header() {
 
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
  
    const handleButtonClick = async () => {
      setIsMenuOpen(false);
    if (user) {
      try {
        await signOut(auth);
        setUser(null);
        navigate('/home');
      } catch (error) {
        console.error('로그아웃 실패:', error);
      }
    } else {
      navigate('/login');
    }
    };    
    const userId = useUserId();

    const handleMenuClick = () => {
        setIsMenuOpen((prev) => !prev); 
    };

    return (
      <>
          <div id="header">
              <div className="logo" onClick={() => navigate('/home')}>
                  <img src={`${process.env.PUBLIC_URL}/images/logo_home.png`} alt="logo" />
              </div>
              <div className='btn_all'>
                  <button type='button' className='ring'>알림</button>
                  <button type='button' className='menu' onClick={handleMenuClick}>메뉴</button>
              </div>
          </div>


          <div id='menu_pop' className={isMenuOpen ? 'on' : ''}  onClick={handleMenuClick}>
              <div className='menu_card'  onClick={(e) => e.stopPropagation()}>
                 <button className='close_btn' onClick={handleMenuClick}>
                    닫기
                </button>

                <div className='user_wrap'>
                      <div className='top_name'>
                       
                        {user ? (
                          <>
                            <div className='img_wrap'>
                                <img src={`${process.env.PUBLIC_URL}/images/favi.png`} alt="profile" />
                            </div>
                            <p>{userId}</p>
                          </>  
                          ) : (
                            <p className='login' onClick={handleButtonClick}>로그인 해주세요</p>
                          )}
                    
                      </div>

                      <ul>
                        {user && (
                          <>
                            <li className='my'>
                              <p>내 정보</p>
                            </li>
                            <li className='before' onClick={() => {navigate('/rcm_list'); handleMenuClick();}}>
                              <p>기록 모아보기</p>
                            </li>
                            <li className='messege'>
                              <p>알림</p>
                            </li>
                          </>
                        )}
                        <li className='qna'>
                          <p>문의하기</p>
                        </li>
                      </ul>
                    </div>
               
                
               
                <button className={`log_io ${user ? 'logout' : 'login'}`} onClick={handleButtonClick}>
                    <p>{user ? '로그아웃' : '로그인 하기'}</p>
                </button>
              </div>
                
          </div>
      </>


    );
  }
  
  export default Header;
  