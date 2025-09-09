import { NextRequest, NextResponse } from 'next/server';

interface LoginRequestBody {
  email: string;
  password: string;
}

interface BackendLoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  token?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequestBody = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get backend URL from environment variables
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Call backend API
    const backendResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    });

    const backendData: BackendLoginResponse = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: backendData.message || 'Login failed',
          error: backendData.error 
        },
        { status: backendResponse.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: backendData.message || 'Login successful',
      user: backendData.user,
      token: backendData.token,
    });

  } catch (error) {
    console.error('Login API error:', error);
    
    // Handle network errors or backend unavailable
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unable to connect to authentication service. Please try again later.',
          error: 'Backend service unavailable'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'An unexpected error occurred. Please try again.',
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
