import React from 'react';
import ReactDOM from 'react-dom/client';
import Main from './Main';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext'; // 경로 맞게 조정

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <HashRouter>
      <Main />
    </HashRouter>
  </AuthProvider>
);
