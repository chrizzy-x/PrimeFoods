// Shared utilities for Supabase Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}

export function errorResponse(
  message: string,
  code: string,
  status: number,
  details?: unknown,
): Response {
  return new Response(
    JSON.stringify({ data: null, error: { code, message, details: details ?? null } }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}

export function successResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ data, error: null }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function createSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
  }

  const authHeader = req.headers.get('Authorization');
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader ?? '' } },
    auth: { persistSession: false },
  });
}

export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAuth(
  req: Request,
): Promise<{ userId: string; error: Response | null }> {
  const supabase = createSupabaseClient(req);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      userId: '',
      error: errorResponse('Unauthorized', 'UNAUTHORIZED', 401),
    };
  }

  return { userId: user.id, error: null };
}
