import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { getServerSideConfig } from "../config/server";

// Cache for OIDC JWKS URI
let jwksCache: {
  issuer: string;
  jwksUri: string;
  timestamp: number;
} | null = null;

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch OIDC discovery document to get the JWKS URI
 */
async function getJwksUri(): Promise<string> {
  const serverConfig = getServerSideConfig();
  const issuer = serverConfig.oidcIssuer;

  if (!issuer) {
    throw new Error("OIDC_ISSUER is not configured");
  }

  // Check cache
  if (
    jwksCache &&
    jwksCache.issuer === issuer &&
    Date.now() - jwksCache.timestamp < CACHE_TTL
  ) {
    return jwksCache.jwksUri;
  }

  // Fetch discovery document
  const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
  const discoveryRes = await fetch(discoveryUrl);
  if (!discoveryRes.ok) {
    throw new Error(
      `Failed to fetch OIDC discovery: ${discoveryRes.status} ${discoveryRes.statusText}`,
    );
  }
  const discovery = await discoveryRes.json();

  const jwksUri = discovery.jwks_uri;
  if (!jwksUri) {
    throw new Error("OIDC discovery does not contain jwks_uri");
  }

  jwksCache = {
    issuer,
    jwksUri,
    timestamp: Date.now(),
  };

  return jwksUri;
}

/**
 * Verify an OIDC JWT token
 * Uses jose's createRemoteJWKSet to automatically fetch and cache JWKS
 * Checks signature, expiration, and issuer
 */
export async function verifyOidcToken(
  token: string,
): Promise<JWTPayload> {
  const serverConfig = getServerSideConfig();
  const issuer = serverConfig.oidcIssuer;

  if (!issuer) {
    throw new Error("OIDC_ISSUER is not configured");
  }

  const jwksUri = await getJwksUri();

  const JWKS = createRemoteJWKSet(new URL(jwksUri));

  const { payload } = await jwtVerify(token, JWKS, {
    issuer,
    audience: serverConfig.oidcClientId,
    clockTolerance: 30,
  });

  return payload;
}