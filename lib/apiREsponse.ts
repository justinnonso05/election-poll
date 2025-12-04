import { NextResponse } from 'next/server';

export function success(message: string, data: unknown, status = 200) {
  return NextResponse.json(
    {
      status: 'success',
      message,
      data,
    },
    { status }
  );
}

export function fail(message: string, data: unknown = null, status = 400) {
  return NextResponse.json(
    {
      status: 'fail',
      message,
      data,
    },
    { status }
  );
}
