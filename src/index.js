// src/index.js - CORS Proxy for Blizzard API
export default {
  async fetch(request) {
    // Handle preflight (OPTIONS) requests for CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Get the target URL from the request
    const url = new URL(request.url);
    const target = url.searchParams.get("url");

    if (!target) {
      return new Response("Missing 'url' parameter", { status: 400 });
    }

    // Prepare the request to forward to Blizzard
    const proxyRequest = new Request(target, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "follow",
    });

    // Fetch the Blizzard API
    const proxyResponse = await fetch(proxyRequest);

    // Create a new response with the Blizzard data
    const response = new Response(proxyResponse.body, proxyResponse);

    // Add CORS headers to allow your browser to receive the response
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "*");

    return response;
  },
};