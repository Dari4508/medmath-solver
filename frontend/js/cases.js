import { api } from './api.js';
import { t } from './i18n.js';
import { escHtml } from './utils.js';
import { handleApiError } from './api-errors.js';

let casesCache = [];

export function getCasesCache() {
    return casesCache;
}

export async function loadCases() {
    renderCasesSkeleton();
    try {
        casesCache = await api.getCases();
        renderCases(casesCache);
    } catch (e) {
        handleApiError(e);
    }
}

export function renderCasesSkeleton() {
    const grid = document.getElementById('cases-grid');
    grid.setAttribute('aria-busy', 'true');
    grid.innerHTML = Array.from({ length: 6 }, () => `
        <div class="case-skeleton" aria-hidden="true">
            <div class="sk-chip"></div>
            <div class="sk-line sk-w-34"></div>
            <div class="sk-line sk-w-full"></div>
            <div class="sk-line sk-w-45"></div>
        </div>
    `).join('');
}

export function renderCases(cases) {
    const grid = document.getElementById('cases-grid');
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = cases.map(c => `
        <div class="case-card" role="button" tabindex="0" onclick="selectCase(${c.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectCase(${c.id})}" aria-label="${escHtml(c.name)}">
            <div class="flex items-start justify-between mb-3">
                <span class="case-badge">${c.matrix.length}\u00d7${c.matrix.length}</span>
                <span class="case-vars">${c.variables.length} ${t('cases.vars')}</span>
            </div>
            <h3 class="mb-1">${escHtml(c.name)}</h3>
            <p class="text-sm text-gray-400 mb-3 line-clamp-2">${escHtml(c.description)}</p>
            <div class="case-card-source">
                <span class="label">${t('cases.source')}:</span> ${escHtml(c.reference_source)}
            </div>
        </div>
    `).join('');
}

export function rerenderCases() {
    if (casesCache.length) renderCases(casesCache);
}
