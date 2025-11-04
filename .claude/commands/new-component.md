# Create New React Component

Generate a React component following Material-UI and project patterns.

**Arguments**: `$ARGUMENTS` - Component description (e.g., "UserProfileCard displays user info with avatar and stats")

## Steps:

1. **Determine Component Location**
   - Page component: `frontend/src/pages/`
   - Reusable UI: `frontend/src/components/`
   - Layout: `frontend/src/components/ui/`

2. **Create Component File**
   - Use PascalCase naming (e.g., `UserProfileCard.tsx`)
   - Define TypeScript interface for props
   - Use `React.FC<Props>` pattern

3. **Component Structure**
   ```typescript
   interface ComponentNameProps {
     // Props with types
   }

   const ComponentName: React.FC<ComponentNameProps> = ({ props }) => {
     // Hooks at top
     const { data, isLoading } = useQuery();
     const { handleApiError } = useErrorHandler();
     
     // Event handlers (memoized if needed)
     const handleAction = useCallback(() => {}, []);
     
     // Early returns for error states
     if (error) return <ErrorDisplay />;
     
     // Main render
     return (
       <Box sx={{ /* MUI styling */ }}>
         {/* Component JSX */}
       </Box>
     );
   };

   export default ComponentName;
   ```

4. **Styling Guidelines**
   - Use MUI `sx` prop with theme values
   - Access theme: `theme.palette.primary.main`
   - Responsive: `{ xs: 'value', md: 'value' }`
   - Use existing components from `components/ui/`

5. **Error Handling**
   - Use `useErrorHandler` hook for API errors
   - Wrap in `ErrorBoundary` for critical components
   - Show loading states with `CircularProgress`

6. **Add to Route** (if page component)
   - Import in `frontend/src/App.tsx`
   - Add `<Route>` with path
   - Add to navigation if needed

7. **Test the Component**
   - Create `ComponentName.test.tsx`
   - Test user interactions
   - Mock API calls if needed

## Examples:

Follow patterns in:
- `frontend/src/components/ui/ModernCard.tsx` - for cards
- `frontend/src/pages/Dashboard.tsx` - for pages
- `frontend/src/components/Articles/ArticlesList.tsx` - for lists

Use `StandardButton`, `ModernCard`, and other standardized components!

