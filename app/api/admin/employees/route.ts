import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { createEmployeeAccount } from '@/src/features/employees/createEmployee';
import { createSupabaseAdminClient } from '@/src/lib/supabaseAdmin';

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function createUserClient(authorization: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error('Brak konfiguracji Supabase po stronie serwera.');
  }

  return createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return jsonError('Brak aktywnej sesji administratora.', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Nieprawidlowe dane formularza.', 400);
  }

  try {
    const employee = await createEmployeeAccount({
      userClient: createUserClient(authorization),
      adminClient: createSupabaseAdminClient(),
      input: body as {
        email: string;
        fullName: string;
        jobTitle: string;
        temporaryPassword: string;
      },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError(error.issues[0]?.message ?? 'Nieprawidlowe dane.', 400);
    }
    const message =
      error instanceof Error ? error.message : 'Nie udalo sie utworzyc konta.';
    const status =
      message.includes('Brak aktywnej sesji') ||
      message.includes('Brak uprawnien')
        ? 403
        : 500;
    return jsonError(message, status);
  }
}
