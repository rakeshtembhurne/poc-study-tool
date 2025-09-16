import apiClient from '@/lib/api-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();

    // Validate required fields
    if (!body.resetToken || !body.newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Reset token and new password are required',
        },
        { status: 400 }
      );
    }

    // Call backend API
    const backendResponse = await apiClient.post(
      `/api/v1/auth/reset-password/confirm`,
      {
        resetToken: body.resetToken,
        newPassword: body.newPassword,
      }
    );
    console.log('Reset password confirm response: ', backendResponse.data);

    if (backendResponse.status !== 200) {
      return NextResponse.json(
        {
          success: false,
          message: backendResponse.data.message || 'Password reset failed',
          error: backendResponse.data.error,
        },
        { status: backendResponse.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: backendResponse.data.message || 'Password reset successful',
      data: backendResponse.data || 'No Data',
    });
  } catch (error: any) {
    console.error('Reset password confirm API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
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
    } else {
      return NextResponse.json({
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        error: 'An unexpected error occurred. Please try again.',
      });
    }
  }
}
