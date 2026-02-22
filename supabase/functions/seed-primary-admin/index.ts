import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if primary admin already exists
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", "Primary Admin")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: "Primary Admin already exists" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: "primary_admin@dormconnect.app",
      password: "ADMIN@123",
      email_confirm: true,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // Create profile
    await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      username: "Primary Admin",
      name: "Primary Admin",
      approved: true,
    });

    // Assign role
    await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "primary_admin",
    });

    return new Response(
      JSON.stringify({ success: true, message: "Primary Admin created successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
