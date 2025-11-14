import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  styled,
  alpha,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Dashboard,
  Person,
  Settings,
  Home,
  Menu as MenuIcon,
  Close,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Palette,
  Analytics,
  Extension,
  CreditCard,
  Business,
  Search,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/api/useCurrentUser';
import DashboardHeader from './DashboardHeader';
import { PlanBadge } from '@/components/PlanStatus';
import { useUserPlan } from '@/hooks/api/usePlans';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  minHeight: '100vh',
  background: `linear-gradient(135deg, 
    ${theme.palette.background.default} 0%, 
    ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
    
  ...theme.applyStyles("dark", {
    background: `linear-gradient(135deg, 
      ${theme.palette.background.default} 0%, 
      ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
  }),
}));

const SidebarContainer = styled(Drawer)<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
  flexShrink: 0,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  '& .MuiDrawer-paper': {
    width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
    boxSizing: 'border-box',
    background: `linear-gradient(180deg, 
      ${alpha(theme.palette.background.paper, 0.98)} 0%, 
      ${alpha(theme.palette.background.default, 0.95)} 100%)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    borderLeft: 'none',
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
    borderTop: 'none',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    zIndex: theme.zIndex.appBar - 1, // Below header
    
    // Mobile: temporary drawer (full height)
    [theme.breakpoints.down('md')]: {
      paddingTop: 0,
    },
    
    ...theme.applyStyles("dark", {
      background: `linear-gradient(180deg, 
        ${alpha(theme.palette.background.paper, 0.95)} 0%, 
        ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      borderLeft: 'none',
      borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
      borderTop: 'none',
    }),
  },
}));

const ContentArea = styled(Box)<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  width: '100%',
  flexGrow: 1,
  padding: theme.spacing(3),
  paddingTop: theme.spacing(12), // Account for header + extra spacing
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
}));

const SidebarHeader = styled(Box)<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  padding: theme.spacing(collapsed ? 1 : 2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: collapsed ? 'center' : 'space-between',
  minHeight: 56,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  ...theme.applyStyles("dark", {
    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  }),
}));

const UserCard = styled(Box)<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  background: alpha(theme.palette.primary.main, 0.05),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: theme.shape.borderRadius,
  padding: collapsed ? 0 : theme.spacing(1, 2),
  margin: theme.spacing(0.5, 1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: collapsed ? 'center' : 'flex-start',
  minHeight: 48,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const CollapseButton = styled(IconButton)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.9),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.08),
  },
}));

const LogoSection = styled(Box)<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: collapsed ? 'center' : 'flex-start',
  padding: collapsed ? theme.spacing(0.5) : theme.spacing(1, 2),
  margin: theme.spacing(0.5, 1),
  minHeight: 48,
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.08),
  },
}));

const LogoIcon = styled(Box)(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: theme.shape.borderRadius,
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main}, 
    ${theme.palette.secondary.main})`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
    color: theme.palette.common.white,
  },
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.1rem',
  background: `linear-gradient(135deg, 
    ${theme.palette.text.primary} 0%, 
    ${theme.palette.primary.main} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  letterSpacing: '-0.01em',
  marginLeft: theme.spacing(1.5),
}));

const NavItem = styled(ListItemButton)<{ collapsed?: boolean }>(({ theme, collapsed }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0.5, 1),
  padding: collapsed ? 0 : theme.spacing(1, 2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  minHeight: 48,
  width: collapsed ? 55 : 'auto',
  height: collapsed ? 48 : 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: collapsed ? 'center' : 'flex-start',
  
  '& .MuiListItemIcon-root': {
    minWidth: collapsed ? 55 : 40,
    width: collapsed ? 55 : 24,
    height: collapsed ? 48 : 24,
    margin: collapsed ? 0 : `0 ${theme.spacing(1.5)} 0 0`,
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    
    '& .MuiSvgIcon-root': {
      fontSize: '1.25rem',
    },
  },
  
  '& .MuiListItemText-root': {
    opacity: collapsed ? 0 : 1,
    visibility: collapsed ? 'hidden' : 'visible',
    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.08),
    transform: collapsed ? 'scale(1.05)' : 'translateX(4px)',
  },
  
  '&.active': {
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.15)}, 
      ${alpha(theme.palette.secondary.main, 0.1)})`,
    color: theme.palette.primary.main,
    
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  },
}));

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  top: theme.spacing(1.5),
  left: theme.spacing(2),
  zIndex: theme.zIndex.appBar,
  background: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
  
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
  
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.1),
    transform: 'scale(1.05)',
  },
}));

const getMenuItems = (userPlan?: string) => [
  {
    label: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    description: 'Overview',
    available: true,
  },
  {
    label: 'Clients',
    icon: <Business />,
    path: '/clients',
    description: 'Manage clients',
    available: true,
  },
  {
    label: 'Deep Researcher',
    icon: <Search />,
    path: '/dashboard/deep-researcher',
    description: 'AI-powered research',
    available: true,
  },
  {
    label: 'Analytics',
    icon: <Analytics />,
    path: '/dashboard/analytics',
    description: 'Performance insights',
    available: true,
    badge: userPlan === 'free' ? 'Starter+' :
           userPlan === 'starter' ? 'Pro+' : undefined,
    badgeColor: 'info' as const,
  },
  { 
    label: 'Integrations', 
    icon: <Extension />, 
    path: '/dashboard/integrations',
    description: 'Third-party apps',
    available: true,
    badge: userPlan === 'free' ? 'Starter+' : 
           userPlan === 'starter' ? 'Premium+' : 
           userPlan === 'pro' ? 'Premium+' : undefined,
    badgeColor: 'secondary' as const,
  },
  { 
    label: 'Billing', 
    icon: <CreditCard />, 
    path: '/dashboard/billing',
    description: 'Subscription & payments',
    available: true,
  },
  { 
    label: 'Profile', 
    icon: <Person />, 
    path: '/dashboard/profile',
    description: 'Account settings',
    available: true,
  },
  { 
    label: 'UI Guidelines', 
    icon: <Palette />, 
    path: '/dashboard/ui-guidelines',
    description: 'Design system',
    available: true,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { data: userPlan } = useUserPlan();
  
  const menuItems = getMenuItems(userPlan?.current_plan);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setCollapsed(!collapsed);
  };

  const isActive = (path: string) => {
    // For exact dashboard route, use exact match
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    // For sub-routes, use exact match or startsWith (for nested routes like /dashboard/my-articles/:id)
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <LogoSection
        collapsed={collapsed}
        onClick={() => navigate('/')}
      >
        {collapsed ? (
          <Box
            component="img"
            src="/assets/branding/icone_verte.png"
            alt="Delorme OS"
            sx={{
              width: 32,
              height: 32,
              objectFit: 'contain',
            }}
          />
        ) : (
          <Box
            component="img"
            src={theme.palette.mode === 'dark' ? "/assets/branding/LOGO_PRIMAIRE_BLANC.png" : "/assets/branding/LOGO_PRIMAIRE_NOIR.png"}
            alt="Delorme OS"
            sx={{
              height: 32,
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        )}
      </LogoSection>

      {/* Header with Collapse Button */}
      <SidebarHeader collapsed={collapsed}>
        {!collapsed && (
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.9rem' }}>
            Dashboard
          </Typography>
        )}
        {isMobile ? (
          <IconButton onClick={handleDrawerToggle} size="small">
            <Close />
          </IconButton>
        ) : (
          <CollapseButton onClick={handleSidebarToggle} size="small">
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </CollapseButton>
        )}
      </SidebarHeader>

      {/* User Info */}
      {currentUser && (
        <UserCard collapsed={collapsed}>
          <Avatar sx={{ 
            width: collapsed ? 32 : 40, 
            height: collapsed ? 32 : 40, 
            background: `linear-gradient(135deg, 
              ${theme.palette.primary.main}, 
              ${theme.palette.secondary.main})`,
            fontWeight: 700,
          }}>
            {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          {!collapsed && (
            <Box sx={{ flex: 1, minWidth: 0, ml: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem' }} noWrap>
                {currentUser.full_name || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {currentUser.email}
              </Typography>
            </Box>
          )}
        </UserCard>
      )}

      {/* Navigation */}
      <List sx={{ px: 0, py: 2 }}>
        {/* Quick Actions Section Header */}
        {!collapsed && (
          <ListItem sx={{ px: 2, py: 1 }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
              Quick Actions
            </Typography>
          </ListItem>
        )}
        
        <NavItem
          collapsed={collapsed}
          onClick={() => {
            navigate('/');
            if (isMobile) setMobileOpen(false);
          }}
        >
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <ListItemText 
            primary="Back to Website"
            secondary={!collapsed ? "Return to homepage" : undefined}
            slotProps={{
              primary: {
                sx: {
                  fontSize: '0.95rem',
                  fontWeight: 500,
                },
              },
              secondary: {
                sx: {
                  fontSize: '0.8rem',
                },
              },
            }}
          />
        </NavItem>

        <Divider sx={{ my: 2, mx: 2 }} />

        {/* Main Navigation Section Header */}
        {!collapsed && (
          <ListItem sx={{ px: 2, py: 1 }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
              Main Menu
            </Typography>
          </ListItem>
        )}

        {menuItems.map((item) => (
          <NavItem
            key={item.path}
            collapsed={collapsed}
            className={isActive(item.path) ? 'active' : ''}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <span>{item.label}</span>
                  {item.badge && !collapsed && (
                    <Chip 
                      label={item.badge}
                      size="small"
                      color={item.badgeColor || 'default'}
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.7rem',
                        height: 20,
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  )}
                </Box>
              }
              secondary={!collapsed ? item.description : undefined}
              slotProps={{
                primary: {
                  sx: {
                    fontSize: '0.95rem',
                    fontWeight: 500,
                  },
                },
                secondary: {
                  sx: {
                    fontSize: '0.8rem',
                  },
                },
              }}
            />
          </NavItem>
        ))}
      </List>
    </>
  );

  return (
    <MainContainer>
      {/* Dashboard Header */}
      <DashboardHeader collapsed={!isMobile && collapsed} />

      {/* Mobile Menu Button */}
      <MobileMenuButton onClick={handleDrawerToggle}>
        <MenuIcon />
      </MobileMenuButton>

      {/* Sidebar */}
      <SidebarContainer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        collapsed={!isMobile && collapsed}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: mobileOpen ? 'block' : 'none', md: 'block' },
        }}
      >
        {sidebarContent}
      </SidebarContainer>

      {/* Main Content */}
      <ContentArea collapsed={!isMobile && collapsed}>
        {children}
      </ContentArea>
    </MainContainer>
  );
} 