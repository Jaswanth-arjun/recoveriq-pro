/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy public TwiML requests (fetched by Twilio servers for voice calls)
  // to the backend — the trial account requires a public Url, not inline Twiml.
  async rewrites() {
    return [
      {
        source: "/twiml/:path*",
        destination: "http://backend:8000/api/twiml/:path*",
      },
    ];
  },
};

export default nextConfig;