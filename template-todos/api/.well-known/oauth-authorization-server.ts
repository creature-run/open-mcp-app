/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414)
 *
 * Returns discovery document for OAuth clients like ChatGPT.
 * Points to Creature's OAuth endpoints.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const baseUrl = process.env.CREATURE_URL || "https://creature.run";
  const apiUrl = process.env.CREATURE_API_URL || "https://api.creature.run";

  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${apiUrl}/apps/v1/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
    ],
  });
}
