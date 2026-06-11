export interface SupabaseUserClaims {
  sub: string;
  email?: string;
  role?: string;
}

export interface SupabaseExchangeResult {
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
