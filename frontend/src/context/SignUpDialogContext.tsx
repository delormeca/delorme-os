import { createContext, useState, ReactNode, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/api/useCurrentUser";

type DialogProviderProps = {
  children: ReactNode;
};

const SignUpDialogContext = createContext({
    open: false,
    handleOpen: () => {},
    handleClose: () => {},
});

export const SignUpDialogProvider = ({ children }: DialogProviderProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();

  const handleOpen = () => {
    // If user is already signed in, navigate to dashboard
    if (currentUser?.email) {
      navigate('/dashboard');
      return;
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <SignUpDialogContext.Provider value={{ open, handleOpen, handleClose }}>
      {children}
    </SignUpDialogContext.Provider>
  );
};

export const useSignUpDialogContext = () => useContext(SignUpDialogContext);
