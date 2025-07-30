import React from 'react';
import ReactDOM from 'react-dom/client';
import Main from './Main';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <HashRouter>
        <Main />
      </HashRouter>
    </AuthProvider>
  </QueryClientProvider>

);
