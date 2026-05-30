export const ALLOWED_ORIGINS = [
  "https://axtor.space",
  "https://www.axtor.space",
  "http://localhost:8080",
  "http://localhost:8082",
  "http://localhost:8083",
];

export const corsHeadersFor = (origin: string | null, methods = "POST, OPTIONS") => {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? "") ? origin! : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": methods,
    "Vary": "Origin",
  };
};
