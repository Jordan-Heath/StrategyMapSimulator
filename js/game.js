class Game {
    constructor() {
        this.eventListeners = {};
        this.tickRates = [
            500,
            200,
            100,
            50,
            10
        ];
        this.tickRate = this.tickRates[1];
        this.countries = [];
        this.date = {
            day: 1,
            month: 0,
            year: -200000
        }

        this.framerate = 60;
        this.framerateInterval = 1000 / this.framerate;
        this.msPrevious = 0;

        this.userInterface = new UserInterface();
    }

    attachEventListeners() {
        // mouse
        this.tileMap.canvas.addEventListener('mousedown', e => this.eventListeners.mouseDownListener(e));
        this.tileMap.canvas.addEventListener('mousemove', e => this.eventListeners.mouseMoveListener(e));
        this.tileMap.canvas.addEventListener('mouseup', e => this.eventListeners.mouseUpListener(e));
        this.tileMap.canvas.addEventListener('mouseleave', e => this.eventListeners.mouseLeaveListener(e));
        this.tileMap.canvas.addEventListener('wheel', e => this.eventListeners.wheelListener(e));

        // touch
        this.tileMap.canvas.addEventListener('touchstart', e => { this.eventListeners.mouseDownListener(e) });
        this.tileMap.canvas.addEventListener('touchmove', e => {
            if (e.touches.length == 1) {
                this.eventListeners.mouseMoveListener(e)
            } else if (e.touches.length > 1) {
                this.eventListeners.pinchListener(e);
            }
        });
        this.tileMap.canvas.addEventListener('touchend', e => this.eventListeners.mouseUpListener(e));

        //resize
        window.addEventListener('resize', e => this.eventListeners.resizeListener(e));

        // key
        document.addEventListener('keydown', e => {
            switch (e.key) {
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    this.changeSpeed(parseInt(e.key) - 1);
                    break;
                case ' ':
                    this.playPause();
                    break;
            }
        });
    }

    init() {
        this.tileMap = new TileMap('mapCanvas');
        this.updateInterval = setInterval(() => this.updateLoop(), this.tickRate);
        this.drawLoop();
        this.attachEventListeners();
        this.changeSpeed(1);
    }

    updateLoop() {
        if (this.countries.length > 0) {
            this.update();
        }
    }

    drawLoop() {
        const msNow = window.performance.now();
        if (msNow - this.msPrevious < this.framerateInterval) {
            requestAnimationFrame(() => this.drawLoop());
            return;
        }
        this.msPrevious = msNow;

        if (this.tileMap) {
            this.draw();
        }

        requestAnimationFrame(() => this.drawLoop());
    }

    update() {
        this.countries.forEach(country => country.update());
        this.updateDate();
    }
    
    draw() {
        this.tileMap.drawMap();
        this.userInterface.draw();
    }

    playPause() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        } else {
            this.updateInterval = setInterval(() => this.updateLoop(), this.tickRate);
        }

        this.userInterface.playPauseButton.innerHTML = this.updateInterval ? '⏸︎' : '▶';
    }
    
    changeSpeed(speed) {
        this.tickRate = this.tickRates[speed];
        clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => this.updateLoop(), this.tickRate);

        this.userInterface.playPauseButton.innerHTML = this.updateInterval ? '⏸︎' : '▶';

        for (const button of this.userInterface.speedButtons) {
            button.classList.remove('active');
        }

        for (let i = 0; i <= speed; i++) {
            this.userInterface.speedButtons[i].classList.add('active');
        }

        console.log(`${1000 / this.tickRate} ticks every second`);
    }

    updateDate() {
        this.date.day += 1;
        const daysPerMonth = (this.date.year % 4 == 0) ? DaysPerMonthLeapYear : DaysPerMonth;
        if (this.date.day > daysPerMonth[this.date.month]) {
            this.date.day = 1;
            this.date.month += 1;
            if (this.date.month > 11) {
                this.date.month = 1;
                this.date.year += 1;
            }
        }
    }
}

const game = new Game();
game.init();