export interface PipedreamApp {
  slug: string;
  name: string;
  iconUrl?: string;
  description?: string;
}

export interface PipedreamStatusResponse {
  enabled: boolean;
  projectId?: string;
  environment?: 'development' | 'production';
  apps: PipedreamApp[];
}

export interface PipedreamAccount {
  id: string;
  name: string | null;
  appSlug: string;
  appName: string;
  iconUrl: string | null;
  healthy: boolean;
  dead: boolean | null;
}

export interface PipedreamAccountsResponse {
  accounts: PipedreamAccount[];
}

export interface PipedreamConnectTokenRequest {
  appSlug: string;
}

export interface PipedreamConnectTokenResponse {
  connectUrl: string;
  expiresAt: string;
}
