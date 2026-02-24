const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_ID = "app_135f61bfd908558b3c07fd6580d58192";

/**
 * Cloud verification endpoint for World ID proofs.
 * Uses the official /api/v2/verify/{app_id} endpoint per:
 * https://docs.world.org/world-id/id/cloud
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { proof, merkle_root, nullifier_hash, verification_level, action, signal_hash } = body;

    if (!proof || !merkle_root || !nullifier_hash) {
      return new Response(
        JSON.stringify({ verified: false, error: "missing_fields", detail: "Missing required proof fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the World ID Developer Portal verify API
    const verifyUrl = `https://developer.worldcoin.org/api/v2/verify/${APP_ID}`;

    console.log(`[WorldID] Verifying proof (level: ${verification_level || "device"}, action: ${action || "destaker-verify"})`);

    const verifyPayload: Record<string, string> = {
      nullifier_hash,
      merkle_root,
      proof,
      verification_level: verification_level || "device",
      action: action || "destaker-verify",
    };

    // Only include signal_hash if provided
    if (signal_hash) {
      verifyPayload.signal_hash = signal_hash;
    }

    const verifyRes = await fetch(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verifyPayload),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      console.error("[WorldID] Verification failed:", JSON.stringify(verifyData));
      return new Response(
        JSON.stringify({
          verified: false,
          error: verifyData.code || "verification_failed",
          detail: verifyData.detail || "The proof could not be verified by the World ID API",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[WorldID] Verification SUCCESS:", JSON.stringify(verifyData));

    return new Response(
      JSON.stringify({
        verified: true,
        nullifier_hash: verifyData.nullifier_hash || nullifier_hash,
        verification_level: verification_level || "device",
        action: action || "destaker-verify",
        created_at: verifyData.created_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[WorldID] Error:", error);
    return new Response(
      JSON.stringify({
        verified: false,
        error: error instanceof Error ? error.message : "Unknown error",
        detail: "An unexpected error occurred during verification",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
