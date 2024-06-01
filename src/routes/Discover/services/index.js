import config from "../../../config";
const clientId = config.api.clientId;
const redirectUrl = config.api.redirectUrl;

const authorizationEndpoint = "https://accounts.spotify.com/authorize";
const tokenEndpoint = config.api.authUrl;
const newReleasesEndpoint = config.api.baseUrl + "/browse/new-releases";
const categoriesEndPoint = config.api.baseUrl + "/browse/categories";
const featuredPlaylistEndPoint =
  config.api.baseUrl + "/browse/featured-playlists";

// Data structure that manages the current active token, caching it in localStorage
export const currentToken = {
  get access_token() {
    return localStorage.getItem("access_token") || null;
  },
  get refresh_token() {
    return localStorage.getItem("refresh_token") || null;
  },
  get expires_in() {
    return localStorage.getItem("expires_in") || null;
  },

  save: function (response) {
    const { access_token, refresh_token, expires_in } = response;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);

    const now = new Date();
    const expiry = new Date(now.getTime() + expires_in * 1000);
    localStorage.setItem("expires_in", expiry);
  },
};

export async function redirectToSpotifyAuthorize() {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = crypto.getRandomValues(new Uint8Array(64));
  const randomString = randomValues.reduce(
    (acc, x) => acc + possible[x % possible.length],
    ""
  );

  const code_verifier = randomString;
  const data = new TextEncoder().encode(code_verifier);
  const hashed = await crypto.subtle.digest("SHA-256", data);

  const code_challenge_base64 = btoa(
    String.fromCharCode(...new Uint8Array(hashed))
  )
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  window.localStorage.setItem("code_verifier", code_verifier);

  const authUrl = new URL(authorizationEndpoint);
  const params = {
    response_type: "code",
    client_id: clientId,
    code_challenge_method: "S256",
    code_challenge: code_challenge_base64,
    redirect_uri: redirectUrl,
  };

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString(); // Redirect the user to the authorization server for login
}

// Soptify API Calls
export async function getToken(code) {
  const code_verifier = localStorage.getItem("code_verifier");

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUrl,
      code_verifier: code_verifier,
    }),
  });

  return await response.json();
}

export async function refreshToken() {
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: currentToken.refresh_token,
    }),
  });

  return await response.json();
}

export async function getNewReleases() {
  const response = await fetch(newReleasesEndpoint, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + currentToken.access_token,
    },
  });

  return await response.json();
}

export async function getCategories() {
  const response = await fetch(categoriesEndPoint, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + currentToken.access_token,
    },
  });

  return await response.json();
}

export async function getFeaturedPlaylist() {
  const response = await fetch(featuredPlaylistEndPoint, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + currentToken.access_token,
    },
  });

  return await response.json();
}
