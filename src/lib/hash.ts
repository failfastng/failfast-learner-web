const EMPTY_NAME_HASH_CONSTANT = '__empty_display_name__';

export async function hashDisplayName(name: string): Promise<string> {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return EMPTY_NAME_HASH_CONSTANT;
  const encoded = new TextEncoder().encode(trimmed);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
