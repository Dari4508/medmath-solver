import { t } from './i18n.js';
import { escHtml } from './utils.js';
import { state } from './state.js';

export function updateStepUI(step, total, uiContext = 'solver') {
    const prefix = uiContext === 'free' ? 'free-' : '';
    const result = uiContext === 'free' ? state.freeCalc : state.calculationResult;
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
