# Authentication System Usage Guide

## Overview

The authentication system now includes secure token storage with encryption, expiration handling, and comprehensive token management.

## Key Features

✅ **Storage Mechanism**: localStorage with base64 encryption and salt  
✅ **Token Management**: Automatic expiration, validation, and cleanup  
✅ **Security**: Encrypted storage, server-side compatibility, error handling  
✅ **Integration**: Enhanced AuthContext with hooks for easy usage  

## Basic Usage

### 1. Wrap your app with AuthProvider

```tsx
// In your layout.tsx or _app.tsx
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Use authentication in components

```tsx
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Protected Routes

```tsx
import { useRequireAuth } from '@/context/AuthContext';

function ProtectedPage() {
  const auth = useRequireAuth(); // Automatically redirects if not authenticated

  return <div>This is a protected page</div>;
}
```

### 4. API Calls with Authentication

```tsx
import { useAuthenticatedFetch } from '@/context/AuthContext';

function DataComponent() {
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchData = async () => {
    try {
      const response = await authenticatedFetch('/api/protected-data');
      const data = await response.json();
      // Handle data
    } catch (error) {
      // Handle error (automatic logout on 401)
    }
  };

  return <button onClick={fetchData}>Fetch Protected Data</button>;
}
```

## Advanced Features

### Token Expiration Monitoring

```tsx
function TokenStatus() {
  const { isTokenExpiringSoon, getAuthHeader } = useAuth();

  useEffect(() => {
    if (isTokenExpiringSoon(10)) { // Check if expires in 10 minutes
      console.warn('Token expiring soon!');
      // Optionally refresh token or show warning
    }
  }, [isTokenExpiringSoon]);

  return null;
}
```

### Manual Token Operations

```tsx
import authStorage from '@/lib/auth-storage';

// Direct access to token storage (use sparingly)
const token = authStorage.getToken();
const isValid = authStorage.isTokenValid();
const expiration = authStorage.getTokenExpiration();
const authHeader = authStorage.getAuthHeader(); // Returns "Bearer <token>"

// Extend token expiration
authStorage.extendTokenExpiration(3600); // Add 1 hour

// Clear all auth data
authStorage.clearAll();
```

## Security Considerations

1. **Encryption**: Tokens are encrypted with base64 + salt (consider stronger encryption for production)
2. **Expiration**: Automatic cleanup of expired tokens
3. **Server-side Safety**: All functions check for browser environment
4. **Error Handling**: Graceful fallbacks for corrupted data
5. **Automatic Monitoring**: Background checks for token validity

## Integration with Login

The login component now uses the enhanced AuthContext:

```tsx
// In login component
const { login } = useAuth();

// After successful API response
if (result.success && result.token) {
  login(
    result.token,
    result.user,
    result.expiresIn, // seconds
    result.refreshToken // optional
  );
}
```

## Migration Notes

- Existing `localStorage.setItem('authToken', token)` calls should be replaced with the AuthContext `login()` method
- The AuthContext now provides `isAuthenticated`, `isLoading`, and `token` states
- Use `useRequireAuth()` for protected routes
- Use `useAuthenticatedFetch()` for API calls that need authentication

## Next Steps

1. Update your app's root layout to include the AuthProvider
2. Replace direct localStorage usage with AuthContext methods
3. Add protected route guards using `useRequireAuth()`
4. Implement token refresh logic if your backend supports it
5. Consider implementing stronger encryption for production use
