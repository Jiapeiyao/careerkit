export type HeaderUser = {
  name: string | null;
  email: string | null;
  avatar: string | null;
};

export type HeaderAccountResponse = {
  user: HeaderUser | null;
  error: string | null;
};

export function isHeaderAccountResponse(value: unknown): value is HeaderAccountResponse {
  if (typeof value !== "object" || value === null || !("user" in value) || !("error" in value)) {
    return false;
  }
  if (value.error !== null) return typeof value.error === "string" && value.user === null;
  if (value.user === null) return true;
  const user = value.user;
  return typeof user === "object"
    && "name" in user && (user.name === null || typeof user.name === "string")
    && "email" in user && (user.email === null || typeof user.email === "string")
    && "avatar" in user && (user.avatar === null || typeof user.avatar === "string");
}
