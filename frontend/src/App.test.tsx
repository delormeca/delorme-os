import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

// Create a test wrapper with required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('App Component', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Just check that the app renders something
    expect(document.body).toBeInTheDocument()
  })

  it('contains main application structure', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )
    
    // Check for the main app container
    const appElement = document.querySelector('[class*="MuiBox-root"]')
    expect(appElement).toBeInTheDocument()
  })
}) 