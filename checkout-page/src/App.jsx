import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Failure from './pages/Failure';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success" element={<Success />} />
          <Route path="/failure" element={<Failure />} />
          <Route path="*" element={<div className="p-10 text-center">Page Not Found</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
