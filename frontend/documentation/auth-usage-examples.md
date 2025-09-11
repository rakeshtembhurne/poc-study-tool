# Authentication System Usage Guide

## Overview

The authentication system provides secure token storage with encryption, automatic token refresh, expiration handling, and comprehensive route protection using Next.js 15+ with TypeScript.

## Key Features

✅ **Secure Token Storage**: localStorage with base64 encryption and salt  
✅ **Automatic Token Refresh**: Proactive refresh before expiration + 401 error handling  
✅ **Route Protection**: Layout-based protection for user routes  
✅ **Axios Integration**: Automatic token attachment and error handling  
✅ **User Data Storage**: Encrypted access tokens + plain user data in localStorage  

## Architecture

- **Frontend** → **Next.js API Routes** → **Backend** (for API calls)
- **Smart Routing**: `/api/auth/*` routes go to Next.js APIs, others to backend
- **Automatic Interceptors**: Request/response interceptors handle tokens and errors

## Basic Usage

### 1. Wrap your app with AuthProvider

```tsx
// In your root layout.tsx
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
  const { user, isAuthenticated, login, logout, isLoading, token } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.email}!</h1>
      <p>User ID: {user?.id}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Layout-Based Route Protection (Recommended)

Create protected routes using the `(user)` route group:

```tsx
// app/(user)/layout.tsx - Already implemented
'use client';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function UserLayout({ children }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
```

Any page in `app/(user)/` is automatically protected:
- `app/(user)/dashboard/page.tsx` ✅ Protected
- `app/(user)/cards/page.tsx` ✅ Protected  
- `app/(user)/learning/page.tsx` ✅ Protected

### 4. Individual Component Protection (Alternative)

```tsx
import { useRequireAuth } from '@/context/AuthContext';

function ProtectedPage() {
  const auth = useRequireAuth(); // Automatically redirects if not authenticated

  return <div>This is a protected page</div>;
}
```

### 5. API Calls with Automatic Authentication

```tsx
import apiClient from '@/lib/api-client';

function DataComponent() {
  const fetchData = async () => {
    try {
      // Token automatically attached via axios interceptor
      // header-> Authorizaion: Bearer <accessToken>
      const response = await apiClient.get('/api/v1/cards');
      console.log(response.data);
    } catch (error) {
      // 401 errors automatically trigger token refresh or logout
      console.error('API call failed:', error);
    }
  };

  return <button onClick={fetchData}>Fetch Protected Data</button>;
}
```

## Accessing Stored Data

### Access Token and User Data

```tsx
import { useAuth } from '@/context/AuthContext';
import authStorage from '@/lib/auth-storage';

function TokenInfo() {
  const { user, token, isAuthenticated } = useAuth();

  // Method 1: Via AuthContext (Recommended)
  console.log('Current user:', user); // { id: string, email: string }
  console.log('Access token:', token); // string | null
  console.log('Is authenticated:', isAuthenticated); // boolean

  // Method 2: Direct storage access (Use sparingly)
  const directToken = authStorage.getToken(); // string | null
  const authHeader = authStorage.getAuthHeader(); // "Bearer <token>" | null
  const refreshToken = authStorage.getRefreshToken(); // string | null
  const expiration = authStorage.getTokenExpiration(); // Date | null

  // Method 3: Raw localStorage access (Not recommended)
  const rawUser = localStorage.getItem('user'); // JSON string
  const userData = rawUser ? JSON.parse(rawUser) : null;

  return (
    <div>
      <p>Email: {user?.email}</p>
      <p>Token expires: {authStorage.getTokenExpiration()?.toLocaleString()}</p>
      <p>Token valid: {authStorage.isTokenValid() ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Token Expiration Monitoring

```tsx
function TokenStatus() {
  const { isTokenExpiringSoon } = useAuth();

  useEffect(() => {
    if (isTokenExpiringSoon(10)) { // Check if expires in 10 minutes
      console.warn('Token expiring soon!');
      // Token will be automatically refreshed by axios interceptor
    }
  }, [isTokenExpiringSoon]);

  return null;
}
```

## Advanced Features

### Manual Token Operations

```tsx
import authStorage from '@/lib/auth-storage';

// Check token status
const isValid = authStorage.isTokenValid();
const expiration = authStorage.getTokenExpiration();
const willExpireSoon = authStorage.willExpireSoon(5); // 5 minutes

// Get tokens
const accessToken = authStorage.getToken();
const refreshToken = authStorage.getRefreshToken();
const authHeader = authStorage.getAuthHeader(); // "Bearer <token>"

// Extend token expiration (rarely needed due to auto-refresh)
authStorage.extendTokenExpiration(3600); // Add 1 hour

// Clear all auth data
authStorage.clearAll();
```


### Custom API Calls with Authentication

```tsx
import { useAuthenticatedFetch } from '@/context/AuthContext';

function CustomApiComponent() {
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchCustomData = async () => {
    try {
      // Uses axios with automatic token handling
      const response = await authenticatedFetch('/api/v1/custom-endpoint');
      return response.data;
    } catch (error) {
      // Automatic logout on 401, other errors passed through
      console.error('Custom API call failed:', error);
    }
  };

  return <button onClick={fetchCustomData}>Custom API Call</button>;
}
```

## Security Features

1. **Encrypted Storage**: Tokens encrypted with base64 + random salt
2. **Automatic Expiration**: Expired tokens automatically removed
3. **Server-side Safety**: All functions check browser environment
4. **Error Handling**: Graceful fallbacks for corrupted data
5. **Automatic Refresh**: Proactive token refresh before expiration
6. **Request Queuing**: Multiple requests during refresh are queued
7. **Secure Headers**: Authorization headers automatically attached

## Storage Structure

### localStorage Keys:
- `auth_token_data`: Encrypted token data with expiration
- `user`: Plain JSON user data `{ id: string, email: string }`

### Encrypted Token Data Structure:
```typescript
interface TokenData {
  token: string;           // JWT access token
  expiresAt: number;       // Timestamp
  refreshToken?: string;   // JWT refresh token
}
```

## Troubleshooting

### Common Issues:

1. **"Token not found"**: Check if user is logged in via `isAuthenticated`
2. **"401 Unauthorized"**: Token expired, will auto-refresh or redirect to login
3. **"User data missing"**: Check localStorage for `user` key
4. **Route not protected**: Ensure page is in `app/(user)/` directory

### Debug Token Status:

```tsx
function DebugAuth() {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  
  return (
    <div>
      <p>Loading: {isLoading.toString()}</p>
      <p>Authenticated: {isAuthenticated.toString()}</p>
      <p>Has Token: {(!!token).toString()}</p>
      <p>Has User: {(!!user).toString()}</p>
      <p>Token Valid: {authStorage.isTokenValid().toString()}</p>
      <p>Expires: {authStorage.getTokenExpiration()?.toISOString()}</p>
    </div>
  );
}
```

## Next Steps

1. ✅ AuthProvider already configured in root layout
2. ✅ Layout-based route protection implemented
3. ✅ Axios interceptors configured for automatic token handling
4. ✅ Token refresh mechanism implemented

The authentication system is fully functional and ready for production use with proper security considerations.
