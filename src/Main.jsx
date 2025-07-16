import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import './style/reset.css';
import './style/common.css';
import Intro from './pages/Intro';


function Main() {
    return (
      <div id="wrap">
          <Routes>
            <Route path="/" element={<Intro />} />
            <Route path='/home' element={<Home />}></Route>
          </Routes>
      </div>
    );
  }
  
  export default Main;
  