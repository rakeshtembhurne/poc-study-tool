import apiClient from '@/lib/api-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, refreshToken } = body;

    // Validate required fields
    if (!userId || !refreshToken) {
      return NextResponse.json(
        { success: false, message: 'UserId and refreshToken are required' },
        { status: 400 }
      );
    }

    // Call backend API
    const backendResponse = await apiClient.post(`/api/v1/auth/refresh-token`, {
      userId,
      refreshToken,
    });
    console.log('backendResponse Data: ', backendResponse.data);

    if (backendResponse.status !== 201) {
      return NextResponse.json(
        {
          success: false,
          message: backendResponse.data.message || 'Token refresh failed',
          error: backendResponse.data.error,
        },
        { status: backendResponse.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: backendResponse.data.message || 'Tokens refreshed successfully',
      accessToken: backendResponse.data.accessToken,
      refreshToken: backendResponse.data.refreshToken,
      expiresIn: 3600 // 1 hour default, adjust based on your JWT config
    });

  } catch (error: any) {
    console.error('Refresh token API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });

    if (error.response?.data?.message) {
      return NextResponse.json(
        {
          success: false,
          message: error.response.data.message,
          error: error.response.data.error,
        },
        { status: error.response?.status }
      );
    } else if (error.code === 'ECONNABORTED') {
      return NextResponse.json({
        success: false,
        message: 'Request timeout. Please try again.',
        error: 'Request timeout. Please try again.',
      });
    } else if (error.message === 'Network Error') {
      return NextResponse.json({
        success: false,
        message: 'Network error. Please check your connection and try again.',
        error: 'Network error. Please check your connection and try again.',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        error: 'An unexpected error occurred. Please try again.',
      });
    }
  }
}