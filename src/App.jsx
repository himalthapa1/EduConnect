import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
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
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
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
      </AuthProvider>
    </Router>
  );
}

export default App;
