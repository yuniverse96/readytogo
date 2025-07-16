import '../style/intro.css';
import { useNavigate } from 'react-router-dom';



function Intro() {

    const navigate = useNavigate(); 

    return (
      <div id="intro">
          <div className='txt_box'> 
              <h2>오늘 어디가?</h2>
              <p>where are you going?</p>
          </div>
          <div className='btn_wrap'>
             <button onClick={() => navigate('/Home')}>시작하기</button>
          </div>
       
      </div>
    );
  }
  
  export default Intro;
  