import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { configure } from '@testing-library/react'

// Configure React Testing Library to automatically wrap interactions in act()
configure({
  // Automatically wrap user interactions in act()
  asyncUtilTimeout: 2000,
})

// Suppress third-party library warnings that we don't control (MUI animations, etc.)
// NOTE: We fixed actual bugs (like missing Dialog props) but suppress cosmetic animation warnings
const originalError = console.error

beforeEach(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') ||
       args[0].includes('was not wrapped in act') ||
       args[0].includes('TransitionGroup') ||
       args[0].includes('TouchRipple') ||
       args[0].includes('BrowserRouter') ||
       args[0].includes('ForwardRef(TouchRipple)') ||
       args[0].includes('ForwardRef(ButtonBase)') ||
       args[0].includes('ForwardRef(Popover)') ||
       args[0].includes('ForwardRef(Modal)') ||
       args[0].includes('NavBar') ||
       args[0].includes('Transition'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterEach(() => {
  console.error = originalError
})

// Mock react-hook-form with proper structure
const mockFormValues: Record<string, any> = {}

vi.mock('react-hook-form', () => ({
  Controller: ({ name, render }: any) => {
    const mockField = {
      value: mockFormValues[name] || '',
      onChange: (e: any) => {
        const value = e?.target?.value !== undefined ? e.target.value : e
        mockFormValues[name] = value
      },
      onBlur: vi.fn(),
      name,
    }
    
    // Instead of using the complex MUI TextField, render a simple input for tests
    return React.createElement('input', {
      name,
      type: name === 'password' ? 'password' : 'email',
      value: mockFormValues[name] || '',
      onChange: (e: any) => {
        mockFormValues[name] = e.target.value
        mockField.onChange(e)
      },
      onBlur: mockField.onBlur,
      'aria-label': name === 'email' ? 'Email Address' : name === 'password' ? 'Password' : name,
      placeholder: name === 'email' ? 'your@email.com' : name === 'password' ? 'Enter your password' : '',
    })
  },
  useForm: () => ({
    control: {},
    handleSubmit: (fn: any) => (e: any) => {
      e?.preventDefault?.()
      fn({ email: 'test@example.com', password: 'password123' })
    },
    formState: { errors: {}, isSubmitting: false },
    register: vi.fn(),
    reset: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn(),
  }),
  useController: () => ({
    field: {
      value: '',
      onChange: vi.fn(),
      onBlur: vi.fn(),
      name: 'test',
    },
    fieldState: { error: null },
    formState: { errors: {} },
  }),
}))

// Mock useCurrentUser hook to prevent API calls in tests
vi.mock('@/hooks/api/useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
  })),
}))

// Mock login form hook
vi.mock('@/hooks/useLoginForm', () => ({
  useLoginForm: vi.fn(() => ({
    control: {},
    handleSubmit: vi.fn(),
    formState: { errors: {}, isSubmitting: false },
  })),
}))

// Mock context providers
vi.mock('@/context/SignUpDialogContext', () => ({
  SignUpDialogProvider: ({ children }: { children: React.ReactNode }) => children,
  useSignUpDialog: () => ({
    openDialog: vi.fn(),
    closeDialog: vi.fn(),
    isOpen: false,
  }),
  useSignUpDialogContext: () => ({
    open: false,
    handleClose: vi.fn(),
  }),
}))

vi.mock('@/context/SnackBarContext', () => ({
  SnackBarProvider: ({ children }: { children: React.ReactNode }) => children,
  useSnackBarContext: () => ({
    createSnackBar: vi.fn(),
  }),
}))

// Mock API services to prevent real HTTP requests
vi.mock('@/client', () => ({
  AuthService: {
    loginApiAuthLoginPost: vi.fn(),
    signupApiAuthSignupPost: vi.fn(),
    currentUserApiAuthCurrentGet: vi.fn(),
    logoutApiAuthLogoutPost: vi.fn(),
    forgotPasswordApiAuthForgotPasswordPost: vi.fn(),
    resetPasswordApiAuthResetPasswordPost: vi.fn(),
  },
  ArticlesService: {
    listArticlesApiArticlesGet: vi.fn(),
    createArticleApiArticlesPost: vi.fn(),
    updateArticleApiArticlesIdPut: vi.fn(),
    deleteArticleApiArticlesIdDelete: vi.fn(),
  },
  PaymentsService: {
    createCheckoutSessionApiPaymentCreateCheckoutSessionPost: vi.fn(),
    getProductsApiPaymentProductsGet: vi.fn(),
    cancelSubscriptionApiPaymentCancelSubscriptionPost: vi.fn(),
  },
}))

// Mock API client to prevent network requests during tests
vi.mock('@/config/api', () => ({
  initializeApiClient: vi.fn(),
  API_BASE_URL: 'http://localhost:3000'
}))

// Mock the OpenAPI client
vi.mock('@/client', () => ({
  OpenAPI: {
    BASE: 'http://localhost:3000',
    CREDENTIALS: 'include'
  },
  // Mock all services to prevent actual API calls
  AuthService: {
    getCurrentUserApiAuthCurrentGet: vi.fn(() => 
      Promise.resolve({ 
        data: { 
          user_id: '123', 
          email: 'test@example.com', 
          full_name: 'Test User' 
        } 
      })
    ),
    loginApiAuthLoginPost: vi.fn(() => 
      Promise.resolve({ access_token: 'mock-token' })
    ),
    logoutApiAuthLogoutGet: vi.fn(() => 
      Promise.resolve({ success: true })
    ),
    signupApiAuthSignupPost: vi.fn(() => 
      Promise.resolve({ access_token: 'mock-token' })
    ),
  },
  ArticlesService: {
    listArticlesApiArticlesGet: vi.fn(() => Promise.resolve([])),
    createArticleApiArticlesPost: vi.fn(() => 
      Promise.resolve({ id: 1, title: 'Test Article' })
    ),
  },
  PaymentsService: {
    createCheckoutApiPaymentCreateCheckoutPost: vi.fn(() => 
      Promise.resolve({ url: 'https://checkout.stripe.com/test' })
    ),
  },
  DefaultService: {
    healthCheckHealthGet: vi.fn(() => 
      Promise.resolve({ status: 'healthy' })
    ),
  }
}))

// Mock API hooks to prevent real API calls during tests
vi.mock('@/hooks/api/useArticles', () => ({
  useArticles: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useCreateArticle: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  }))
}))

vi.mock('@/hooks/api/usePayments', () => ({
  useProducts: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useCreateCheckout: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
  useCheckoutWithProduct: vi.fn(() => ({
    checkoutWithProduct: vi.fn(),
    isLoading: false,
  })),
  useCreateCheckoutSession: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
  useHandleCheckoutSuccess: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
  useCancelSubscription: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
  useCreateCustomerPortal: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
  useUserPaymentInfo: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useProduct: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useSubscriptionStatus: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

// Mock router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    }),
  }
})

// Global test setup
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window properties
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: () => ({
    getPropertyValue: () => '',
  }),
}) 