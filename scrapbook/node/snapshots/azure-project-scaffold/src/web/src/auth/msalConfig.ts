// Placeholder MSAL config. Real values are filled in via env at deploy time.
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID ?? 'preview-client-id',
    authority:
      import.meta.env.VITE_ENTRA_AUTHORITY ??
      'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'localStorage' as const,
    storeAuthStateInCookie: false
  }
};

export const apiScopes = [
  import.meta.env.VITE_API_SCOPE ?? 'api://couples-scrapbook/.default'
];
