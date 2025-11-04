import * as React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { MenuItem, Stack, Chip, Avatar } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import { CTAButton } from "./StandardButton";
import {
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  SwipeableDrawer,
  alpha,
  styled,
  useTheme,
} from "@mui/material";
import {
  Close,
  Rocket,
  Login,
  PersonAdd,
  AccountCircle,
  ExitToApp,
  Article,
  Dashboard,
  Analytics,
  Help,
  Policy,
  Description,
  Payment,
} from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/api/useCurrentUser";
import { AuthService } from "@/client";
import ColorModeIconDropdown from "@/theme/ColorModeIconDropdown";

const pages = [
  ["Features", "/#features"],
  ["Testimonials", "/#testimonials"],
  ["FAQ", "/#faq"],
  ["Pricing", "/pricing"],
];

const profilePages = [
  { to: "dashboard", label: "Dashboard", icon: <Dashboard /> },
  { to: "dashboard/my-articles", label: "My Articles", icon: <Article /> },
  { to: "dashboard/analytics", label: "Analytics", icon: <Analytics /> },
  { to: "dashboard/profile", label: "Profile", icon: <AccountCircle /> },
];

const secondaryMenuPages = [
  { to: "dashboard/billing", label: "Billing", icon: <Payment /> },
  { to: "/pricing", label: "Pricing", icon: <Payment /> },
  { to: "/privacy", label: "Privacy Policy", icon: <Policy /> },
  { to: "/terms", label: "Terms of Service", icon: <Description /> },
];

const ModernAppBar = styled(AppBar)(({ theme }) => ({
  position: "fixed",
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.85)} 0%, 
    ${alpha(theme.palette.background.default, 0.8)} 100%)`,
  backdropFilter: "blur(20px)",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.05)}`,
  zIndex: theme.zIndex.appBar,
  ...theme.applyStyles("dark", {
    background: `linear-gradient(135deg, 
      ${alpha(theme.palette.primary.main, 0.15)} 0%, 
      ${alpha(theme.palette.primary.dark, 0.12)} 50%,
      ${alpha(theme.palette.background.paper, 0.08)} 100%)`,
    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
  }),
}));

const LogoIcon = styled(Box)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: `${theme.shape.borderRadius}px`,
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main}, 
    ${theme.palette.secondary.main})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
  "& .MuiSvgIcon-root": {
    fontSize: "1.5rem",
    color: theme.palette.common.white,
  },
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "1.25rem",
  background: `linear-gradient(135deg, 
    ${theme.palette.text.primary} 0%, 
    ${theme.palette.primary.main} 100%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  letterSpacing: "-0.01em",
}));

const UserChip = styled(Chip)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  fontWeight: 600,
  "& .MuiChip-avatar": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
}));

export default function NavBar() {
  const theme = useTheme();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null
  );
  const [open, setOpen] = React.useState(false);

  const { data: currentUser } = useCurrentUser();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isActiveLink = (path: string) => location.pathname.includes(path);

  const logOut = useMutation({
    mutationFn: AuthService.logoutApiAuthLogoutGet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      window.location.href = location.pathname;
    },
  });

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const iOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const getRedirectPath = () => {
    const skipPaths = ["/login", "/signup", "/forget"];
    return skipPaths.includes(location.pathname) ? "/" : location.pathname;
  };

  const handleNavigation = (href: string) => {
    if (href.startsWith("/#")) {
      // Handle anchor links for same-page sections
      const sectionId = href.substring(2); // Remove /#
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        // If we're not on the home page, navigate there first
        if (location.pathname !== "/") {
          window.location.href = href;
        }
      }
    } else {
      // Regular navigation
      window.location.href = href;
    }
  };

  return (
    <ModernAppBar elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: { xs: 70, md: 80 } }}>
          {/* Logo - Desktop */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1.5,
              textDecoration: "none",
              color: "text.primary",
              transition: "transform 0.2s ease-out",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <LogoIcon>
                <Rocket />
              </LogoIcon>
              <LogoText variant="h6">CraftYourStartup</LogoText>
            </a>
          </Box>

          {/* Mobile Menu Button */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              width: 48, // Fixed width for symmetry
              justifyContent: "flex-start",
            }}
          >
            <IconButton
              size="large"
              onClick={toggleDrawer(true)}
              sx={{
                color: "text.primary",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Mobile Drawer */}
            <SwipeableDrawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              onOpen={toggleDrawer(true)}
              disableSwipeToOpen={false}
              disableBackdropTransition={!iOS}
              disableDiscovery={iOS}
              PaperProps={{
                sx: {
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.background.paper, 0.95)} 0%, 
                    ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                  backdropFilter: "blur(20px)",
                  borderRadius: `0 0 ${theme.shape.borderRadius * 1.5}px ${
                    theme.shape.borderRadius * 1.5
                  }px`,
                  ...theme.applyStyles("dark", {
                    background: `linear-gradient(135deg, 
                      ${alpha(theme.palette.primary.main, 0.2)} 0%, 
                      ${alpha(theme.palette.primary.dark, 0.15)} 50%,
                      ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
                    borderBottom: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.3
                    )}`,
                  }),
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  borderBottom: `1px solid ${alpha(
                    theme.palette.divider,
                    0.1
                  )}`,
                  ...theme.applyStyles("dark", {
                    borderBottom: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.3
                    )}`,
                  }),
                }}
              >
                <a
                  href="/"
                  onClick={toggleDrawer(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <LogoIcon>
                    <Rocket />
                  </LogoIcon>
                  <LogoText variant="h6">CraftYourStartup</LogoText>
                </a>
                <IconButton onClick={toggleDrawer(false)}>
                  <Close />
                </IconButton>
              </Box>

              <List sx={{ py: 2 }}>
                {pages.map(([page, href]) => (
                  <ListItem key={page} disablePadding>
                    <ListItemButton
                      sx={{ m: 1, borderRadius: 2 }}
                      onClick={() => {
                        handleNavigation(href);
                        toggleDrawer(false)();
                      }}
                    >
                      <ListItemText
                        primary={page}
                        primaryTypographyProps={{ fontWeight: 600 }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}

                {currentUser?.email && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    {/* Primary user menu items */}
                    {profilePages.map((item) => (
                      <ListItem key={item.to} disablePadding>
                        <ListItemButton
                          sx={{ m: 1, borderRadius: 2 }}
                          selected={isActiveLink(item.to)}
                          onClick={toggleDrawer(false)}
                        >
                          <Link
                            to={item.to}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            <Box sx={{ mr: 2, color: "primary.main" }}>
                              {item.icon}
                            </Box>
                            <ListItemText
                              primary={item.label}
                              slotProps={{
                                primary: {
                                  sx: {
                                    fontWeight: 500,
                                  },
                                },
                              }}
                            />
                          </Link>
                        </ListItemButton>
                      </ListItem>
                    ))}

                    <Divider sx={{ my: 1 }} />

                    {/* Secondary menu items */}
                    {secondaryMenuPages.map((item) => (
                      <ListItem key={item.to} disablePadding>
                        <ListItemButton
                          sx={{ m: 1, borderRadius: 2 }}
                          selected={isActiveLink(item.to)}
                          onClick={toggleDrawer(false)}
                        >
                          <Link
                            to={item.to}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            <Box sx={{ mr: 2, color: "text.secondary" }}>
                              {item.icon}
                            </Box>
                            <ListItemText
                              primary={item.label}
                              primaryTypographyProps={{
                                fontWeight: 400,
                                color: "text.secondary",
                              }}
                            />
                          </Link>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </>
                )}

                <Divider sx={{ my: 2 }} />

                {!currentUser?.email ? (
                  <Box sx={{ px: 3, py: 2 }}>
                    <Stack spacing={2}>
                      <Link
                        to={`/login?next=${getRedirectPath()}`}
                        style={{ textDecoration: "none" }}
                      >
                        <CTAButton
                          fullWidth
                          startIcon={<Login />}
                          onClick={toggleDrawer(false)}
                        >
                          Sign In
                        </CTAButton>
                      </Link>
                      <Link to="/signup" style={{ textDecoration: "none" }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<PersonAdd />}
                          onClick={toggleDrawer(false)}
                          sx={{ borderRadius: 3 }}
                        >
                          Sign Up
                        </Button>
                      </Link>
                    </Stack>
                  </Box>
                ) : (
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{ m: 1, borderRadius: 2 }}
                      onClick={() => {
                        logOut.mutate();
                        toggleDrawer(false);
                      }}
                    >
                      <Box sx={{ mr: 2, color: "error.main" }}>
                        <ExitToApp />
                      </Box>
                      <ListItemText
                        primary="Sign Out"
                        primaryTypographyProps={{
                          fontWeight: 500,
                          color: "error.main",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )}
              </List>
            </SwipeableDrawer>
          </Box>

          {/* Logo - Mobile */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              justifyContent: "center",
            }}
          >
            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <LogoIcon>
                <Rocket />
              </LogoIcon>
              <LogoText variant="h6">CraftYourStartup</LogoText>
            </a>
          </Box>

          {/* Desktop Navigation */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
            }}
          >
            {pages.map(([page, href]) => (
              <Button
                key={page}
                onClick={() => handleNavigation(href)}
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  textTransform: "none",
                  padding: theme.spacing(1, 2),
                  borderRadius: theme.spacing(1.5),
                  transition: "all 0.2s ease-out",
                  cursor: "pointer",
                  "&:hover": {
                    color: "primary.main",
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    transform: "translateY(-1px)",
                  },
                }}
              >
                {page}
              </Button>
            ))}
          </Box>

          {/* Right Side Actions */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              // Fixed width on mobile for symmetry with left side
              width: { xs: 48, md: "auto" },
              justifyContent: { xs: "flex-end", md: "flex-start" },
            }}
          >
            <ColorModeIconDropdown />

            {/* User Menu */}
            {currentUser?.email ? (
              <Box sx={{ flexGrow: 0 }}>
                {/* Desktop: Show chip with username */}
                <UserChip
                  avatar={
                    <Avatar sx={{ width: 28, height: 28 }}>
                      {currentUser.email.charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  label={currentUser.email.split("@")[0]}
                  onClick={handleOpenUserMenu}
                  sx={{
                    cursor: "pointer",
                    display: { xs: "none", sm: "flex" },
                  }}
                />

                {/* Mobile: Show only circle avatar */}
                <IconButton
                  onClick={handleOpenUserMenu}
                  sx={{
                    display: { xs: "flex", sm: "none" },
                    p: 0.5,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: "primary.main",
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {currentUser.email.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>

                <Menu
                  sx={{ mt: "45px" }}
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  keepMounted
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  PaperProps={{
                    sx: {
                      borderRadius: 2,
                      boxShadow: `0 8px 25px ${alpha(
                        theme.palette.primary.main,
                        0.15
                      )}`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    },
                  }}
                >
                  {/* Primary user menu items */}
                  {profilePages.map((item) => (
                    <MenuItem
                      key={item.to}
                      onClick={handleCloseUserMenu}
                      sx={{
                        gap: 2,
                        borderRadius: 1,
                        mx: 1,
                        my: 0.5,
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.08
                          ),
                        },
                      }}
                    >
                      <NavLink
                        to={item.to}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        <Box sx={{ color: "primary.main" }}>{item.icon}</Box>
                        <Typography>{item.label}</Typography>
                      </NavLink>
                    </MenuItem>
                  ))}

                  <Divider sx={{ my: 1 }} />

                  {/* Secondary menu items */}
                  {secondaryMenuPages.map((item) => (
                    <MenuItem
                      key={item.to}
                      onClick={handleCloseUserMenu}
                      sx={{
                        gap: 2,
                        borderRadius: 1,
                        mx: 1,
                        my: 0.5,
                        "&:hover": {
                          backgroundColor: alpha(
                            theme.palette.text.secondary,
                            0.05
                          ),
                        },
                      }}
                    >
                      <NavLink
                        to={item.to}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        <Box sx={{ color: "text.secondary" }}>{item.icon}</Box>
                        <Typography
                          sx={{ color: "text.secondary", fontSize: "0.875rem" }}
                        >
                          {item.label}
                        </Typography>
                      </NavLink>
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
                      color: "error.main",
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.error.main, 0.08),
                      },
                    }}
                  >
                    <ExitToApp />
                    <Typography>Sign Out</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Stack
                direction="row"
                spacing={1}
                sx={{ display: { xs: "none", md: "flex" } }}
              >
                <Link
                  to={`/login?next=${getRedirectPath()}`}
                  style={{ textDecoration: "none" }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Login />}
                    sx={{
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" style={{ textDecoration: "none" }}>
                  <CTAButton
                    sx={{ borderRadius: 3, px: 2 }}
                    startIcon={<PersonAdd />}
                  >
                    Get Started
                  </CTAButton>
                </Link>
              </Stack>
            )}
          </Stack>
        </Toolbar>
      </Container>
    </ModernAppBar>
  );
}
