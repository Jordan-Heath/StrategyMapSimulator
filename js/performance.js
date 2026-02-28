class PerformanceTracker {
    constructor() {
        this.metrics = {
            update: [],
            draw: []
        };

        this.maxSamples = 60; // Keep last 60 samples for rolling average
        this.isEnabled = true;
        this.monitorElement = null;
    }

    createMonitorElement() {
        const element = document.createElement('div');
        element.id = 'performanceMonitor';
        element.className = 'performance-monitor';
        element.innerHTML = `
            <div class="perf-row" style="grid-column: span 2;">
                <span class="perf-label">FPS:</span>
                <span class="perf-value" id="perfFPS">60</span>
            </div>
            <div class="perf-row">
                <span class="perf-label">Update:</span>
                <span class="perf-value" id="perfUpdate">0ms</span>
            </div>
            <div class="perf-row">
                <span class="perf-label">Draw:</span>
                <span class="perf-value" id="perfDraw">0ms</span>
            </div>
            <div class="perf-row perf-warning" id="perfWarning" style="display: none;">
                ⚠️ High load
            </div>
        `;

        const speedControls = document.getElementById('speedControls');
        if (speedControls) {
            speedControls.appendChild(element);
        }

        return element;
    }

    init() {
        this.monitorElement = this.createMonitorElement();
        this.updateDisplay();
    }

    startMeasure(category) {
        if (!this.isEnabled) return null;
        return {
            category,
            startTime: performance.now()
        };
    }

    endMeasure(measurement) {
        if (!this.isEnabled || !measurement) return;

        const duration = performance.now() - measurement.startTime;
        this.addMetric(this.metrics[measurement.category], duration);
    }

    addMetric(metricArray, value) {
        metricArray.push(value);
        if (metricArray.length > this.maxSamples) {
            metricArray.shift();
        }
    }

    getAverage(metricArray) {
        if (metricArray.length === 0) return 0;
        const sum = metricArray.reduce((a, b) => a + b, 0);
        return sum / metricArray.length;
    }

    getFPS() {
        let defaultFramerate = 60;
        if (game.framerate) defaultFramerate = game.framerate;

        if (this.metrics.draw.length < 2) return defaultFramerate;
        const avgDrawTime = this.getAverage(this.metrics.draw);
        return Math.min(defaultFramerate, Math.round(1000 / Math.max(1, avgDrawTime)));
    }

    updateDisplay() {
        if (!this.isEnabled || !this.monitorElement) return;

        const avgUpdate = this.getAverage(this.metrics.update);
        const avgDraw = this.getAverage(this.metrics.draw);
        const fps = this.getFPS();

        const fpsEl = document.getElementById('perfFPS');
        const updateEl = document.getElementById('perfUpdate');
        const drawEl = document.getElementById('perfDraw');
        const warningEl = document.getElementById('perfWarning');

        if (fpsEl) fpsEl.textContent = fps;
        if (updateEl) updateEl.textContent = `${avgUpdate.toFixed(1)}ms`;
        if (drawEl) drawEl.textContent = `${avgDraw.toFixed(1)}ms`;

        if (warningEl) {
            if (fps < 30 || avgUpdate > 50) {
                warningEl.style.display = 'flex';
                warningEl.style.color = (fps < 20 || avgUpdate > 100) ? '#ff4444' : '#ffaa44';
            } else {
                warningEl.style.display = 'none';
            }
        }

        setTimeout(() => this.updateDisplay(), 500);
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        if (this.monitorElement) {
            this.monitorElement.style.display = this.isEnabled ? 'block' : 'none';
        }
        if (!this.isEnabled) {
            this.metrics.update = [];
            this.metrics.draw = [];
        }
    }

    clearMetrics() {
        this.metrics.update = [];
        this.metrics.draw = [];
    }
}

// Create global instance
const perfTracker = new PerformanceTracker();

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    perfTracker.init();
});

// Add keyboard shortcut to toggle (Ctrl+Shift+P)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        perfTracker.toggle();
    }
});