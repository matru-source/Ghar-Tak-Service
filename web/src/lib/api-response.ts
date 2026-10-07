import { NextResponse } from 'next/server';

export interface ApiResponseOptions<T> {
  data?: T;
  message?: string;
  error?: string | null;
  status?: number;
  metadata?: Record<string, unknown>;
}

export function apiSuccess<T>(data: T, message: string = 'Success', status: number = 200, metadata?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      metadata,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    }
  );
}

export function apiError(error: string, status: number = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    }
  );
}

export function corsOptionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}
