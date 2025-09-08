import { NextRequest, NextResponse } from 'next/server';

interface SignupRequestBody {
  name: string;
  email: string;
  password: string;
}

interface BackendSignupResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequestBody = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Get backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    // Call backend API
    const backendResponse = await fetch(`${backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: body.name,
        email: body.email,
        password: body.password,
      }),
    });

    const backendData: BackendSignupResponse = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: backendData.message || 'Signup failed',
          error: backendData.error 
        },
        { status: backendResponse.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: backendData.message || 'Account created successfully',
      user: backendData.user,
    });

  } catch (error) {
    console.error('Signup API error:', error);
    
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
