let cachedUsers: string | null = null

export function setServerUsers(json: string) {
  cachedUsers = json
}

export function getServerUsers(): string | null {
  return cachedUsers
}
