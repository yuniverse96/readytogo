import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
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
            <Route path="/welcome" element={<Welcome />} /> 
          </Routes>
      </div>
    );
  }
  
  export default Main;
  