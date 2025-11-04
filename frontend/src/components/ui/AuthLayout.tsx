import { Box, Stack, styled } from "@mui/material";
import { Outlet } from "react-router-dom";

import { SnackBarProvider } from "@/context/SnackBarContext";
import NotificationBar from "@/components/ui/NotificationBar";
import Header from "@/components/ui/Header";
import SignUpDialog from "@/components/SignUp/SignUpDialog";

const GradientContainer = styled(Stack)(({ theme }) => ({
  height: "calc((1 - var(--template-frame-height, 0)) * 100dvh)",
  minHeight: "100%",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  backgroundImage:
  "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
backgroundRepeat: "no-repeat",
...theme.applyStyles("dark", {
  backgroundImage:
    "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
}),
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
  },
}));

export default function AuthLayout() {
  return (
    <SnackBarProvider>
      <NotificationBar />
      <SignUpDialog />
      <Header />
      <Box component="main">
        <GradientContainer
          maxWidth="xs"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <Outlet />
        </GradientContainer>
      </Box>
    </SnackBarProvider>
  );
}
