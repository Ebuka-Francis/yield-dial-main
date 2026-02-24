const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Generates an RP context for World ID v4 widget.
 * In production, this would use a real RP key pair.
 * For demo/hackathon purposes, we generate a deterministic context.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomUUID();
    
    // Generate a mock RP context for the widget
    // In production, this would use ECDSA signing with an RP private key
    const rp_context = {
      rp_id: "rp_destaker_demo",
      nonce,
      created_at: now,
      expires_at: now + 3600, // 1 hour
      signature: await generateSignature(nonce, now),
    };

    return new Response(
      JSON.stringify({ rp_context }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("RP context error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateSignature(nonce: string, createdAt: number): Promise<string> {
  // Create a deterministic signature using HMAC-SHA256
  const encoder = new TextEncoder();
  const data = encoder.encode(`${nonce}:${createdAt}`);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode("destaker-demo-key-2026"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
