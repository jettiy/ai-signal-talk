import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/backend';

const copy = {
  missingCredentials: '\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694.',
  invalidCredentials: '\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
  serverFailed: '\uC11C\uBC84 \uC5F0\uACB0\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.',
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: copy.missingCredentials }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/v2/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || copy.invalidCredentials },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: copy.serverFailed }, { status: 500 });
  }
}
