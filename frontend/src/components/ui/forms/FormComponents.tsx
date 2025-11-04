import React from 'react';
import {
  TextField,
  TextFieldProps,
  FormControl,
  FormLabel,
  FormHelperText,
  Box,
  Typography,
  Stack,
  styled,
  alpha,
} from '@mui/material';
import { Controller, Control, FieldErrors, FieldValues, Path } from 'react-hook-form';
import { designTokens } from '@/theme/customizations';

// Enhanced input props that extend TextField
interface FormInputProps<T extends FieldValues = FieldValues> extends Omit<TextFieldProps, 'name' | 'error'> {
  name: Path<T>;
  control: Control<T>;
  errors?: FieldErrors<T>;
  label?: string;
  helperText?: string;
  rules?: any;
}

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  spacing?: number;
  sx?: any;
}

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  children: React.ReactNode;
  sx?: any;
}

// Styled components for consistent form styling
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    transition: `all ${designTokens.animation.normal} ${designTokens.easing.standard}`,
    
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
    },
    
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: '2px',
        borderColor: theme.palette.primary.main,
      },
    },
    
    '&.Mui-error': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.error.main,
      },
    },
  },
  
  '& .MuiInputLabel-root': {
    fontWeight: designTokens.typography.weights.medium,
    
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
  
  '& .MuiFormHelperText-root': {
    fontSize: designTokens.typography.sizes.sm,
    marginTop: theme.spacing(0.5),
    
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
}));

const FormSectionContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  
  '&:last-child': {
    marginBottom: 0,
  },
}));

const FormSectionHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const FormSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: designTokens.typography.sizes.lg,
  fontWeight: designTokens.typography.weights.semibold,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(0.5),
}));

const FormSectionDescription = styled(Typography)(({ theme }) => ({
  fontSize: designTokens.typography.sizes.sm,
  color: theme.palette.text.secondary,
  lineHeight: 1.5,
}));

const FormFieldContainer = styled(FormControl)(({ theme }) => ({
  width: '100%',
  marginBottom: theme.spacing(2),
  
  '&:last-child': {
    marginBottom: 0,
  },
}));

const FormFieldLabel = styled(FormLabel)(({ theme }) => ({
  fontSize: designTokens.typography.sizes.sm,
  fontWeight: designTokens.typography.weights.medium,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(0.5),
  display: 'block',
  
  '&.Mui-required::after': {
    content: '" *"',
    color: theme.palette.error.main,
  },
}));

/**
 * Enhanced form input with React Hook Form integration
 */
export function FormInput<T extends FieldValues = FieldValues>({
  name,
  control,
  errors,
  label,
  helperText,
  rules,
  variant = 'outlined',
  size = 'medium',
  fullWidth = true,
  ...props
}: FormInputProps<T>) {
  const fieldError = errors?.[name];
  const errorMessage = fieldError?.message as string;
  
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <StyledTextField
          {...field}
          {...props}
          label={label}
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          error={!!fieldError}
          helperText={errorMessage || helperText}
          slotProps={{
            ...props.slotProps,
            formHelperText: {
              id: errorMessage || helperText ? `${name}-helper-text` : undefined,
              ...props.slotProps?.formHelperText,
            },
            htmlInput: {
              'aria-describedby': errorMessage || helperText ? `${name}-helper-text` : undefined,
              ...props.slotProps?.htmlInput,
            },
          }}
        />
      )}
    />
  );
}

/**
 * Form section for grouping related fields
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  spacing = 3,
  sx,
}) => {
  return (
    <FormSectionContainer sx={sx}>
      {(title || description) && (
        <FormSectionHeader>
          {title && (
            <FormSectionTitle variant="h6">
              {title}
            </FormSectionTitle>
          )}
          {description && (
            <FormSectionDescription>
              {description}
            </FormSectionDescription>
          )}
        </FormSectionHeader>
      )}
      <Stack spacing={spacing}>
        {children}
      </Stack>
    </FormSectionContainer>
  );
};

/**
 * Form field wrapper for custom form controls
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error = false,
  helperText,
  children,
  sx,
}) => {
  return (
    <FormFieldContainer error={error} sx={sx}>
      {label && (
        <FormFieldLabel required={required}>
          {label}
        </FormFieldLabel>
      )}
      {children}
      {helperText && (
        <FormHelperText>
          {helperText}
        </FormHelperText>
      )}
    </FormFieldContainer>
  );
};

/**
 * Form grid layout for responsive forms
 */
export const FormGrid: React.FC<{ children: React.ReactNode; columns?: number; sx?: any }> = ({
  children,
  columns = 1,
  sx,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 3,
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr',
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

// Backward compatibility
export { default as InputText } from './InputText';

export default FormInput;
