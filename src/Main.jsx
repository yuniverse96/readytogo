import { Routes, Route } from 'react-router-dom';
import Header from './component/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import Recommend from './pages/Recommend'; 
import Spotarea from './pages/Spotarea'; 
import ResultCloset from './pages/ResultCloset'; 
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
            <Route path="/recommend" element={<Recommend />} />
            <Route path="/spotarea" element={<Spotarea />} />
            <Route path="/result_closet" element={<ResultCloset />} />
          </Routes>
      </div>
    );
  }
  
  export default Main;
  