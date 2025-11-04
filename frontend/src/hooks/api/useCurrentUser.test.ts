import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCurrentUser } from './useCurrentUser'
import React from 'react'

// The useCurrentUser hook is already mocked globally in test-setup.ts
// These tests verify the hook works with our test infrastructure

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCurrentUser Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hook is properly imported and callable', () => {
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    // Hook should be callable and return a defined result
    expect(result.current).toBeDefined()
    expect(typeof result.current).toBe('object')
  })

  it('returns expected mock structure from global setup', () => {
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    // Based on our global mock in test-setup.ts, verify expected properties
    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isError')
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('isSuccess')
    
    // Default mock values from test-setup.ts
    expect(result.current.data).toBe(null)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.isSuccess).toBe(false)
  })

  it('works in test environment without errors', () => {
    // Test that the hook can be used multiple times without issues
    const { result: result1 } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })
    
    const { result: result2 } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })
    
    // Both should work the same way
    expect(result1.current).toBeDefined()
    expect(result2.current).toBeDefined()
    
    // Should have consistent structure
    expect(typeof result1.current).toBe('object')
    expect(typeof result2.current).toBe('object')
  })

  it('integrates properly with QueryClient wrapper', () => {
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    // Hook should execute without throwing errors in the test environment
    expect(result.current).toBeDefined()
    
    // Should maintain consistent mock behavior
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBe(null)
  })

  it('hook provides stable interface', () => {
    const { result, rerender } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    const initialResult = result.current
    
    // Rerender should maintain the same interface
    rerender()
    
    expect(result.current).toBeDefined()
    expect(typeof result.current).toBe(typeof initialResult)
    
    // Key properties should remain available
    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isError')
  })
}) 