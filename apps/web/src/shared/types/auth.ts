export type Role = "USER" | "MASTER" | "ADMIN";

export interface SessionPayload {
  userId: string;
  role: Role;
  expires: Date | string;
}
