/**
 * Cloudflare Worker Backend (Optional Proxy)
 * * ในกรณีที่คุณต้องการทำ API Proxy เพื่อซ่อน API Key ของ Gemini 
 * และจัดการเรื่อง CORS ให้ปลอดภัยขึ้น
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // จัดการ CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // API Route สำหรับประมวลผลภาพผ่าน Gemini
    if (url.pathname === "/api/analyze" && request.method === "POST") {
      try {
        const body = await request.json();
        const { image } = body;

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: "Analyze the server rack image and return JSON of assets, U-positions, and S/N." },
                  { inlineData: { mimeType: "image/png", data: image } }
                ]
              }],
              generationConfig: { responseMimeType: "application/json" }
            }),
          }
        );

        const data = await geminiResponse.json();

        return new Response(JSON.stringify(data), {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" 
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 500,
          headers: { "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    return new Response("DC Vision Backend Running", { status: 200 });
  },
};
