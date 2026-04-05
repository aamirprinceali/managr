// Server-side API route for creating manager accounts
// Uses SUPABASE_SERVICE_ROLE_KEY (never exposed to the browser)
// Called from the Settings → Team page when owner invites a manager
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password, full_name, home_id } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // Service role key is required for creating users server-side
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not set in .env.local — see setup instructions" },
      { status: 500 }
    );
  }

  // Admin Supabase client — can create users without sending confirmation emails
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create the Supabase auth user
  const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Skip confirmation email — manager can log in immediately
    user_metadata: { full_name },
  });

  if (createError || !user) {
    return NextResponse.json({ error: createError?.message ?? "Failed to create user" }, { status: 400 });
  }

  // Create their profile record linking them to their home
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: user.id,
    role: "manager",
    home_id: home_id || null,
    full_name: full_name || null,
    email,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId: user.id });
}
