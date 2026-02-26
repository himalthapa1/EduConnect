import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (token) {
        // Store token
        localStorage.setItem('token', token);
        
        // Verify token and get user data
        await verifyToken();
        
        // Navigate to onboarding or dashboard
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, verifyToken]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      Completing sign in...
    </div>
  );
};

export default AuthCallback;
