import { api } from "./api.js";
import { t } from "./i18n.js";
import { showToast } from "./toast.js";
import { handleApiError } from "./api-errors.js";
import { state } from "./state.js";

// --- History ---
export async function loadHistory() {
    try {
        const history = await api.getHistory();
        renderHistory(history);
    } catch (e) {
        handleApiError(e);
    }
}

export function renderHistory(entries) {
    const list = document.getElementById('history-list');
    const controls = `
        <div class="flex gap-2 mb-4">
            <button onclick="exportHistory()" class="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-xs transition" data-i18n="history.export">${t('history.export')}</button>
            <button onclick="clearHistory()" class="bg-red-900/60 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded-lg text-xs transition" data-i18n="history.clear">${t('history.clear')}</button>
        </div>`;
    if (entries.length === 0) {
        list.innerHTML = controls + `<p class="text-gray-500 text-sm text-center py-8">${t('history.empty')}</p>`;
        return;
    }
    list.innerHTML = controls + entries.map(e => `
        <div class="bg-gray-900 rounded-lg p-4 border border-gray-800 flex items-center justify-between" data-entry="${e.id}">
            <div>
                <div class="text-sm font-medium">${e.case_id ? t('history.case', { id: e.case_id }) : t('history.free')}</div>
                <div class="text-xs text-gray-500">${e.input_matrix.length}×${e.input_matrix.length} · ${e.created_at?.split('T')[0] || ''}</div>
            </div>
            <div class="flex items-center gap-3">
                <span class="text-xs ${e.verified ? 'text-med-400' : 'text-gray-500'}">${e.verified ? t('history.verified') : t('history.unverified')}</span>
                <span class="text-xs text-gray-500">err: ${e.error_margin?.toFixed(10) || 'N/A'}</span>
                <button class="ctrl-btn text-xs" title="${t('history.detail')}" aria-label="${t('history.detail')}" onclick="showHistoryDetail(${e.id})">ℹ</button>
                <button class="ctrl-btn text-xs" title="${t('history.delete')}" aria-label="${t('history.delete')}" onclick="deleteHistoryEntry(${e.id})">🗑</button>
            </div>
        </div>
    `).join('');
}

export async function showHistoryDetail(id) {
    try {
        const entry = await api.getHistoryEntry(id);
        const stepsResp = await api.getHistorySteps(id);
        const nSteps = Array.isArray(stepsResp.steps) ? stepsResp.steps.length : 0;
        const label = entry.case_id ? t('history.case', { id: entry.case_id }) : t('history.free');
        showToast(`${label} · ${t('history.steps', { n: nSteps })}`, 'info');
    } catch (e) {
        showToast(t('history.detailError'), 'error');
    }
}

export async function deleteHistoryEntry(id) {
    if (!confirm(t('history.confirmDelete'))) return;
    try {
        await api.deleteHistoryEntry(id);
        showToast(t('history.deleted'), 'info');
        loadHistory();
    } catch (e) {
        handleApiError(e);
    }
}

export async function clearHistory() {
    if (!confirm(t('history.confirmClear'))) return;
    try {
        await api.clearHistory();
        showToast(t('history.cleared'), 'info');
        loadHistory();
    } catch (e) {
        handleApiError(e);
    }
}

export function exportHistory() {
    window.location.href = api.exportHistoryUrl();
}

