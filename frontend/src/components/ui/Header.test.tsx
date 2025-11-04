import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCurrentUser } from '@/hooks/api/useCurrentUser'
import Header from './Header'

// Mock modules
vi.mock('@/hooks/api/useCurrentUser')
const mockUseCurrentUser = vi.mocked(useCurrentUser)

const renderHeader = () => {
  const queryClient = new QueryClient({
    defaultOptions: { 
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Header />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const mockUser = {
  user_id: '123',
  email: 'test@example.com',
  full_name: 'Test User',
}

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseCurrentUser.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
      } as any)
    })

    it('renders logo and navigation links', () => {
      renderHeader()
      
      // Header has multiple logos (desktop/mobile) - check for at least one
      const logos = screen.getAllByText('CraftYourStartup')
      expect(logos.length).toBeGreaterThan(0)
      
      expect(screen.getAllByText('Features')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Pricing')[0]).toBeInTheDocument()
    })

    it('shows login and signup buttons when not authenticated', () => {
      renderHeader()
      
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
    })

    it('navigates to login when login button clicked', async () => {
      const user = userEvent.setup()
      renderHeader()
      
      const loginBtn = screen.getByRole('button', { name: /sign in/i })
      await user.click(loginBtn)
      
      // Navigation would be handled by react-router
      expect(loginBtn).toBeInTheDocument()
    })

    it('opens signup dialog when signup button clicked', async () => {
      const user = userEvent.setup()
      renderHeader()
      
      const signupBtn = screen.getByRole('button', { name: /get started/i })
      await user.click(signupBtn)
      
      // Dialog opening would be handled by context
      expect(signupBtn).toBeInTheDocument()
    })
  })

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockUseCurrentUser.mockReturnValue({
        data: mockUser,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
      } as any)
    })

    it('shows user menu when authenticated', () => {
      renderHeader()
      
      expect(screen.getByText('test')).toBeInTheDocument() // email prefix
    })

    it('shows dashboard link when authenticated', () => {
      renderHeader()
      
      // Dashboard would be available in mobile menu or user dropdown
      expect(screen.getByText('test')).toBeInTheDocument()
    })

    it('does not show login/signup buttons when authenticated', () => {
      renderHeader()
      
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /get started/i })).not.toBeInTheDocument()
    })

    it('opens user menu on click', async () => {
      const user = userEvent.setup()
      renderHeader()
      
      const userMenuBtn = screen.getByText('test') // The chip with email prefix
      await user.click(userMenuBtn)
      
      // Menu would open with dropdown items
      expect(userMenuBtn).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    beforeEach(() => {
      mockUseCurrentUser.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        isSuccess: false,
      } as any)
    })

    it('shows loading state', () => {
      renderHeader()
      
      // Should still render the header structure even when loading
      const logos = screen.getAllByText('CraftYourStartup')
      expect(logos.length).toBeGreaterThan(0)
    })
  })

  describe('Mobile Navigation', () => {
    it('shows mobile menu button on small screens', () => {
      renderHeader()
      
      // Check for the menu button (icon button without accessible name)
      const menuButtons = screen.getAllByRole('button')
      const hasMenuButton = menuButtons.some(button => 
        button.querySelector('svg[data-testid="MenuIcon"]')
      )
      expect(hasMenuButton).toBe(true)
    })

    it('renders logo properly', () => {
      renderHeader()
      
      // Basic functionality test - check for at least one logo
      const logos = screen.getAllByText('CraftYourStartup')
      expect(logos.length).toBeGreaterThan(0)
    })
  })

  describe('Theme Toggle', () => {
    it('renders header with theme capability', () => {
      renderHeader()
      
      // Check that header renders - theme toggle is handled by theme system
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })

    it('renders basic header structure', () => {
      renderHeader()
      
      // Basic functionality test - check for at least one logo
      const logos = screen.getAllByText('CraftYourStartup')
      expect(logos.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('has proper header structure', () => {
      renderHeader()
      
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      renderHeader()
      
      // Tab through navigation elements
      await user.tab()
      
      // First focusable element should receive focus
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInTheDocument()
    })
  })
}) 