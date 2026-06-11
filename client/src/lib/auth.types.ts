export interface AuthProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface SignUpProfileData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
}

export interface AppRole {
  role: string;
  appId?: string;
}
