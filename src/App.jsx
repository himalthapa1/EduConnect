import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Documentation from './pages/Documentation/Documentation';
import Support from './pages/Support/Support';
import Contact from './pages/Contact/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Groups from './pages/Groups';
import AccountSettings from './pages/AccountSettings';
import Resources from './pages/Resources';
import StudyWithMe from './pages/StudyWithMe';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/support" element={<Support />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding/interests" element={<Onboarding />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="groups" element={<Groups />} />
              <Route path="resources" element={<Resources />} />
              <Route path="study-with-me" element={<StudyWithMe />} />
              <Route path="profile" element={<AccountSettings />} />
            </Route>
            
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
