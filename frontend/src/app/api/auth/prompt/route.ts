import apiClient from '@/lib/api-client';
import authStorage from '@/lib/auth-storage';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.prompt) {
      return NextResponse.json(
        { success: false, message: 'Prompt is required' },
        { status: 400 }
      );
    }

    const accessToken = authStorage.getToken();
    // Call backend API (instead of hardcoding localhost here)

    const backendResponse = await apiClient.post(
      `/api/v1/prompt/generate`,
      {
        text: body.prompt,
        deckName: body.deckName,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`, // ✅ JWT here
        },
      }
    );
    if (backendResponse.status !== 200) {
      return NextResponse.json(
        {
          success: false,
          message: backendResponse.data.message || 'Card generation failed',
          error: backendResponse.data.error,
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: backendResponse.data.message || 'Cards generated successfully',
      data: backendResponse.data,
    });
  } catch (error: any) {
    if (error.response?.data?.message) {
      return NextResponse.json(
        {
          success: false,
          message: error.response.data.message,
          error: error.response.data.error,
        },
        { status: error.response?.status }
      );
    }

    return NextResponse.json({
      success: false,
      message: error.message || 'Unexpected error occurred',
    });
  }
}
