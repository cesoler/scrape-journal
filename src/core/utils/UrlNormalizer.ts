/**
 * Builds the dedup key for an article.
 *
 * The AI suggestions API returns every url with a tracking fragment appended
 * (`...ghtml#HOME-AREA-COLUNA-JORNALISMO-user,rec-principal,<uuid>`), while the
 * home page returns the same article without it. Stripping the fragment and the
 * query string is what makes both origins collapse onto a single row.
 */
export function normalizeUrl(rawUrl: string | null, canonicalUrl?: string | null): string | null {
    const target = canonicalUrl?.trim() || rawUrl?.trim();
    if (!target) {
        return null;
    }

    let parsed: URL;
    try {
        parsed = new URL(target);
    } catch {
        return null;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
    }

    parsed.protocol = 'https:';
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.hash = '';
    parsed.search = '';

    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
        parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }

    return parsed.toString();
}
