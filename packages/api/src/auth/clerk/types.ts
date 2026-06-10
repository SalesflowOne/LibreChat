export interface ClerkTokenClaims {
  sub: string;
  org_id?: string;
  org_role?: string;
  email?: string;
  name?: string;
  image_url?: string;
}

export interface ClerkExchangeResult {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId?: string;
  };
}

export interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}
