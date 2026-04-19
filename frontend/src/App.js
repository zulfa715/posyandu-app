import React from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return <Login />;
  }
  return <Dashboard />;
}

export default App;