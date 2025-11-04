import { Alert, Box, Slide, Snackbar } from "@mui/material";
import { useSnackBarContext } from "@/context/SnackBarContext";

export default function NotificationBar() {
  const { snackBar, isOpen, closeSnackBar } = useSnackBarContext();

  return (
    <Box component="div" sx={{ width: 500 }}>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ top: { xs: 70, sm: 70 } }}
        open={isOpen}
        onClose={closeSnackBar}
        message={snackBar?.content}
        TransitionComponent={Slide}
      >
        <Alert severity={snackBar?.severity || "info"}>
          {snackBar?.content}
        </Alert>
      </Snackbar>
    </Box>
  );
}
