import apiClient from '@/lib/api-client';
import { NextRequest, NextResponse } from 'next/server';
import { LoginRequestBody } from '@/interfaces/auth.interface';

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

    // Call backend API
    const backendResponse = await apiClient.post(`/api/v1/auth/login`, {
      email: body.email,
      password: body.password,
    });
    // console.log('backendResponse Data: ', backendResponse.data);

    if (backendResponse.status !== 201) {
      return NextResponse.json(
        {
          success: false,
          message: backendResponse.data.message || 'Login failed',
          error: backendResponse.data.error,
        },
        { status: backendResponse.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: backendResponse.data.message || 'Login successful',
      data: backendResponse.data || 'No Data',
    });
  } catch (error: any) {
    // console.error('Login API error:', {
    //   message: error.message,
    //   response: error.response?.data,
    //   status: error.response?.status,
    // });

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
