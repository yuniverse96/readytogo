import React from 'react';
import ReactDOM from 'react-dom/client';
import Main from './Main';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import PopAlert from './component/PopAlert'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24시간


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
        <PopAlert>
          <HashRouter>
              <Main />
          </HashRouter>
        </PopAlert>
    </AuthProvider>
  </QueryClientProvider>

);
