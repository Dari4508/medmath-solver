let viz;
let freeViz;
let currentView = 'cases';
let currentCase = null;
let calculationResult = null;
let freeResult = null;
let freeCalc = null;

const DICT = {
    es: {
        'nav.cases': 'Casos',
        'nav.free': 'Modo Libre',
        'nav.history': 'Historial',
        'tagline': 'Eliminación de Gauss · Farmacia Hospitalaria',
        'a11y.skip': 'Saltar al contenido principal',
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
        'free.example': 'Cargar ejemplo',
        'free.exampleHint': 'Carga un sistema de ejemplo según la dimensión seleccionada',
        'free.exampleLoaded': 'Ejemplo {n}×{n} cargado',
        'free.clear': 'Limpiar',
        'free.cleared': 'Formulario limpiado',
        'free.noResult': 'Los resultados y la animación de Gauss aparecerán aquí',
        'free.verified': 'Verificado',
        'free.unverified': 'No verificado',
        'free.solution': 'Solución',
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
        'history.detail': 'Ver detalle',
        'history.steps': '{n} pasos',
        'free.context.title': 'Contexto clínico',
        'free.context.optional': 'Contexto clínico (opcional)',
        'free.context.placeholder': 'Describe el objetivo: ej. Preparar 500mL de NaCl 0.45%...',
        'free.context.varsPlaceholder': 'Variables separadas por coma: ml_NS_09, ml_agua',
        'free.context.varsLabel': 'Nombres de variables',
        'free.context.result': 'Contexto:',
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
        'rate.badge': 'Cotas: {remaining}/{limit}',
        'rate.cooldown': 'Rate limit — {s}s',
    },
    en: {
        'nav.cases': 'Cases',
        'nav.free': 'Free Mode',
        'nav.history': 'History',
        'tagline': 'Gaussian Elimination · Hospital Pharmacy',
        'a11y.skip': 'Skip to main content',
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
        'free.example': 'Load example',
        'free.exampleHint': 'Load an example system for the selected dimensions',
        'free.exampleLoaded': 'Example {n}×{n} loaded',
        'free.clear': 'Clear',
        'free.cleared': 'Form cleared',
        'free.noResult': 'Results and Gauss animation will appear here',
        'free.verified': 'Verified',
        'free.unverified': 'Not verified',
        'free.solution': 'Solution',
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
        'history.detail': 'View details',
        'history.steps': '{n} steps',
        'free.context.title': 'Clinical context',
        'free.context.optional': 'Clinical context (optional)',
        'free.context.placeholder': 'Describe the goal: e.g. Prepare 500mL of 0.45% NaCl...',
        'free.context.varsPlaceholder': 'Variable names separated by commas: ml_NS_09, ml_water',
        'free.context.varsLabel': 'Variable names',
        'free.context.result': 'Context:',
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
        'rate.badge': 'Quota: {remaining}/{limit}',
        'rate.cooldown': 'Rate limit — {s}s',
    },
};

const qsLang = new URLSearchParams(location.search).get('lang');
let lang = qsLang && DICT[qsLang]
    ? qsLang
    : (localStorage.getItem('medmath-lang') || navigator.language || 'es').slice(0, 2);
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
        el.setAttribute('aria-label', t(el.getAttribute('data-i18n-title')));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    const sel = document.getElementById('lang-select');
    if (sel) sel.value = lang;
}

function refreshViewText() {
    if (currentView === 'cases' && casesCache.length) renderCases(casesCache);
    if (currentView === 'free') {
        buildFreeForm();
        renderFreeContext();
    }
    if (currentView === 'history') loadHistory();
    if (currentView === 'solver' && calculationResult) {
        updateStepUI(viz ? viz.currentStep : 0, calculationResult?.steps?.length || 1, 'solver');
        renderVerification();
        renderCaseInfo();
    }
    if (currentView === 'free' && freeCalc) {
        updateStepUI(freeViz ? freeViz.currentStep : 0, freeCalc.steps.length, 'free');
        renderFreeBadge();
        renderFreeSolution();
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

document.addEventListener('DOMContentLoaded', () => {
    viz = new GaussVisualizer('matrix-canvas');
    freeViz = new GaussVisualizer('free-matrix-canvas', 'free');
    document.documentElement.lang = lang;
    applyI18n();
    renderFreeContext();
    loadCases();
});

// --- Navigation ---
function showView(view) {
    if (currentView === 'solver' && view !== 'solver' && viz) viz.pause();
    if (currentView === 'free' && view !== 'free' && freeViz) freeViz.pause();

    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${view}`).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`nav-${view}`)?.classList.add('active');
    currentView = view;

    if (view === 'history') loadHistory();
    if (view === 'free') buildFreeForm();
}

// --- Cases ---
let casesCache = [];

async function loadCases() {
    renderCasesSkeleton();
    try {
        casesCache = await api.getCases();
        renderCases(casesCache);
    } catch (e) {
        handleApiError(e);
    }
}

function renderCasesSkeleton() {
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

function renderCases(cases) {
    const grid = document.getElementById('cases-grid');
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = cases.map(c => `
        <div class="case-card" role="button" tabindex="0" onclick="selectCase(${c.id})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectCase(${c.id})}" aria-label="${escHtml(c.name)}">
            <div class="flex items-start justify-between mb-3">
                <span class="case-badge">${c.matrix.length}×${c.matrix.length}</span>
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

async function selectCase(id) {
    try {
        currentCase = await api.getCase(id);
        calculationResult = await api.calculateCase(id);
        freeCalc = null;
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

    const title = currentCase ? currentCase.name : t('solver.freeMode');
    document.getElementById('solver-title').textContent = title;

    viz.loadSteps(calculationResult.steps);

    const slider = document.getElementById('step-slider');
    slider.max = calculationResult.steps.length - 1;
    slider.value = 0;
    updateStepUI(0, calculationResult.steps.length, 'solver');

    renderVerification();
    renderSolution();
    renderCaseInfo();
}

function renderVerification() {
    const panel = document.getElementById('verification-status');
    if (!calculationResult) return;
    if (calculationResult.verified) {
        panel.innerHTML = `
            <div class="text-center">
                <div class="text-4xl mb-2 anim-pop">✅</div>
                <div class="text-med-400 font-semibold">${t('solver.verified')}</div>
                <div class="text-xs text-gray-500 mt-1">${t('solver.error')}: ${calculationResult.error_margin?.toFixed(12) || 0}</div>
                ${currentCase ? `<div class="text-xs text-gray-500 mt-2">${t('solver.source')}: ${escHtml(currentCase.reference_source)}</div>` : ''}
            </div>`;
    } else {
        panel.innerHTML = `
            <div class="text-center">
                <div class="text-4xl mb-2 anim-pop">❌</div>
                <div class="text-red-400 font-semibold">${t('solver.unverified')}</div>
                <div class="text-xs text-gray-500 mt-1">${escHtml(calculationResult.message)}</div>
            </div>`;
    }
}

function renderSolution() {
    const panel = document.getElementById('solution-panel');
    const values = document.getElementById('solution-values');
    if (!calculationResult || !calculationResult.solution) {
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
        <div><span class="text-gray-500">${t('solver.expected')}</span> <span class="font-mono text-med-400">${currentCase.expected.map((v, i) => `${v.toFixed(2)} ${escHtml(currentCase.units[i] || '')}`).join(', ')}</span></div>
    `;
}

// --- Animation Controls (case solver) ---
function playAnimation() { viz.play(); }
function pauseAnimation() { viz.pause(); }
function stepForward() { viz.stepForward(); }
function resetAnimation() { viz.reset(); }
function setSpeed() {
    const ms = parseInt(document.getElementById('speed-select').value);
    viz.setSpeed(ms);
}
function goToStep(val) { viz.goTo(parseInt(val)); }

// --- Animation Controls (free mode) ---
function freePlay() { freeViz.play(); }
function freePause() { freeViz.pause(); }
function freeStepForward() { freeViz.stepForward(); }
function freeReset() { freeViz.reset(); }
function freeSetSpeed() {
    const ms = parseInt(document.getElementById('free-speed-select').value);
    freeViz.setSpeed(ms);
}
function freeGoToStep(val) { freeViz.goTo(parseInt(val)); }

function updateStepUI(step, total, uiContext = 'solver') {
    const prefix = uiContext === 'free' ? 'free-' : '';
    const result = uiContext === 'free' ? freeCalc : calculationResult;
    const counter = document.getElementById(`${prefix}step-counter`);
    const slider = document.getElementById(`${prefix}step-slider`);
    const desc = document.getElementById(`${prefix}step-desc`);
    if (!counter || !result) return;
    counter.textContent = t('solver.stepCounter', { step, total: total - 1 });
    if (slider) slider.value = step;
    if (step < result.steps.length && desc) {
        const text = result.steps[step].description || '';
        desc.innerHTML = `<span class="text-gauss-400">[${step}]</span>&nbsp; ${escHtml(text)}`;
    }
}

// --- Free Mode ---
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

let freeExampleIndex = -1;
let freeContextData = null;

function getFreeExample(n) {
    const entry = FREE_EXAMPLES[n];
    if (Array.isArray(entry)) {
        return entry[freeExampleIndex % entry.length];
    }
    return entry || null;
}

function onFreeSizeChange() {
    freeExampleIndex = -1;
    freeContextData = null;
    buildFreeForm();
    renderFreeContext();
    resetFreeResultPanel();
}

function resetFreeResultPanel() {
    freeCalc = null;
    if (freeViz) freeViz.pause();
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

function renderFreeContext() {
    const panel = document.getElementById('free-context-panel');
    const text = document.getElementById('free-context-text');
    const varList = document.getElementById('free-context-vars');
    const editable = document.getElementById('free-context-edit');
    if (!panel || !text || !varList) return;

    if (freeContextData && freeContextData.context) {
        editable?.classList.add('hidden');
        panel.classList.remove('hidden');
        text.textContent = freeContextData.context;
        const vars = freeContextData.variables || [];
        varList.innerHTML = vars.map((v, i) =>
            `<span class="text-xs bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 font-mono text-med-400">x${i} = ${escHtml(v)}</span>`
        ).join('');
    } else {
        panel.classList.add('hidden');
        varList.innerHTML = '';
        editable?.classList.remove('hidden');
    }
}

function buildFreeForm() {
    const n = parseInt(document.getElementById('free-size').value);
    const form = document.getElementById('free-form');
    const vars = (freeContextData && freeContextData.variables) || null;
    const key = `${n}|${lang}|${(vars || []).join(',')}`;
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

function validateFreeInput(inp) {
    if (inp.value === '') {
        inp.setAttribute('aria-invalid', 'false');
        return true;
    }
    const val = parseFloat(inp.value);
    const valid = !isNaN(val) && isFinite(val) && val >= -1e6 && val <= 1e6;
    inp.setAttribute('aria-invalid', valid ? 'false' : 'true');
    return valid;
}

function showFreeError(msg) {
    const err = document.getElementById('free-error');
    if (!err) return;
    err.textContent = msg;
    err.classList.remove('hidden');
}

function clearFreeError() {
    const err = document.getElementById('free-error');
    if (!err) return;
    err.textContent = '';
    err.classList.add('hidden');
}

function loadExample() {
    const n = parseInt(document.getElementById('free-size').value);
    const entry = FREE_EXAMPLES[n];
    if (Array.isArray(entry)) {
        freeExampleIndex = (freeExampleIndex + 1) % entry.length;
    }
    const example = getFreeExample(n);
    if (!example) return;

    freeContextData = { context: example.context, variables: example.variables };
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

function clearFreeMode() {
    freeExampleIndex = -1;
    freeContextData = null;
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

async function solveFreeMode() {
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

    if (!freeContextData || !freeContextData.context) {
        const ctxEl = document.getElementById('free-context-input');
        const varsEl = document.getElementById('free-vars-input');
        const ctx = ctxEl ? ctxEl.value.trim() : '';
        const vs = varsEl
            ? varsEl.value.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        if (ctx || vs.length) {
            freeContextData = { context: ctx, variables: vs };
            renderFreeContext();
        }
    }

    try {
        currentCase = null;
        freeResult = await api.calculateCustom(matrix, vector);
        freeCalc = freeResult;
        calculationResult = freeResult;
        showFreeResult();
    } catch (e) {
        handleApiError(e);
    }
}

function showFreeResult() {
    document.getElementById('free-placeholder')?.classList.add('hidden');
    document.getElementById('free-result-panel')?.classList.remove('hidden');

    const ctxBox = document.getElementById('free-result-context');
    const ctxText = document.getElementById('free-result-context-text');
    if (ctxBox && ctxText) {
        if (freeContextData && freeContextData.context) {
            ctxBox.classList.remove('hidden');
            ctxText.textContent = `${t('free.context.result')} ${freeContextData.context}`;
        } else {
            ctxBox.classList.add('hidden');
            ctxText.textContent = '';
        }
    }

    freeViz.loadSteps(freeCalc.steps);
    const slider = document.getElementById('free-step-slider');
    slider.max = Math.max(0, freeCalc.steps.length - 1);
    slider.value = 0;
    updateStepUI(0, freeCalc.steps.length, 'free');
    renderFreeBadge();
    renderFreeSolution();
}

function renderFreeBadge() {
    const badge = document.getElementById('free-badge');
    const margin = document.getElementById('free-error-margin');
    if (!badge || !freeCalc) return;
    if (freeCalc.verified) {
        badge.textContent = `✅ ${t('free.verified')}`;
        badge.className = 'text-xs px-2 py-0.5 rounded-full bg-med-900/60 text-med-400 border border-med-800 anim-badge-in';
    } else {
        badge.textContent = `❌ ${t('free.unverified')}`;
        badge.className = 'text-xs px-2 py-0.5 rounded-full bg-red-900/50 text-red-400 border border-red-800 anim-badge-in';
    }
    if (margin) {
        margin.textContent = freeCalc.error_margin != null
            ? `${t('solver.error')}: ${freeCalc.error_margin.toFixed(12)}`
            : '';
    }
}

function renderFreeSolution() {
    const panel = document.getElementById('free-solution-panel');
    const values = document.getElementById('free-solution-values');
    if (!freeCalc || !freeCalc.solution) {
        panel?.classList.add('hidden');
        return;
    }
    panel?.classList.remove('hidden');
    const freeVars = (freeContextData && freeContextData.variables) || null;
    values.innerHTML = freeCalc.solution.map((v, i) => `
        <div class="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
            <span class="text-sm text-gray-400">${freeVars && freeVars[i] ? escHtml(freeVars[i]) : `x${i}`}</span>
            <span class="font-mono font-semibold text-white">${v.toFixed(4)}</span>
        </div>
    `).join('');
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

async function showHistoryDetail(id) {
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
let rateBadgeTimer = null;

function updateRateBadge(status, remaining, limit, retryAfter) {
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

function showToast(msg, type = 'info') {
    const tEl = document.getElementById('toast');
    tEl.textContent = msg;
    tEl.className = `fixed bottom-4 right-4 rounded-lg px-4 py-3 text-sm shadow-xl transition-all duration-300 z-50 ${
        type === 'error' ? 'bg-red-900/90 border border-red-700 text-red-200' : 'bg-gray-800 border border-gray-700 text-gray-200'
    }`;
    tEl.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => { tEl.classList.add('translate-y-20', 'opacity-0'); }, 3000);
}
