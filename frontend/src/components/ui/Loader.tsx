import { Box, CircularProgress, Container } from "@mui/material";
interface LoaderProps {
  size?: number;
}
export const Loader = ({ size }: LoaderProps) => {
  return (
    <Box
      component="div"
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{ width: "100%", height: "100vh" }}
    >
      <CircularProgress size={size || 32} />
    </Box>
  );
};

export default Loader;
