import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { Box, CircularProgress } from '@mui/material';

/**
 * Home Page - Redirects to appropriate page
 * - Logged in users → Dashboard
 * - Not logged in → Login
 */
const HomePage = () => {
  const navigate = useNavigate();
  const { data: currentUser, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading) {
      if (currentUser) {
        // User is logged in, redirect to dashboard
        navigate('/dashboard');
      } else {
        // User is not logged in, redirect to login
        navigate('/login');
      }
    }
  }, [currentUser, isLoading, navigate]);

  // Show loading while checking authentication
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default HomePage;
