import { useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackBarContext } from '@/context/SnackBarContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface UseStandardFormOptions<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema?: yup.ObjectSchema<any>;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Standard form hook with validation, error handling, and success messages
 */
export function useStandardForm<T extends FieldValues>({
  schema,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
  mode = 'onChange',
  ...formOptions
}: UseStandardFormOptions<T> = {}) {
  const { createSnackBar } = useSnackBarContext();
  const { handleApiError } = useErrorHandler();
  
  const formMethods = useForm<T>({
    ...formOptions,
    mode,
    ...(schema && { resolver: yupResolver(schema) }),
  });
  
  const { handleSubmit, formState: { isSubmitting } } = formMethods;
  
  const onSubmit = handleSubmit(
    async (data: T) => {
      try {
        await onSuccess?.(data);
        
        if (successMessage) {
          createSnackBar({
            content: successMessage,
            severity: 'success',
            autoHide: true,
          });
        }
      } catch (error) {
        if (onError) {
          onError(error);
        } else {
          handleApiError(error);
        }
        
        if (errorMessage) {
          createSnackBar({
            content: errorMessage,
            severity: 'error',
            autoHide: true,
          });
        }
      }
    },
    (errors) => {
      console.warn('Form validation errors:', errors);
    }
  );
  
  return {
    ...formMethods,
    onSubmit,
    isSubmitting,
  };
}

// Common validation schemas
export const validationSchemas = {
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
    
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
    
  confirmPassword: (passwordField = 'password') => 
    yup.string()
      .oneOf([yup.ref(passwordField)], 'Passwords must match')
      .required('Please confirm your password'),
      
  name: yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
    
  title: yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .required('Title is required'),
    
  content: yup.string()
    .min(10, 'Content must be at least 10 characters')
    .required('Content is required'),
};

// Pre-built form schemas
export const formSchemas = {
  login: yup.object({
    email: validationSchemas.email,
    password: yup.string().required('Password is required'),
  }),
  
  signup: yup.object({
    full_name: validationSchemas.name,
    email: validationSchemas.email,
    password: validationSchemas.password,
    verify_password: validationSchemas.confirmPassword('password'),
  }),
  
  forgotPassword: yup.object({
    email: validationSchemas.email,
  }),
  
  resetPassword: yup.object({
    password: validationSchemas.password,
    confirmPassword: validationSchemas.confirmPassword(),
  }),
  
  profile: yup.object({
    full_name: validationSchemas.name,
    email: validationSchemas.email,
  }),
  
  article: yup.object({
    title: validationSchemas.title,
    content: validationSchemas.content,
    is_published: yup.boolean(),
  }),

  client: yup.object({
    name: yup.string()
      .min(2, 'Name must be at least 2 characters')
      .required('Client name is required'),
    industry: yup.string().optional(),
  }),

  project: yup.object({
    client_id: yup.string().required('Client is required'),
    name: yup.string()
      .min(2, 'Name must be at least 2 characters')
      .required('Project name is required'),
    url: yup.string()
      .url('Must be a valid URL')
      .required('URL is required'),
    description: yup.string().optional(),
    sitemap_url: yup.string()
      .url('Must be a valid URL')
      .optional()
      .nullable(),
  }),
};

export default useStandardForm;
