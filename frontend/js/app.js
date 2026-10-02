import { api, RateLimitError, setRateBadgeUpdater } from './api.js';
import { GaussVisualizer } from './gauss-visualizer.js';
import { DICT, t, getLang, persistLang, applyI18n } from './i18n.js';
import { loadCases, rerenderCases } from './cases.js';
import { loadHistory, renderHistory, showHistoryDetail, deleteHistoryEntry, clearHistory, exportHistory } from './history.js';
import {
    buildFreeForm, renderFreeContext, onFreeSizeChange, solveFreeMode,
    loadExample, clearFreeMode, freePlay, freePause, freeStepForward,
    freeReset, freeSetSpeed, freeGoToStep, rerenderFree,
} from './free-mode.js';
import { escHtml } from './utils.js';
import { state } from './state.js';
import { updateStepUI } from './step-ui.js';
import { updateRateBadge } from './rate-badge.js';
import { showToast } from './toast.js';
import { apiErrorMessage, handleApiError } from './api-errors.js';


function setLang(next) {
    if (!DICT[next]) return;
    persistLang(next);
    applyI18n();
    refreshViewText();
}

function refreshViewText() {
    if (state.currentView === 'cases') rerenderCases();
    if (state.currentView === 'free') rerenderFree();
    if (state.currentView === 'history') loadHistory();
    if (state.currentView === 'solver' && state.calculationResult) {
        updateStepUI(state.viz ? state.viz.currentStep : 0, state.calculationResult?.steps?.length || 1, 'solver');
        renderVerification();
        renderCaseInfo();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setRateBadgeUpdater(updateRateBadge);
    state.viz = new GaussVisualizer('matrix-canvas', 'solver', updateStepUI);
    state.freeViz = new GaussVisualizer('free-matrix-canvas', 'free', updateStepUI);
    document.documentElement.lang = getLang();
    applyI18n();
    renderFreeContext();
    loadCases();
});

// --- Navigation ---
function showView(view) {
    if (state.currentView === 'solver' && view !== 'solver' && state.viz) state.viz.pause();
    if (state.currentView === 'free' && view !== 'free' && state.freeViz) state.freeViz.pause();

    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${view}`).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`nav-${view}`)?.classList.add('active');
    state.currentView = view;

    closeMobileMenu();

    if (view === 'history') loadHistory();
    if (view === 'free') buildFreeForm();
}

function closeMobileMenu() {
    document.getElementById('site-header')?.classList.remove('menu-open');
    const t = document.getElementById('menu-toggle');
    if (t) t.setAttribute('aria-expanded', 'false');
}

function toggleMobileMenu() {
    const header = document.getElementById('site-header');
    if (!header) return;
    const open = header.classList.toggle('menu-open');
    document.getElementById('menu-toggle')?.setAttribute('aria-expanded', open ? 'true' : 'false');
}

// Opening is JS (user tapped the toggle); the collapsed state is pure CSS,
// so nothing here decides whether the nav shows on first paint.
// Registered inside DOMContentLoaded: as a module this file evaluates after
// parsing, but the element lookup above still has to happen once the DOM
// exists, same as the init block.
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('menu-toggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMobileMenu();
    });
});

// Leaving the mobile breakpoint clears the open state so the nav
// is inline (CSS) again without a stale dropdown.
window.addEventListener('resize', () => {
    if (window.innerWidth > 767) closeMobileMenu();
});

document.addEventListener('click', (e) => {
    const header = document.getElementById('site-header');
    if (!header?.classList.contains('menu-open')) return;
    if (!header.contains(e.target)) closeMobileMenu();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
});

// --- Cases ---
async function selectCase(id) {
    try {
        state.currentCase = await api.getCase(id);
        state.calculationResult = await api.calculateCase(id);
        state.freeCalc = null;
        showSolver();
    } catch (e) {
        handleApiError(e);
    }
}

// --- Solver (case view) ---
function showSolver() {
    showView('solver');
    document.getElementById('view-solver').classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const title = state.currentCase ? state.currentCase.name : t('solver.freeMode');
    document.getElementById('solver-title').textContent = title;

    state.viz.loadSteps(state.calculationResult.steps);

    const slider = document.getElementById('step-slider');
    slider.max = state.calculationResult.steps.length - 1;
    slider.value = 0;
    updateStepUI(0, state.calculationResult.steps.length, 'solver');

    renderVerification();
    renderSolution();
    renderCaseInfo();
}

function renderVerification() {
    const panel = document.getElementById('verification-status');
    if (!state.calculationResult) return;
    if (state.calculationResult.verified) {
        panel.innerHTML = `
            <div class="text-center">
                <div class="text-4xl mb-2 anim-pop">✅</div>
                <div class="text-med-400 font-semibold">${t('solver.verified')}</div>
                <div class="text-xs text-gray-500 mt-1">${t('solver.error')}: ${state.calculationResult.error_margin?.toFixed(12) || 0}</div>
                ${state.currentCase ? `<div class="text-xs text-gray-500 mt-2">${t('solver.source')}: ${escHtml(state.currentCase.reference_source)}</div>` : ''}
            </div>`;
    } else {
        panel.innerHTML = `
            <div class="text-center">
                <div class="text-4xl mb-2 anim-pop">❌</div>
                <div class="text-red-400 font-semibold">${t('solver.unverified')}</div>
                <div class="text-xs text-gray-500 mt-1">${escHtml(state.calculationResult.message)}</div>
            </div>`;
    }
}

function renderSolution() {
    const panel = document.getElementById('solution-panel');
    const values = document.getElementById('solution-values');
    if (!state.calculationResult || !state.calculationResult.solution) {
        panel.classList.add('hidden');
        return;
    }
    panel.classList.remove('hidden');
    const vars = state.currentCase?.variables || state.calculationResult.solution.map((_, i) => `x${i}`);
    const units = state.currentCase?.units || state.calculationResult.solution.map(() => '');
    values.innerHTML = state.calculationResult.solution.map((v, i) => `
        <div class="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
            <span class="text-sm text-gray-400">${escHtml(vars[i])}</span>
            <span class="font-mono font-semibold text-white">${v.toFixed(4)} <span class="text-gray-500 text-xs">${escHtml(units[i])}</span></span>
        </div>
    `).join('');
}

function renderCaseInfo() {
    const panel = document.getElementById('case-info-panel');
    if (!state.currentCase) {
        panel.classList.add('hidden');
        return;
    }
    panel.classList.remove('hidden');
    document.getElementById('case-info-content').innerHTML = `
        <div><span class="text-gray-500">${t('solver.description')}</span> ${escHtml(state.currentCase.description)}</div>
        ${state.currentCase.clinical_notes ? `<div class="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-2 text-yellow-300 text-xs"><strong>${t('solver.clinicalNotes')}</strong> ${escHtml(state.currentCase.clinical_notes)}</div>` : ''}
        <div><span class="text-gray-500">${t('solver.expected')}</span> <span class="font-mono text-med-400">${state.currentCase.expected.map((v, i) => `${v.toFixed(2)} ${escHtml(state.currentCase.units[i] || '')}`).join(', ')}</span></div>
    `;
}

// --- Animation Controls (case solver) ---
function playAnimation() { state.viz.play(); }
function pauseAnimation() { state.viz.pause(); }
function stepForward() { state.viz.stepForward(); }
function resetAnimation() { state.viz.reset(); }
function setSpeed() {
    const ms = parseInt(document.getElementById('speed-select').value);
    state.viz.setSpeed(ms);
}
function goToStep(val) { state.viz.goTo(parseInt(val)); }

// --- History (movido a history.js) ---
// --- rate badge (movido a rate-badge.js) ---
// Puente explicito para los handlers inline de index.html (onclick/onchange).
// Los modulos ES no exponen nada en window.
Object.assign(window, {
    showView, setLang, setSpeed, goToStep,
    onFreeSizeChange, solveFreeMode, loadExample, clearFreeMode,
    playAnimation, pauseAnimation, stepForward, resetAnimation,
    freePlay, freePause, freeStepForward, freeReset,
    freeSetSpeed, freeGoToStep,
    selectCase, showHistoryDetail, deleteHistoryEntry,
    exportHistory, clearHistory,
});
