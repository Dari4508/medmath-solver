import { t } from './i18n.js';
import { showToast } from './toast.js';

let rateLimitCooldown = false;

export function apiErrorMessage(e) {
    if (e && e.name === 'RateLimitError') {
        return e.retryAfter
            ? t('rate.limit', { s: e.retryAfter })
            : t('rate.limit.wait');
    }
    return t('error.generic') + (e && e.message ? e.message : e);
}

export function handleApiError(e) {
    if (e && e.name === 'RateLimitError') {
        if (rateLimitCooldown) {
            showToast(apiErrorMessage(e), 'error');
            return;
        }
        rateLimitCooldown = true;
        const wait = (e.retryAfter || 5) * 1000;
        setTimeout(() => { rateLimitCooldown = false; }, wait);
    }
    showToast(apiErrorMessage(e), 'error');
}
