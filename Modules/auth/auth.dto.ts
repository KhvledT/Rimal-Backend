export interface SignupDto {
  username: string;
  email: string;
  password: string;
}

export interface VerifySignupDto {
  email: string;
  otp: string;
  username: string;
  password: string;
  phone?: string;
}

export interface ResendSignupOtpDto {
  email: string;
}

export interface LoginDto {
  identifier: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
