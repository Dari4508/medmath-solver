import { api } from './api.js';
import { t, getLang } from './i18n.js';
import { escHtml } from './utils.js';
import { showToast } from './toast.js';
import { handleApiError } from './api-errors.js';
import { state } from './state.js';
import { updateStepUI } from './step-ui.js';


const FREE_EXAMPLES = {
    2: [
        {
            matrix: [[1, 1], [0.9, 0]],
            vector: [1000, 450],
            variables: ['ml_NS_09', 'ml_agua_esteril'],
            context: '1000mL de NaCl 0.45% desde NS 0.9% + agua estéril',
        },
        {
            matrix: [[1, 1], [0.2, 0.05]],
            vector: [150, 15],
            variables: ['g_zinc_20pct', 'g_zinc_5pct'],
            context: '150g de ungüento óxido de zinc al 10% desde stock 20%+5%',
        },
        {
            matrix: [[1, 1], [0.7, 0]],
            vector: [500, 250],
            variables: ['ml_IPA_70', 'ml_agua'],
            context: '500mL de alcohol isopropílico al 50% desde IPA 70% + agua',
        },
    ],
    3: {
        matrix: [
            [0.154, 0.0, 0.0],
            [0.0, 0.2, 0.4],
            [0.154, 0.2, 0.0],
        ],
        vector: [77, 160, 117],
        variables: ['ml_NaCl_09', 'ml_KCl_20', 'ml_KCl_40'],
        context: 'Balance Na/K/Cl en NPT: 500mL NS 0.9% + KCl 20/40 según objetivos',
    },
    4: {
        matrix: [
            [2, 1, 0, 0],
            [1, 3, 1, 0],
            [0, 1, 3, 1],
            [0, 0, 1, 2],
        ],
        vector: [3, 6, 8, 5],
        variables: ['x0', 'x1', 'x2', 'x3'],
        context: 'Sistema tridiagonal académico 4×4',
    },
    5: {
        matrix: [
            [4, 1, 0, 0, 0],
            [1, 4, 1, 0, 0],
            [0, 1, 4, 1, 0],
            [0, 0, 1, 4, 1],
            [0, 0, 0, 1, 4],
        ],
        vector: [6, 12, 16, 14, 6],
        variables: ['x0', 'x1', 'x2', 'x3', 'x4'],
        context: 'Sistema tridiagonal académico 5×5',
    },
    6: {
        matrix: [
            [5, 1, 0, 0, 0, 0],
            [1, 5, 1, 0, 0, 0],
            [0, 1, 5, 1, 0, 0],
            [0, 0, 1, 5, 1, 0],
            [0, 0, 0, 1, 5, 1],
            [0, 0, 0, 0, 1, 5],
        ],
        vector: [7, 14, 18, 18, 14, 7],
        variables: ['x0', 'x1', 'x2', 'x3', 'x4', 'x5'],
        context: 'Sistema tridiagonal académico 6×6',
    },
};

export function getFreeExample(n) {
    const entry = FREE_EXAMPLES[n];
    if (Array.isArray(entry)) {
        return entry[state.freeExampleIndex % entry.length];
    }
    return entry || null;
}

export function onFreeSizeChange() {
    state.freeExampleIndex = -1;
        buildFreeForm();
    renderFreeContext();
    resetFreeResultPanel();
}

export function resetFreeResultPanel() {
    state.freeCalc = null;
    if (state.freeViz) state.freeViz.pause();
    document.getElementById('free-placeholder')?.classList.remove('hidden');
    document.getElementById('free-result-panel')?.classList.add('hidden');
    const badge = document.getElementById('free-badge');
    if (badge) {
        badge.textContent = '';
        badge.className = 'text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700';
    }
    const margin = document.getElementById('free-error-margin');
    if (margin) margin.textContent = '';
    const solPanel = document.getElementById('free-solution-panel');
    if (solPanel) solPanel.classList.add('hidden');
    const solValues = document.getElementById('free-solution-values');
    if (solValues) solValues.innerHTML = '';
    const ctxBox = document.getElementById('free-result-context');
    if (ctxBox) {
        ctxBox.classList.add('hidden');
        const ctxText = document.getElementById('free-result-context-text');
        if (ctxText) ctxText.textContent = '';
    }
    const slider = document.getElementById('free-step-slider');
    if (slider) {
        slider.max = '0';
        slider.value = '0';
    }
    const err = document.getElementById('free-error');
    if (err) {
        err.textContent = '';
        err.classList.add('hidden');
    }
}

export function renderFreeContext() {
    const panel = document.getElementById('free-context-panel');
    const text = document.getElementById('free-context-text');
    const varList = document.getElementById('free-context-vars');
    const editable = document.getElementById('free-context-edit');
    if (!panel || !text || !varList) return;

    if (state.freeContextData && state.freeContextData.context) {
        editable?.classList.add('hidden');
        panel.classList.remove('hidden');
        text.textContent = state.freeContextData.context;
        const vars = state.freeContextData.variables || [];
        varList.innerHTML = vars.map((v, i) =>
            `<span class="text-xs bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 font-mono text-med-400">x${i} = ${escHtml(v)}</span>`
        ).join('');
    } else {
        panel.classList.add('hidden');
        varList.innerHTML = '';
        editable?.classList.remove('hidden');
    }
}

export function buildFreeForm() {
    const n = parseInt(document.getElementById('free-size').value);
    const form = document.getElementById('free-form');
    const vars = (state.freeContextData && state.freeContextData.variables) || null;
    const key = `${n}|${getLang()}|${(vars || []).join(',')}`;
    if (form.dataset.key === key && form.querySelector('#fm-0-0')) return;

    const prev = {};
    const prevN = parseInt(form.dataset.n || '0', 10);
    if (prevN === n && form.querySelector('#fm-0-0')) {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const el = document.getElementById(`fm-${i}-${j}`);
                if (el) prev[`fm-${i}-${j}`] = el.value;
            }
            const ve = document.getElementById(`fv-${i}`);
            if (ve) prev[`fv-${i}`] = ve.value;
        }
    }

    const inputW = n >= 6 ? 'w-14' : n === 5 ? 'w-16' : 'w-20';
    let html = '<div class="space-y-3">';
    html += `<p class="text-xs text-gray-500">${escHtml(t('free.hint'))}</p>`;
    html += '<div class="overflow-x-auto -mx-1 px-1 pb-1">';

    for (let i = 0; i < n; i++) {
        html += `<div class="flex items-center gap-2 flex-nowrap min-w-max">`;
        html += `<span class="text-xs text-gray-500 w-6 shrink-0">F${i}:</span>`;
        for (let j = 0; j < n; j++) {
            const vlabel = vars && vars[j] ? ` (${escHtml(vars[j])})` : '';
            html += `<input type="number" step="any" id="fm-${i}-${j}" class="matrix-input ${inputW} shrink-0" placeholder="a${i}${j}" aria-label="a${i}${j}${vlabel}" aria-invalid="false" inputmode="decimal">`;
        }
        html += `<span class="text-gray-600 mx-1 shrink-0" aria-hidden="true">|</span>`;
        const vname = vars && vars[i] ? escHtml(vars[i]) : `b${i}`;
        html += `<input type="number" step="any" id="fv-${i}" class="matrix-input ${inputW} shrink-0" placeholder="b${i}" aria-label="b${i} (${vname})" aria-invalid="false" inputmode="decimal">`;
        if (vars && vars[i]) {
            html += `<span class="text-xs text-med-500 font-mono shrink-0">${escHtml(vars[i])}</span>`;
        }
        html += `</div>`;
    }
    html += '</div></div>';
    form.innerHTML = html;
    form.dataset.n = String(n);
    form.dataset.key = key;

    for (const id of Object.keys(prev)) {
        const el = document.getElementById(id);
        if (el) el.value = prev[id];
    }

    form.querySelectorAll('input[type="number"]').forEach(inp => {
        inp.addEventListener('input', () => validateFreeInput(inp));
    });
}

export function validateFreeInput(inp) {
    if (inp.value === '') {
        inp.setAttribute('aria-invalid', 'false');
        return true;
    }
    const val = parseFloat(inp.value);
    const valid = !isNaN(val) && isFinite(val) && val >= -1e6 && val <= 1e6;
    inp.setAttribute('aria-invalid', valid ? 'false' : 'true');
    return valid;
}

export function showFreeError(msg) {
    const err = document.getElementById('free-error');
    if (!err) return;
    err.textContent = msg;
    err.classList.remove('hidden');
}

export function clearFreeError() {
    const err = document.getElementById('free-error');
    if (!err) return;
    err.textContent = '';
    err.classList.add('hidden');
}

export function loadExample() {
    const n = parseInt(document.getElementById('free-size').value);
    const entry = FREE_EXAMPLES[n];
    if (Array.isArray(entry)) {
        state.freeExampleIndex = (state.freeExampleIndex + 1) % entry.length;
    }
    const example = getFreeExample(n);
    if (!example) return;

    state.freeContextData = { context: example.context, variables: example.variables };
    clearFreeError();
    buildFreeForm();
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const cell = document.getElementById(`fm-${i}-${j}`);
            if (cell) {
                cell.value = String(example.matrix[i][j]);
                cell.setAttribute('aria-invalid', 'false');
            }
        }
        const vec = document.getElementById(`fv-${i}`);
        if (vec) {
            vec.value = String(example.vector[i]);
            vec.setAttribute('aria-invalid', 'false');
        }
    }
    renderFreeContext();
    showToast(t('free.exampleLoaded', { n }), 'info');
}

export function clearFreeMode() {
    state.freeExampleIndex = -1;
        clearFreeError();

    const ctxInput = document.getElementById('free-context-input');
    if (ctxInput) ctxInput.value = '';
    const varsInput = document.getElementById('free-vars-input');
    if (varsInput) varsInput.value = '';

    renderFreeContext();
    buildFreeForm();

    const form = document.getElementById('free-form');
    if (form) {
        form.querySelectorAll('input[type="number"]').forEach(inp => {
            inp.value = '';
            inp.setAttribute('aria-invalid', 'false');
        });
    }

    resetFreeResultPanel();
    showToast(t('free.cleared'), 'info');
}

function freePlay() { state.freeViz.play(); }
function freePause() { state.freeViz.pause(); }
function freeStepForward() { state.freeViz.stepForward(); }
function freeReset() { state.freeViz.reset(); }
function freeSetSpeed() {
    const ms = parseInt(document.getElementById('free-speed-select').value);
    state.freeViz.setSpeed(ms);
}
function freeGoToStep(val) { state.freeViz.goTo(parseInt(val)); }

export { freePlay, freePause, freeStepForward, freeReset, freeSetSpeed, freeGoToStep };

export function rerenderFree() {
    buildFreeForm();
    renderFreeContext();
    if (state.freeCalc) {
        updateStepUI(state.freeViz ? state.freeViz.currentStep : 0, state.freeCalc.steps.length, 'free');
        renderFreeBadge();
        renderFreeSolution();
    }
}

export async function solveFreeMode() {
    const n = parseInt(document.getElementById('free-size').value);
    const matrix = [];
    const vector = [];
    clearFreeError();
    let firstInvalid = null;

    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            const inp = document.getElementById(`fm-${i}-${j}`);
            const valid = validateFreeInput(inp);
            if (!valid || inp.value === '') {
                if (!firstInvalid) firstInvalid = inp;
                showFreeError(t('free.invalidCell', { r: i, c: j }));
                inp.focus();
                return;
            }
            row.push(parseFloat(inp.value));
        }
        matrix.push(row);
        const vInp = document.getElementById(`fv-${i}`);
        const vValid = validateFreeInput(vInp);
        if (!vValid || vInp.value === '') {
            if (!firstInvalid) firstInvalid = vInp;
            showFreeError(t('free.invalidVec', { r: i }));
            vInp.focus();
            return;
        }
        vector.push(parseFloat(vInp.value));
    }

    if (!state.freeContextData || !state.freeContextData.context) {
        const ctxEl = document.getElementById('free-context-input');
        const varsEl = document.getElementById('free-vars-input');
        const ctx = ctxEl ? ctxEl.value.trim() : '';
        const vs = varsEl
            ? varsEl.value.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        if (ctx || vs.length) {
            state.freeContextData = { context: ctx, variables: vs };
            renderFreeContext();
        }
    }

    try {
        state.currentCase = null;
        state.freeResult = await api.calculateCustom(matrix, vector);
        state.freeCalc = state.freeResult;
        state.calculationResult = state.freeResult;
        showFreeResult();
    } catch (e) {
        handleApiError(e);
    }
}

export function showFreeResult() {
    document.getElementById('free-placeholder')?.classList.add('hidden');
    document.getElementById('free-result-panel')?.classList.remove('hidden');

    const ctxBox = document.getElementById('free-result-context');
    const ctxText = document.getElementById('free-result-context-text');
    if (ctxBox && ctxText) {
        if (state.freeContextData && state.freeContextData.context) {
            ctxBox.classList.remove('hidden');
            ctxText.textContent = `${t('free.context.result')} ${state.freeContextData.context}`;
        } else {
            ctxBox.classList.add('hidden');
            ctxText.textContent = '';
        }
    }

    state.freeViz.loadSteps(state.freeCalc.steps);
    const slider = document.getElementById('free-step-slider');
    slider.max = Math.max(0, state.freeCalc.steps.length - 1);
    slider.value = 0;
    updateStepUI(0, state.freeCalc.steps.length, 'free');
    renderFreeBadge();
    renderFreeSolution();
}

export function renderFreeBadge() {
    const badge = document.getElementById('free-badge');
    const margin = document.getElementById('free-error-margin');
    if (!badge || !state.freeCalc) return;
    if (state.freeCalc.verified) {
        badge.textContent = `✅ ${t('free.verified')}`;
        badge.className = 'text-xs px-2 py-0.5 rounded-full bg-med-900/60 text-med-400 border border-med-800 anim-badge-in';
    } else {
        badge.textContent = `❌ ${t('free.unverified')}`;
        badge.className = 'text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 border border-red-800 anim-badge-in';
    }
    if (margin) {
        margin.textContent = state.freeCalc.error_margin != null
            ? `${t('solver.error')}: ${state.freeCalc.error_margin.toFixed(12)}`
            : '';
    }
}

export function renderFreeSolution() {
    const panel = document.getElementById('free-solution-panel');
    const values = document.getElementById('free-solution-values');
    if (!state.freeCalc || !state.freeCalc.solution) {
        panel?.classList.add('hidden');
        return;
    }
    panel?.classList.remove('hidden');
    const freeVars = (state.freeContextData && state.freeContextData.variables) || null;
    values.innerHTML = state.freeCalc.solution.map((v, i) => `
        <div class="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
            <span class="text-sm text-gray-400">${freeVars && freeVars[i] ? escHtml(freeVars[i]) : `x${i}`}</span>
            <span class="font-mono font-semibold text-white">${v.toFixed(4)}</span>
        </div>
    `).join('');
}
