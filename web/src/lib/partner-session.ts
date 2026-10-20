/**
 * Dynamically resolves the active partner ID for web partner CRM portals.
 * Checks URL search parameter, localStorage session, and user profile.
 */
export function getActivePartnerId(defaultFallback: string = 'ptnr_mah_01'): string {
  if (typeof window === 'undefined') return defaultFallback;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get('partnerId');
    if (fromUrl && fromUrl.trim().length > 0) return fromUrl.trim();

    const storedDirect = localStorage.getItem('partnerId') || localStorage.getItem('gts_partner_id');
    if (storedDirect && storedDirect.trim().length > 0) return storedDirect.trim();

    const storedUserStr = localStorage.getItem('user') || localStorage.getItem('gts_user') || localStorage.getItem('auth_user');
    if (storedUserStr) {
      const user = JSON.parse(storedUserStr);
      if (user?.partnerId && typeof user.partnerId === 'string') {
        return user.partnerId;
      }
    }
  } catch (_) {
    // Fall through to default fallback
  }

  return defaultFallback;
}
