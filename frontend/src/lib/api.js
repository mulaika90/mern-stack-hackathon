const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "" : "https://mern-stack-hackathon-snowy.vercel.app")
).replace(/\/+$/, "");

export function apiUrl(path) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return path;
  return `${API_BASE_URL}${path}`;
}

export async function api(path, options = {}) {
  let response;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  try {
    response = await fetch(apiUrl(path), {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "The clinic server is offline. Start the backend and check its MongoDB connection.",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  let body = {};
  if (contentType.includes("application/json")) {
    try {
      body = await response.json();
    } catch {
      throw new Error("The clinic server returned an invalid response.");
    }
  } else if (!response.ok) {
    throw new Error(
      response.status >= 500
        ? "The clinic server is unavailable. Check that the backend is connected to MongoDB."
        : `The request failed (HTTP ${response.status}).`,
    );
  }

  if (!response.ok) {
    throw new Error(body.message || `The request failed (HTTP ${response.status}).`);
  }
  return body;
}

export function jsonRequest(method, data) {
  return { method, body: JSON.stringify(data) };
}
