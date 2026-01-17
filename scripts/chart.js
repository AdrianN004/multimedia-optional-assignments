window.onload = function () {
    class ChartManager {
        constructor() {
            this.canvas = document.getElementById('chartCanvas');
            this.context = this.canvas.getContext('2d');
            this.width = this.canvas.width;
            this.height = this.canvas.height;

            this.config = {
                xIncrement: 150,
                yIncrement: 100,
                valueIncrement: 20,
                textOffset: 5,
                minVal: 0,
                maxVal: 600,
                speed: 1000,
                showGrid: true,
                smooth: false,
                type: 'line',
                isRunning: true
            };

            this.dataSeries = [
                { color: '#4CAF50', data: [] },
                { color: '#2196F3', data: [] },
                { color: '#FFC107', data: [] }
            ];
            this.intervalId = null;

            this.init();
        }

        init() {
            this.bindControls();
            this.generateInitialData();
            this.startAnimation();
            this.draw();
        }

        bindControls() {
            document.getElementById('startPauseBtn').onclick = () => this.toggleAnimation();
            document.getElementById('resetBtn').onclick = () => this.resetData();

            const speedRange = document.getElementById('speedRange');
            speedRange.oninput = (e) => {
                this.config.speed = parseInt(e.target.value);
                document.getElementById('speedValue').textContent = this.config.speed;
                if (this.config.isRunning) this.restartAnimation();
            };

            document.getElementById('minVal').onchange = (e) => this.config.minVal = parseInt(e.target.value);
            document.getElementById('maxVal').onchange = (e) => this.config.maxVal = parseInt(e.target.value);

            document.getElementById('gridToggle').onchange = (e) => {
                this.config.showGrid = e.target.checked;
                this.draw();
            };
            document.getElementById('smoothToggle').onchange = (e) => {
                this.config.smooth = e.target.checked;
                this.draw();
            };

            document.getElementById('chartType').onchange = (e) => {
                this.config.type = e.target.value;
                this.draw();
            };

            document.getElementById('themeSelect').onchange = (e) => {
                document.body.setAttribute('data-theme', e.target.value);
                this.draw();
            };

            document.getElementById('exportBtn').onclick = () => {
                const link = document.createElement('a');
                link.download = 'chart.png';
                link.href = this.canvas.toDataURL();
                link.click();
            };

            this.canvas.onmousemove = (e) => this.handleTooltip(e);
            this.canvas.onmouseout = () => document.getElementById('tooltip').style.display = 'none';
        }

        generateRandomNumber() {
            return Math.floor(Math.random() * (this.config.maxVal - this.config.minVal + 1)) + this.config.minVal;
        }

        generateInitialData() {
            const points = Math.ceil(this.width / this.config.valueIncrement) + 1;
            this.dataSeries.forEach(series => {
                series.data = Array(points).fill(0).map(() => this.generateRandomNumber());
            });
        }

        generateNewValues() {
            this.dataSeries.forEach(series => {
                series.data.push(this.generateRandomNumber());
                series.data.shift();
            });
            this.updateStats();
        }

        updateStats() {
            const currentData = this.dataSeries[0].data;
            const currentVal = currentData[currentData.length - 1];
            const min = Math.min(...currentData);
            const max = Math.max(...currentData);
            const avg = (currentData.reduce((a, b) => a + b, 0) / currentData.length).toFixed(1);

            const prevVal = currentData[currentData.length - 2];
            const trend = currentVal > prevVal ? '↑ Rising' : (currentVal < prevVal ? '↓ Falling' : '→ Stable');

            document.getElementById('statCurrent').textContent = currentVal;
            document.getElementById('statMin').textContent = min;
            document.getElementById('statMax').textContent = max;
            document.getElementById('statAvg').textContent = avg;
            document.getElementById('statTrend').textContent = trend;
        }

        toggleAnimation() {
            this.config.isRunning = !this.config.isRunning;
            document.getElementById('startPauseBtn').textContent = this.config.isRunning ? 'Pause' : 'Start';
            if (this.config.isRunning) this.startAnimation();
            else clearInterval(this.intervalId);
        }

        startAnimation() {
            if (this.intervalId) clearInterval(this.intervalId);
            this.intervalId = setInterval(() => {
                this.generateNewValues();
                this.draw();
            }, this.config.speed);
        }

        restartAnimation() {
            this.startAnimation();
        }

        resetData() {
            this.generateInitialData();
            this.draw();
            this.updateStats();
        }

        drawGrid() {
            if (!this.config.showGrid) return;

            this.context.strokeStyle = getComputedStyle(document.body).getPropertyValue('--border-color');
            this.context.lineWidth = 1;

            for (let i = 0; i < this.width; i += this.config.xIncrement) {
                this.context.beginPath();
                this.context.moveTo(i, 0);
                this.context.lineTo(i, this.height);
                this.context.stroke();
                this.context.strokeText(i, i + this.config.textOffset, this.height - this.config.textOffset);
            }

            for (let i = 0; i < this.height; i += this.config.yIncrement) {
                this.context.beginPath();
                this.context.moveTo(0, i);
                this.context.lineTo(this.width, i);
                this.context.stroke();
                this.context.strokeText(this.height - i, this.config.textOffset, i + 2 * this.config.textOffset);
            }
        }

        drawSeries(series) {
            this.context.strokeStyle = series.color;
            this.context.fillStyle = series.color;
            this.context.lineWidth = 3;

            const data = series.data;
            const step = this.config.valueIncrement;

            if (this.config.type === 'line' || this.config.type === 'area') {
                this.context.beginPath();

                if (this.config.smooth) {
                    this.context.moveTo(0, this.height - data[0]);
                    for (let i = 0; i < data.length - 1; i++) {
                        const x = i * step;
                        const y = this.height - data[i];
                        const nextX = (i + 1) * step;
                        const nextY = this.height - data[i + 1];
                        const cp1x = x + step / 2;
                        const cp1y = y;
                        const cp2x = nextX - step / 2;
                        const cp2y = nextY;
                        this.context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, nextX, nextY);
                    }
                } else {
                    this.context.moveTo(0, this.height - data[0]);
                    for (let i = 1; i < data.length; i++) {
                        this.context.lineTo(i * step, this.height - data[i]);
                    }
                }

                if (this.config.type === 'area') {
                    this.context.lineTo((data.length - 1) * step, this.height);
                    this.context.lineTo(0, this.height);
                    this.context.globalAlpha = 0.2;
                    this.context.fill();
                    this.context.globalAlpha = 1.0;
                } else {
                    this.context.stroke();
                }
            } else if (this.config.type === 'bar') {
                const barWidth = step - 5;
                for (let i = 0; i < data.length; i++) {
                    const h = data[i];
                    this.context.fillRect(i * step, this.height - h, barWidth, h);
                }
            } else if (this.config.type === 'scatter') {
                for (let i = 0; i < data.length; i++) {
                    this.context.beginPath();
                    this.context.arc(i * step, this.height - data[i], 4, 0, Math.PI * 2);
                    this.context.fill();
                }
            }
        }

        draw() {
            this.context.clearRect(0, 0, this.width, this.height);
            this.context.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');

            this.drawGrid();

            this.dataSeries.forEach(series => this.drawSeries(series));
        }

        handleTooltip(e) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const index = Math.round(x / this.config.valueIncrement);

            if (index >= 0 && index < this.dataSeries[0].data.length) {
                const tooltip = document.getElementById('tooltip');
                let content = `<strong>Time: ${index}</strong><br>`;

                this.dataSeries.forEach((series, i) => {
                    content += `<span style="color:${series.color}">Series ${i + 1}: ${series.data[index]}</span><br>`;
                });

                tooltip.innerHTML = content;
                tooltip.style.display = 'block';
                tooltip.style.left = (e.clientX + 10) + 'px';
                const chartArea = document.querySelector('.chart-area');
                const chartRect = chartArea.getBoundingClientRect();
                tooltip.style.left = (e.clientX - chartRect.left + 15) + 'px';
                tooltip.style.top = (e.clientY - chartRect.top + 15) + 'px';
            } else {
                document.getElementById('tooltip').style.display = 'none';
            }
        }
    }

    new ChartManager();
};