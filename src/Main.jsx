import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import './style/reset.css';
import './style/common.css';
import Intro from './pages/Intro';


function Main() {
    return (
      <div id="wrap">
          <Routes>
            <Route path="/" element={<Intro />} />
            <Route path='/home' element={<Home />}></Route>
            <Route path="/login/*" element={<Login />} /> 
          </Routes>
      </div>
    );
  }
  
  export default Main;
  