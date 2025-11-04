import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";

import { SnackBarProvider } from "@/context/SnackBarContext";
import NotificationBar from "@/components/ui/NotificationBar";
import Header from "@/components/ui/Header";
import SignUpDialog from "@/components/SignUp/SignUpDialog";
import Footer from "@/components/ui/Footer";

export default function MainLayout() {
  const location = useLocation();
  
  // Dashboard routes that shouldn't show the main header and footer
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  return (
    <SnackBarProvider>
      <NotificationBar />
      <SignUpDialog />
      {!isDashboardRoute && <Header />}
      <Box component="main">
        <Outlet />
      </Box>
      {!isDashboardRoute && <Footer />}
    </SnackBarProvider>
  );
}
