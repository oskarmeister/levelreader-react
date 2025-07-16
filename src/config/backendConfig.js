// Backend Configuration for LevelReader
// Update these URLs to point to your deployed backend

const BACKEND_CONFIG = {
  // Production backend URL (update this with your deployed backend)
  production: "https://your-backend-url.com",

  // Development/local backend URLs
  development: ["http://localhost:5001", "http://localhost:5000"],

  // Tunnel URLs (update with your ngrok/cloudflare tunnel URL)
  tunnel: "https://your-tunnel-url.ngrok.io",

  // API endpoints
  endpoints: {
    upload: "/upload",
    apiUpload: "/api/upload",
    health: "/health",
    register: "/register",
    login: "/login",
    userData: "/user_data",
  },
};

// Auto-detect environment and create backend URLs
export const getBackendUrls = () => {
  const urls = [];

  // If tunnel URL is provided, use it first
  if (
    BACKEND_CONFIG.tunnel &&
    BACKEND_CONFIG.tunnel !== "https://your-tunnel-url.ngrok.io"
  ) {
    urls.push(`${BACKEND_CONFIG.tunnel}${BACKEND_CONFIG.endpoints.upload}`);
    urls.push(`${BACKEND_CONFIG.tunnel}${BACKEND_CONFIG.endpoints.apiUpload}`);
  }

  // Add production URL if configured
  if (
    BACKEND_CONFIG.production &&
    BACKEND_CONFIG.production !== "https://your-backend-url.com"
  ) {
    urls.push(`${BACKEND_CONFIG.production}${BACKEND_CONFIG.endpoints.upload}`);
    urls.push(
      `${BACKEND_CONFIG.production}${BACKEND_CONFIG.endpoints.apiUpload}`,
    );
  }

  // Add relative URLs (for same-domain deployment)
  urls.push("/api/upload");
  urls.push("/upload");

  // Add local development URLs
  BACKEND_CONFIG.development.forEach((baseUrl) => {
    urls.push(`${baseUrl}${BACKEND_CONFIG.endpoints.upload}`);
    urls.push(`${baseUrl}${BACKEND_CONFIG.endpoints.apiUpload}`);
  });

  return urls;
};

export default BACKEND_CONFIG;
