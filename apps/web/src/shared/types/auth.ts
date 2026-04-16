export type Role = "USER" | "PROVIDER" | "ADMIN";

export interface SessionPayload {
  userId: string;
  role: Role;
  expires: Date | string;
}
