/**
 * Decode JWT token payload (without verification)
 * WARNING: This only decodes the payload, doesn't verify the signature.
 * For validation, verification must happen on the backend.
 */
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = parts[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function getRoleFromToken(token: string | null): { roleId: number; roleName: string } | null {
  if (!token) return null

  const payload = decodeJWT(token)
  if (!payload) return null

  const roleIdRaw =
    payload.RoleID ??
    payload.role_id ??
    payload.roleId ??
    payload.roleID ??
    (payload.role as Record<string, unknown> | undefined)?.id

  const roleId = typeof roleIdRaw === 'string' ? Number(roleIdRaw) : typeof roleIdRaw === 'number' ? roleIdRaw : undefined
  const roleName = (payload.RoleName ?? payload.role ?? payload.roleName) as string | undefined

  if (typeof roleId === 'number' && Number.isFinite(roleId)) {
    return {
      roleId,
      roleName: roleName || 'unknown',
    }
  }

  return null
}

export function isAdminByRole(token: string | null): boolean {
  const role = getRoleFromToken(token)
  return role ? role.roleId > 1 : false
}
