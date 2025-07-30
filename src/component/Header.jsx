import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthContext } from '../AuthContext';


function Header() {
 
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
  
    const handleButtonClick = async () => {
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

    const handleMenuClick = () => {
        setIsMenuOpen((prev) => !prev); 
        console.log("??",isMenuOpen)
    };

    return (
      <div>
          <div id="header">
              <div className="logo" onClick={() => navigate('/home')}>
                  <img src={`${process.env.PUBLIC_URL}/images/h_logo.png`} alt="logo" />
              </div>
              <div className='btn_all'>
                  <button type='button' className='ring'>알림</button>
                  <button type='button' className='menu' onClick={handleMenuClick}>메뉴</button>
              </div>
          </div>


          <div id='menu_pop' className={isMenuOpen ? 'on' : ''}>
              <div className='menu_card'>
                 <button onClick={handleMenuClick}>
                    닫기
                </button>  
                <button onClick={handleButtonClick}>
                    {user ? '로그아웃' : '로그인'}
                </button>
              </div>
                
          </div>
      </div>


    );
  }
  
  export default Header;
  