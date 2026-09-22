let viz;
let currentView = 'cases';
let currentCase = null;
let calculationResult = null;

const DICT = {
    es: {
        'nav.cases': 'Casos',
        'nav.free': 'Modo Libre',
        'nav.history': 'Historial',
        'tagline': 'Eliminación de Gauss · Farmacia Hospitalaria',
        'cases.title': 'Casos Clínicos Precargados',
        'cases.source': 'Fuente',
        'cases.vars': 'vars',
        'cases.error': 'Error cargando casos: ',
        'free.title': 'Modo Libre — Ingresa tu Sistema',
        'free.dimensions': 'Dimensiones:',
        'free.hint': 'Ingresa los coeficientes de la matriz A y el vector b:',
        'free.solve': 'Resolver con Gauss',
        'free.invalidCell': 'Valor inválido en fila {r}, columna {c}',
        'free.invalidVec': 'Valor inválido en vector b, fila {r}',
        'history.title': 'Historial de Cálculos',
        'history.empty': 'No hay cálculos registrados',
        'history.case': 'Caso #{id}',
        'history.free': 'Modo libre',
        'history.verified': '✅ Verificado',
        'history.unverified': '—',
        'history.error': 'Error cargando historial',
        'history.clear': 'Limpiar historial',
        'history.export': 'Exportar CSV',
        'history.delete': 'Eliminar',
        'history.deleted': 'Entrada eliminada',
        'history.cleared': 'Historial limpiado',
        'history.confirmDelete': '¿Eliminar esta entrada del historial?',
        'history.confirmClear': '¿Borrar todo el historial?',
        'history.detailError': 'No se pudo cargar el detalle',
        'solver.play': 'Play',
        'solver.pause': 'Pause',
        'solver.step': 'Step',
        'solver.reset': 'Reset',
        'solver.stepDesc': 'Presiona Play o Step para iniciar la animación',
        'solver.stepCounter': 'Paso {step} / {total}',
        'solver.verified': 'Verificado',
        'solver.unverified': 'No verificado',
        'solver.verification': 'Verificación',
        'solver.waiting': 'Esperando resultado...',
        'solver.error': 'Error',
        'solver.solution': 'Solución',
        'solver.caseInfo': 'Info del Caso',
        'solver.description': 'Descripción:',
        'solver.clinicalNotes': 'Notas clínicas:',
        'solver.expected': 'Esperado:',
        'solver.back': '← Volver a casos',
        'solver.freeMode': 'Modo Libre',
        'solver.source': 'Fuente',
        'error.generic': 'Error: ',
        'rate.limit': 'Rate limit excedido — reintenta en {s}s',
        'rate.limit.wait': 'Rate limit excedido — espera un momento',
    },
    en: {
        'nav.cases': 'Cases',
        'nav.free': 'Free Mode',
        'nav.history': 'History',
        'tagline': 'Gaussian Elimination · Hospital Pharmacy',
        'cases.title': 'Preloaded Clinical Cases',
        'cases.source': 'Source',
        'cases.vars': 'vars',
        'cases.error': 'Error loading cases: ',
        'free.title': 'Free Mode — Enter Your System',
        'free.dimensions': 'Dimensions:',
        'free.hint': 'Enter the coefficients of matrix A and vector b:',
        'free.solve': 'Solve with Gauss',
        'free.invalidCell': 'Invalid value at row {r}, column {c}',
        'free.invalidVec': 'Invalid value in vector b, row {r}',
        'history.title': 'Calculation History',
        'history.empty': 'No calculations recorded',
        'history.case': 'Case #{id}',
        'history.free': 'Free mode',
        'history.verified': '✅ Verified',
        'history.unverified': '—',
        'history.error': 'Error loading history',
        'history.clear': 'Clear history',
        'history.export': 'Export CSV',
        'history.delete': 'Delete',
        'history.deleted': 'Entry deleted',
        'history.cleared': 'History cleared',
        'history.confirmDelete': 'Delete this history entry?',
        'history.confirmClear': 'Delete the entire history?',
        'history.detailError': 'Could not load details',
        'solver.play': 'Play',
        'solver.pause': 'Pause',
        'solver.step': 'Step',
        'solver.reset': 'Reset',
        'solver.stepDesc': 'Press Play or Step to start the animation',
        'solver.stepCounter': 'Step {step} / {total}',
        'solver.verified': 'Verified',
        'solver.unverified': 'Not verified',
        'solver.verification': 'Verification',
        'solver.waiting': 'Waiting for result...',
        'solver.error': 'Error',
        'solver.solution': 'Solution',
        'solver.caseInfo': 'Case Info',
        'solver.description': 'Description:',
        'solver.clinicalNotes': 'Clinical notes:',
        'solver.expected': 'Expected:',
        'solver.back': '← Back to cases',
        'solver.freeMode': 'Free Mode',
        'solver.source': 'Source',
        'error.generic': 'Error: ',
        'rate.limit': 'Rate limit exceeded — retry in {s}s',
        'rate.limit.wait': 'Rate limit exceeded — wait a moment',
    },
};

let lang = (localStorage.getItem('medmath-lang') || navigator.language || 'es').slice(0, 2);
if (!DICT[lang]) lang = 'es';

function t(key, vars) {
    let s = (DICT[lang] && DICT[lang][key]) || DICT.es[key] || key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
}

function setLang(next) {
    if (!DICT[next]) return;
    lang = next;
    localStorage.setItem('medmath-lang', next);
    document.documentElement.lang = next;
    applyI18n();
    refreshViewText();
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.getAttribute('data-i18n-title'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    const sel = document.getElementById('lang-select');
    if (sel) sel.value = lang;
}

function refreshViewText() {
    if (currentView === 'history') loadHistory();
    if (currentView === 'solver') {
        updateStepUI(viz ? viz.currentStep : 0, calculationResult?.steps?.length || 1);
        renderVerification();
        renderCaseInfo();
    }
}

function apiErrorMessage(e) {
    if (e && e.name === 'RateLimitError') {
        return e.retryAfter
            ? t('rate.limit', { s: e.retryAfter })
            : t('rate.limit.wait');
    }
    return t('error.generic') + (e && e.message ? e.message : e);
}

function handleApiError(e) {
    if (e && e.name === 'RateLimitError') {
        if (rateLimitCooldown) return;
        rateLimitCooldown = true;
        const wait = (e.retryAfter || 5) * 1000;
        setTimeout(() => { rateLimitCooldown = false; }, wait);
    }
    showToast(apiErrorMessage(e), 'error');
}

document.addEventListener('DOMContentLoaded', () => {
    viz = new GaussVisualizer('matrix-canvas');
    document.documentElement.lang = lang;
    applyI18n();
    loadCases();
});

// --- Navigation ---
function showView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${view}`).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`nav-${view}`)?.classList.add('active');
    currentView = view;

    if (view === 'history') loadHistory();
    if (view === 'free') buildFreeForm();
}

// --- Cases ---
async function loadCases() {
    try {
        const cases = await api.getCases();
        renderCases(cases);
    } catch (e) {
        handleApiError(e);
    }
}

function renderCases(cases) {
    const grid = document.getElementById('cases-grid');
    grid.innerHTML = cases.map(c => `
        <div class="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-med-600 transition cursor-pointer group" role="button" tabindex="0" onclick="selectCase(${c.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectCase(${c.id})}" aria-label="${escHtml(c.name)}">
            <div class="flex items-start justify-between mb-3">
                <span class="text-xs bg-med-900/50 text-med-400 px-2 py-0.5 rounded-full">${c.matrix.length}×${c.matrix.length}</span>
                <span class="text-xs text-gray-500">${c.variables.length} ${t('cases.vars')}</span>
            </div>
            <h3 class="font-semibold mb-1 group-hover:text-med-400 transition">${escHtml(c.name)}</h3>
            <p class="text-sm text-gray-400 mb-3 line-clamp-2">${escHtml(c.description)}</p>
            <div class="text-xs text-gray-500">
                <span class="font-medium text-gray-400">${t('cases.source')}:</span> ${escHtml(c.reference_source)}
            </div>
        </div>
    `).join('');
}

async function selectCase(id) {
    try {
        currentCase = await api.getCase(id);
        calculationResult = await api.calculateCase(id);
        showSolver();
    } catch (e) {
        handleApiError(e);
    }
}

// --- Solver ---
function showSolver() {
    showView('solver');
    document.getElementById('view-solver').classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const title = currentCase ? currentCase.name : t('solver.freeMode');
    document.getElementById('solver-title').textContent = title;

    viz.loadSteps(calculationResult.steps);

    const slider = document.getElementById('step-slider');
    slider.max = calculationResult.steps.length - 1;
    slider.value = 0;
    updateStepUI(0, calculationResult.steps.length);

    renderVerification();
    renderSolution();
    renderCaseInfo();
}

function renderVerification() {
    const panel = document.getElementById('verification-status');
    if (calculationResult.verified) {
        panel.innerHTML = `
            <div class="text-center">
                <div class="text-4xl mb-2">✅</div>
                <div class="text-med-400 font-semibold">${t('solver.verified')}</div>
                <div class="text-xs text-gray-500 mt-1">${t('solver.error')}: ${calculationResult.error_margin?.toFixed(12) || 0}</div>
                ${currentCase ? `<div class="text-xs text-gray-500 mt-2">${t('solver.source')}: ${escHtml(currentCase.reference_source)}</div>` : ''}
            </div>`;
    } else {
        panel.innerHTML = `
            <div class="text-center">
                <div class="text-4xl mb-2">❌</div>
                <div class="text-red-400 font-semibold">${t('solver.unverified')}</div>
                <div class="text-xs text-gray-500 mt-1">${escHtml(calculationResult.message)}</div>
            </div>`;
    }
}

function renderSolution() {
    const panel = document.getElementById('solution-panel');
    const values = document.getElementById('solution-values');
    if (!calculationResult.solution) {
        panel.classList.add('hidden');
        return;
    }
    panel.classList.remove('hidden');
    const vars = currentCase?.variables || calculationResult.solution.map((_, i) => `x${i}`);
    const units = currentCase?.units || calculationResult.solution.map(() => '');
    values.innerHTML = calculationResult.solution.map((v, i) => `
        <div class="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
            <span class="text-sm text-gray-400">${escHtml(vars[i])}</span>
            <span class="font-mono font-semibold text-white">${v.toFixed(4)} <span class="text-gray-500 text-xs">${escHtml(units[i])}</span></span>
        </div>
    `).join('');
}

function renderCaseInfo() {
    const panel = document.getElementById('case-info-panel');
    if (!currentCase) {
        panel.classList.add('hidden');
        return;
    }
    panel.classList.remove('hidden');
    document.getElementById('case-info-content').innerHTML = `
        <div><span class="text-gray-500">${t('solver.description')}</span> ${escHtml(currentCase.description)}</div>
        ${currentCase.clinical_notes ? `<div class="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-2 text-yellow-300 text-xs"><strong>${t('solver.clinicalNotes')}</strong> ${escHtml(currentCase.clinical_notes)}</div>` : ''}
        <div><span class="text-gray-500">${t('solver.expected')}</span> <span class="font-mono text-med-400">${currentCase.expected.map((v, i) => `${v.toFixed(2)} ${currentCase.units[i]}`).join(', ')}</span></div>
    `;
}

// --- Animation Controls ---
function playAnimation() { viz.play(); }
function pauseAnimation() { viz.pause(); }
function stepForward() { viz.stepForward(); }
function resetAnimation() { viz.reset(); }
function setSpeed() {
    const ms = parseInt(document.getElementById('speed-select').value);
    viz.setSpeed(ms);
}
function goToStep(val) { viz.goTo(parseInt(val)); }

function updateStepUI(step, total) {
    document.getElementById('step-counter').textContent = t('solver.stepCounter', { step, total: total - 1 });
    document.getElementById('step-slider').value = step;
    if (step < calculationResult.steps.length) {
        const desc = calculationResult.steps[step].description || '';
        document.getElementById('step-desc').innerHTML = `<span class="text-gauss-400">[${step}]</span>&nbsp; ${escHtml(desc)}`;
    }
}

// --- Free Mode ---
function buildFreeForm() {
    const n = parseInt(document.getElementById('free-size').value);
    const form = document.getElementById('free-form');
    let html = '<div class="space-y-3">';
    html += `<p class="text-xs text-gray-500">${t('free.hint')}</p>`;

    for (let i = 0; i < n; i++) {
        html += `<div class="flex items-center gap-2">`;
        html += `<span class="text-xs text-gray-500 w-6">F${i}:</span>`;
        for (let j = 0; j < n; j++) {
            html += `<input type="number" step="any" id="fm-${i}-${j}" class="matrix-input w-20" placeholder="a${i}${j}" aria-label="a${i}${j}">`;
        }
        html += `<span class="text-gray-600 mx-1">|</span>`;
        html += `<input type="number" step="any" id="fv-${i}" class="matrix-input w-20" placeholder="b${i}" aria-label="b${i}">`;
        html += `</div>`;
    }
    html += '</div>';
    form.innerHTML = html;
}

async function solveFreeMode() {
    const n = parseInt(document.getElementById('free-size').value);
    const matrix = [];
    const vector = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            const val = parseFloat(document.getElementById(`fm-${i}-${j}`).value);
            if (isNaN(val)) { showToast(t('free.invalidCell', { r: i, c: j }), 'error'); return; }
            row.push(val);
        }
        matrix.push(row);
        const bv = parseFloat(document.getElementById(`fv-${i}`).value);
        if (isNaN(bv)) { showToast(t('free.invalidVec', { r: i }), 'error'); return; }
        vector.push(bv);
    }

    try {
        currentCase = null;
        calculationResult = await api.calculateCustom(matrix, vector);
        showSolver();
    } catch (e) {
        handleApiError(e);
    }
}

// --- History ---
async function loadHistory() {
    try {
        const history = await api.getHistory();
        renderHistory(history);
    } catch (e) {
        handleApiError(e);
    }
}

function renderHistory(entries) {
    const list = document.getElementById('history-list');
    const controls = `
        <div class="flex gap-2 mb-4">
            <button onclick="exportHistory()" class="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-xs transition" data-i18n="history.export">Exportar CSV</button>
            <button onclick="clearHistory()" class="bg-red-900/60 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded-lg text-xs transition" data-i18n="history.clear">Limpiar historial</button>
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
                <button class="ctrl-btn text-xs" title="${t('history.detailError')}" aria-label="${t('history.detailError')}" onclick="showHistoryDetail(${e.id})">ℹ</button>
                <button class="ctrl-btn text-xs" title="${t('history.delete')}" aria-label="${t('history.delete')}" onclick="deleteHistoryEntry(${e.id})">🗑</button>
            </div>
        </div>
    `).join('');
}

async function showHistoryDetail(id) {
    try {
        const entry = await api.getHistoryEntry(id);
        const steps = await api.getHistorySteps(id);
        showToast(`${entry.case_id ? t('history.case', { id: entry.case_id }) : t('history.free')} · ${steps.length} steps`, 'info');
    } catch (e) {
        handleApiError(e);
    }
}

async function deleteHistoryEntry(id) {
    if (!confirm(t('history.confirmDelete'))) return;
    try {
        await api.deleteHistoryEntry(id);
        showToast(t('history.deleted'), 'info');
        loadHistory();
    } catch (e) {
        handleApiError(e);
    }
}

async function clearHistory() {
    if (!confirm(t('history.confirmClear'))) return;
    try {
        await api.clearHistory();
        showToast(t('history.cleared'), 'info');
        loadHistory();
    } catch (e) {
        handleApiError(e);
    }
}

function exportHistory() {
    window.location.href = api.exportHistoryUrl();
}

// --- Utils ---
function escHtml(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

let rateLimitCooldown = false;

function showToast(msg, type = 'info') {
    const tEl = document.getElementById('toast');
    tEl.textContent = msg;
    tEl.className = `fixed bottom-4 right-4 rounded-lg px-4 py-3 text-sm shadow-xl transition-all duration-300 z-50 ${
        type === 'error' ? 'bg-red-900/90 border border-red-700 text-red-200' : 'bg-gray-800 border border-gray-700 text-gray-200'
    }`;
    tEl.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => { tEl.classList.add('translate-y-20', 'opacity-0'); }, 3000);
}
