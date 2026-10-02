export function showToast(msg, type = 'info') {
    const tEl = document.getElementById('toast');
    tEl.textContent = msg;
    tEl.className = `fixed bottom-4 right-4 rounded-lg px-4 py-3 text-sm shadow-xl transition-all duration-300 z-50 ${
        type === 'error' ? 'bg-red-900/90 border border-red-700 text-red-200' : 'bg-gray-800 border border-gray-700 text-gray-200'
    }`;
    tEl.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => { tEl.classList.add('translate-y-20', 'opacity-0'); }, 3000);
}
