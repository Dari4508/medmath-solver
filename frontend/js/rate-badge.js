import { t } from "./i18n.js";

let rateBadgeTimer = null;

export function updateRateBadge(status, remaining, limit, retryAfter) {
    const badge = document.getElementById('rate-badge');
    if (!badge) return;

    if (rateBadgeTimer) {
        clearInterval(rateBadgeTimer);
        rateBadgeTimer = null;
    }

    if (status === 429) {
        let secs = parseInt(retryAfter || '60', 10) || 60;
        badge.classList.remove('hidden', 'ok', 'warn');
        badge.classList.add('crit');
        const tick = () => {
            badge.textContent = t('rate.cooldown', { s: Math.max(secs, 0) });
            if (secs <= 0) {
                clearInterval(rateBadgeTimer);
                rateBadgeTimer = null;
                badge.classList.add('hidden');
            }
            secs -= 1;
        };
        tick();
        rateBadgeTimer = setInterval(tick, 1000);
        return;
    }

    if (remaining == null || limit == null) return;
    const r = parseInt(remaining, 10);
    const lim = parseInt(limit, 10);
    if (isNaN(r) || isNaN(lim)) return;

    badge.classList.remove('hidden', 'ok', 'warn', 'crit');
    if (r <= 0) badge.classList.add('crit');
    else if (r <= 5) badge.classList.add('warn');
    else badge.classList.add('ok');
    badge.textContent = t('rate.badge', { remaining: r, limit: lim });
    badge.setAttribute('aria-label', t('rate.badge', { remaining: r, limit: lim }));
}