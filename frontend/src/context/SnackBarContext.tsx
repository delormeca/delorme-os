import {
  createContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
  useEffect,
  useRef,
  FC,
  useContext,
} from "react";

export type SnackBarType = {
  content: ReactNode;
  autoHide?: boolean;
  severity?: "success" | "error" | "warning" | "info";
};

export type SnackBarContextType = {
  snackBar: SnackBarType | undefined;
  isOpen?: boolean;
  createSnackBar: (snackbar: SnackBarType) => void;
  closeSnackBar?: () => void;
};

export const SnackBarContext = createContext<SnackBarContextType | undefined>(
  undefined
);

export const useSnackBarContext = (): SnackBarContextType => {
  const context = useContext(SnackBarContext);

  if (context === undefined) {
    throw new Error(
      "useSnackBarContext must be used within a SnackBarProvider"
    );
  }

  return context;
};

export const SnackBarProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [snackBar, setSnackBar] = useState<SnackBarType | undefined>(undefined);
  const timeout = useRef(0);
  const createSnackBar = useCallback((snackbar: SnackBarType) => {
    setSnackBar(snackbar);
    setIsOpen(true);
  }, []);

  const closeSnackBar = useCallback(() => {
    setSnackBar(undefined);
    setIsOpen(false);
  }, []);

  const context = useMemo(
    () => ({
      isOpen,
      snackBar,
      createSnackBar,
      closeSnackBar,
    }),
    [isOpen, snackBar, createSnackBar, closeSnackBar]
  );

  useEffect(() => {
    // Only auto-hide if explicitly set AND not an error
    if (snackBar && snackBar.autoHide && snackBar.severity !== 'error') {
      timeout.current = window.setTimeout(() => {
        setIsOpen(false);
        setSnackBar(undefined);
      }, 3000);
    }
  }, [snackBar, timeout]);

  return (
    <SnackBarContext.Provider value={context}>
      {children}
    </SnackBarContext.Provider>
  );
};
