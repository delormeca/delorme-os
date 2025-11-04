import React from "react";
import { FieldErrors } from "react-hook-form";
import {
  TextField,
  TextFieldProps,
} from "@mui/material";

interface InputTextProps extends Omit<TextFieldProps, "error"> {
  name: string;
  errors?: FieldErrors;
}

/**
 * Backward compatible InputText component
 * For new components, use FormInput with useStandardForm
 */
const InputText = React.forwardRef<HTMLInputElement, InputTextProps>(
  ({ name, errors, helperText, variant = 'outlined', size = 'medium', ...props }, ref) => {
    const hasError = errors && errors[name];
    const errorMessage = hasError ? (errors[name]?.message as string) : undefined;
    const finalHelperText = errorMessage || helperText;

    return (
      <TextField
        {...props}
        name={name}
        variant={variant}
        size={size}
        inputRef={ref}
        error={!!hasError}
        helperText={finalHelperText}
        margin={props.margin || 'none'}
        slotProps={{
          ...props.slotProps,
          formHelperText: {
            id: finalHelperText ? `${name}-helper-text` : undefined,
            ...props.slotProps?.formHelperText,
          },
          htmlInput: {
            'aria-describedby': finalHelperText ? `${name}-helper-text` : undefined,
            ...props.slotProps?.htmlInput,
          },
        }}
      />
    );
  }
);

InputText.displayName = 'InputText';

export default InputText;
