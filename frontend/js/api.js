// Absolute backend origin in production (Vercel static → Render).
// "" = same-origin relative paths (local nginx / serve.py proxy).
const RENDER_API_URL = 'https://medmath-solver-api.onrender.com';
const API_BASE_URL = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === ''
) ? '' : RENDER_API_URL;
const API_BASE = `${API_BASE_URL}/api`;

class RateLimitError extends Error {
    constructor(retryAfter, message) {
        super(message || 'Rate limit exceeded');
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

function formatApiError(res, body) {
    if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After') || res.headers.get('X-RateLimit-Reset') || '';
        return retryAfter
            ? `Rate limit excedido — reintenta en ${retryAfter}s`
            : 'Rate limit excedido — espera un momento';
    }
    const detail = body && body.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        return detail.map(d => {
            if (!d || typeof d !== 'object') return String(d);
            const field = Array.isArray(d.loc) ? d.loc.slice(1).join('.') : '';
            return field && d.msg ? `${field}: ${d.msg}` : (d.msg || JSON.stringify(d));
        }).join(' · ');
    }
    if (body && typeof body.error === 'string') return body.error;
    return `Error ${res.status}`;
}

function noteRateHeaders(res) {
    if (typeof updateRateBadge !== 'function') return;
    updateRateBadge(
        res.status,
        res.headers.get('X-RateLimit-Remaining'),
        res.headers.get('X-RateLimit-Limit'),
        res.headers.get('Retry-After')
    );
}

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, options);
    noteRateHeaders(res);
    if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '0', 10) || null;
        const body = await res.json().catch(() => null);
        throw new RateLimitError(retryAfter, formatApiError(res, body));
    }
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(formatApiError(res, body));
    }
    return res.json();
}

const api = {
    getCases: () => request('/cases'),
    getCase: id => request(`/cases/${id}`),
    calculateCase: caseId =>
        request('/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ case_id: caseId }),
        }),
    calculateCustom: (matrix, vector) =>
        request('/calculate/custom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matrix, vector }),
        }),
    getHistory: () => request('/history'),
    getHistoryEntry: id => request(`/history/${id}`),
    getHistorySteps: id => request(`/history/${id}/steps`),
    deleteHistoryEntry: id => request(`/history/${id}`, { method: 'DELETE' }),
    clearHistory: () => request('/history', { method: 'DELETE' }),
    exportHistoryUrl: () => `${API_BASE}/history/export`,
    health: () => request('/health'),
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, RateLimitError, formatApiError, request, API_BASE_URL, API_BASE };
}
