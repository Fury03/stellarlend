/** Centralized secret access with rotation and audit metadata. */
export interface SecretProvider {
  get(name: string): string | undefined
  version(name: string): string
}

export interface SecretAccess {
  name: string
  version: string
  accessedAt: string
}

export function createEnvSecretProvider(
  env: NodeJS.ProcessEnv = process.env,
  onAccess?: (access: SecretAccess) => void,
): SecretProvider {
  return {
    get(name) {
      const value = env[name]
      if (value) onAccess?.({ name, version: versionFor(name, value), accessedAt: new Date().toISOString() })
      return value
    },
    version(name) {
      const value = env[name]
      return value ? versionFor(name, value) : "missing"
    },
  }
}

function versionFor(name: string, value: string): string {
  // The value is never returned or logged; this identifier only changes when
  // the configured secret rotates.
  let hash = 2166136261
  for (const char of `${name}:${value}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return `env-${(hash >>> 0).toString(16)}`
}
