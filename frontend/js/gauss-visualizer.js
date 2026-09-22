class GaussVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.steps = [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.animationTimer = null;
        this.speed = 1000;
        this.prevMatrix = null;
        this._resize = () => this.drawStep(this.currentStep);
        window.addEventListener('resize', this._resize);
    }

    destroy() {
        window.removeEventListener('resize', this._resize);
        this.pause();
        this.steps = [];
        this.currentStep = 0;
        this.prevMatrix = null;
    }

    loadSteps(steps) {
        this.steps = steps;
        this.currentStep = 0;
        this.prevMatrix = null;
        this.drawStep(0);
    }

    drawStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this.steps.length) return;
        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        const matrix = step.matrix;
        const n = matrix.length;
        const cols = n + 1;

        const cellW = 80;
        const cellH = 40;
        const gap = 2;
        const totalW = cols * (cellW + gap) + 40;
        const totalH = n * (cellH + gap) + 20;

        this.canvas.width = totalW;
        this.canvas.height = totalH;

        this.ctx.clearRect(0, 0, totalW, totalH);

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * (cellW + gap) + 20;
                const y = r * (cellH + gap) + 10;
                const val = matrix[r][c];

                // Background color
                let bg = '#1f2937';
                let textColor = '#e5e7eb';

                // Highlight pivot row
                if (step.pivot_row === r && step.action !== 'eliminate') {
                    bg = '#422006';
                    textColor = '#fbbf24';
                }
                // Highlight target row during elimination
                if (step.target_row === r) {
                    bg = '#1e3a5f';
                    textColor = '#60a5fa';
                }
                // Separator between A and b
                if (c === n) {
                    this.ctx.fillStyle = '#4b5563';
                    this.ctx.fillRect(x - gap / 2, y, gap, cellH);
                }

                // Mark pivot element
                if (step.action !== 'eliminate' && step.pivot_row === r && step.pivot_col === c) {
                    this.ctx.strokeStyle = '#22c55e';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
                }

                // Cell background
                this.ctx.fillStyle = bg;
                this.roundRect(x, y, cellW, cellH, 4);

                // Cell border
                this.ctx.strokeStyle = '#374151';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, cellW, cellH);

                // Value text
                this.ctx.fillStyle = textColor;
                this.ctx.font = '13px "JetBrains Mono", "Fira Code", monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(this.formatVal(val), x + cellW / 2, y + cellH / 2);
            }
        }

        // Row labels
        this.ctx.fillStyle = '#6b7280';
        this.ctx.font = '11px sans-serif';
        this.ctx.textAlign = 'right';
        for (let r = 0; r < n; r++) {
            this.ctx.fillText(`F${r}`, 14, r * (cellH + gap) + 10 + cellH / 2);
        }

        // Variable labels below
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#9ca3af';
        for (let c = 0; c < n; c++) {
            this.ctx.fillText(`x${c}`, c * (cellW + gap) + 20 + cellW / 2, totalH - 2);
        }
        this.ctx.fillText('b', (n) * (cellW + gap) + 20 + cellW / 2, totalH - 2);

        // Highlight changed cells
        if (this.prevMatrix && step.action === 'eliminate') {
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < cols; c++) {
                    if (Math.abs((matrix[r][c] || 0) - (this.prevMatrix[r]?.[c] || 0)) > 1e-12) {
                        const x = c * (cellW + gap) + 20;
                        const y2 = r * (cellH + gap) + 10;
                        this.ctx.strokeStyle = '#22c55e';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(x + 1, y2 + 1, cellW - 2, cellH - 2);
                    }
                }
            }
        }

        this.prevMatrix = matrix.map(row => [...row]);
        this.canvas.style.width = '100%';
        this.canvas.style.maxWidth = totalW + 'px';
        this.canvas.style.height = 'auto';
    }

    formatVal(v) {
        if (Math.abs(v) < 1e-10) return '0';
        if (Math.abs(v - Math.round(v)) < 1e-10) return Math.round(v).toString();
        return v.toFixed(4);
    }

    roundRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this._tick();
    }

    _tick() {
        if (!this.isPlaying || this.currentStep >= this.steps.length - 1) {
            this.isPlaying = false;
            return;
        }
        this.currentStep++;
        this.drawStep(this.currentStep);
        updateStepUI(this.currentStep, this.steps.length);
        this.animationTimer = setTimeout(() => this._tick(), this.speed);
    }

    pause() {
        this.isPlaying = false;
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }
    }

    stepForward() {
        this.pause();
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.drawStep(this.currentStep);
            updateStepUI(this.currentStep, this.steps.length);
        }
    }

    reset() {
        this.pause();
        this.currentStep = 0;
        this.prevMatrix = null;
        this.drawStep(0);
        updateStepUI(0, this.steps.length);
    }

    goTo(index) {
        this.pause();
        this.currentStep = Math.max(0, Math.min(index, this.steps.length - 1));
        this.prevMatrix = this.currentStep > 0
            ? this.steps[this.currentStep - 1].matrix.map(r => [...r])
            : null;
        this.drawStep(this.currentStep);
        updateStepUI(this.currentStep, this.steps.length);
    }

    setSpeed(ms) {
        this.speed = ms;
    }
}
