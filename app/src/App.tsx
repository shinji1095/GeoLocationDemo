import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import NavigationPage from './pages/NavigationPage'; 
import FetchPage from './pages/FetchPage';
import ClassificationPage from './pages/ClassificationPage';
import CrosswalkPage from './pages/CroswalkPage';
import StreamingPage from './pages/StreamingPage';
import AudioDelayPage from './pages/AudioDelayPage';


const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/navigation" element={<NavigationPage />} /> 
          <Route path="/fetch" element={<FetchPage />} />
          <Route path="/classification" element={<ClassificationPage />} />
          <Route path="/crosswalk" element={<CrosswalkPage />} />
          <Route path="/stream" element={<StreamingPage />} />
          <Route path='/delay' element={<AudioDelayPage />}/>
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
