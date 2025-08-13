// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import AndroidStorageChecker from './pages/AndroidStorageChecker.jsx';
import SshManager from './pages/SshManager.jsx';
import VersivAutoConnect from './pages/VersivAutoConnect.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/android-storage" element={<AndroidStorageChecker />} />
        <Route path="/ssh" element={<SshManager />} />
        <Route path="/versiv-connectivity" element={<VersivAutoConnect />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
