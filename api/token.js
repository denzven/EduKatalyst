/**
 * EduKatalyst Serverless Google OAuth Token Exchange Endpoint
 * ASD-STE100: Clean serverless endpoint for Google authorization code exchange.
 *
 * Environment Variables (Server-side only):
 * - GOOGLE_CLIENT_ID (or VITE_GOOGLE_CLIENT_ID)
 * - GOOGLE_CLIENT_SECRET
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function handleTokenExchange(req, res) {
  if (req.method !== 'POST') {
    return res.status(455 || 405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { code, redirect_uri, refresh_token, action } = req.body || {};

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '119791404749-o4a3g19ps1sjvkgmcf9qj62ih9l5mcpp.apps.googleusercontent.com';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  // Action: Token Refresh using server-side stored refresh token
  if (action === 'refresh' || refresh_token) {
    if (!refresh_token) {
      return res.status(400).json({ error: 'Missing refresh_token parameter.' });
    }

    try {
      const params = new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
      });

      if (clientSecret) {
        params.append('client_secret', clientSecret);
      }

      const googleRes = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const data = await googleRes.json();
      if (!googleRes.ok) {
        return res.status(googleRes.status).json({
          error: data.error_description || data.error || 'Failed to refresh Google access token',
        });
      }

      return res.status(200).json({
        access_token: data.access_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
      });
    } catch (err) {
      return res.status(500).json({ error: `Server error during token refresh: ${err.message}` });
    }
  }

  // Action: Code Exchange (Authorization Code -> Access Token & Refresh Token)
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code parameter.' });
  }

  try {
    const params = new URLSearchParams({
      code: code,
      client_id: clientId,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'),
    });

    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }

    const googleRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await googleRes.json();
    if (!googleRes.ok) {
      return res.status(googleRes.status).json({
        error: data.error_description || data.error || 'Failed to exchange authorization code with Google',
      });
    }

    // Return only short-lived access token to browser SPA
    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      scope: data.scope,
      token_type: data.token_type,
    });
  } catch (err) {
    return res.status(500).json({ error: `Server error during code exchange: ${err.message}` });
  }
}

export default async function handler(req, res) {
  return await handleTokenExchange(req, res);
}
