import React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Avatar,
  Chip,
  styled,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  AccountCircle, 
  ExitToApp, 
  Article,
  Notifications,
  Search as SearchIcon,
  Dashboard,
  Analytics,
  Payment,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import { AuthService } from '@/client';
import { useNavigate } from 'react-router-dom';
import ColorModeIconDropdown from '@/theme/ColorModeIconDropdown';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

const profilePages = [
  { to: "/dashboard", label: "Dashboard", icon: <Dashboard /> },
  { to: "/dashboard/my-articles", label: "My Articles", icon: <Article /> },
  { to: "/dashboard/analytics", label: "Analytics", icon: <Analytics /> },
  { to: "/dashboard/billing", label: "Billing", icon: <Payment /> },
  { to: "/dashboard/profile", label: "Profile", icon: <AccountCircle /> },
];

interface DashboardHeaderProps {
  collapsed?: boolean;
}

const DashboardAppBar = styled(AppBar)<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.85)} 0%, 
    ${alpha(theme.palette.background.default, 0.80)} 100%)`,
  backdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.05)}`,
  zIndex: theme.zIndex.appBar,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  
  // Mobile: full width
  [theme.breakpoints.down('md')]: {
    width: '100%',
    marginLeft: 0,
  },
  
  // Desktop: adjust for sidebar
  [theme.breakpoints.up('md')]: {
    width: `calc(100% - ${collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH}px)`,
    marginLeft: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
  },
  
  ...theme.applyStyles('dark', {
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.15)} 0%, 
      ${alpha(theme.palette.primary.dark, 0.12)} 50%,
      ${alpha(theme.palette.background.paper, 0.08)} 100%)`,
    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
  }),
}));

const SearchButton = styled(IconButton)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.9),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: `${theme.shape.borderRadius}px`,
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.08),
  },
}));

const NotificationButton = styled(IconButton)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.9),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: `${theme.shape.borderRadius}px`,
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.08),
  },
}));

const UserChip = styled(Chip)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  fontWeight: 600,
  '& .MuiChip-avatar': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
}));

export default function DashboardHeader({ collapsed = false }: DashboardHeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const { data: currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const logOut = useMutation({
    mutationFn: AuthService.logoutApiAuthLogoutGet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      window.location.href = '/';
    },
  });

  return (
    <DashboardAppBar position="fixed" elevation={0} collapsed={!isMobile && collapsed}>
      <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }}>
        {/* Left side - can be used for breadcrumbs or page title */}
        <Box sx={{ flexGrow: 1 }}>
          {/* This space can be used for page-specific content */}
        </Box>

        {/* Right side - actions */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Search */}
          {/* <SearchButton size="small">
            <SearchIcon fontSize="small" />
          </SearchButton> */}

          {/* Notifications */}
          {/* <NotificationButton size="small">
            <Notifications fontSize="small" />
          </NotificationButton> */}

          {/* Theme Toggle */}
          <ColorModeIconDropdown />

          {/* User Menu */}
          {currentUser && (
            <Box sx={{ flexGrow: 0 }}>
              <UserChip
                avatar={<Avatar sx={{ width: 28, height: 28 }}>{currentUser.full_name?.charAt(0).toUpperCase() || 'U'}</Avatar>}
                label={currentUser.full_name?.split(' ')[0] || currentUser.email.split('@')[0]}
                onClick={handleOpenUserMenu}
                sx={{ cursor: 'pointer' }}
              />

              <Menu
                sx={{ mt: '45px' }}
                anchorEl={anchorElUser}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  },
                }}
              >
                {profilePages.map((item) => (
                  <MenuItem
                    key={item.to}
                    onClick={() => {
                      navigate(item.to);
                      handleCloseUserMenu();
                    }}
                    sx={{
                      gap: 2,
                      borderRadius: 1,
                      mx: 1,
                      my: 0.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                    <Typography>{item.label}</Typography>
                  </MenuItem>
                ))}
                <Divider sx={{ my: 1 }} />
                <MenuItem
                  onClick={() => {
                    logOut.mutate();
                    handleCloseUserMenu();
                  }}
                  sx={{
                    gap: 2,
                    borderRadius: 1,
                    mx: 1,
                    mb: 1,
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.error.main, 0.08),
                    },
                  }}
                >
                  <ExitToApp />
                  <Typography>Sign Out</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Stack>
      </Toolbar>
    </DashboardAppBar>
  );
} 