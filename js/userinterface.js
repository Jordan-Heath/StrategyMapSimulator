class UserInterface {
    constructor() {
        // general
        this.dateElements = {
            year: document.getElementById('year'),
            month: document.getElementById('month'),
            day: document.getElementById('day')
        }

        // move
        this.moveButton = document.getElementById('moveButton');

        // select
        this.selectedCountry = null;
        this.selectedCountryElement = document.getElementById('selectedCountry');
        this.selectedCountryElements = {
            name: document.getElementById('selectedCountryName'),
            score: document.getElementById('selectedCountryScore'),
            money: document.getElementById('selectedCountryMoney'),
            size: document.getElementById('selectedCountrySize'),
            attack: document.getElementById('selectedCountryAttack'),
            defense: document.getElementById('selectedCountryDefense'),
            growth: document.getElementById('selectedCountryGrowth'),
            development: document.getElementById('selectedCountryDevelopment'),
            governmentalStability: document.getElementById('selectedCountryGovernmentalStability')
        }

        // draw
        this.drawButton = document.getElementById('drawButton');
        this.drawButtonSetting = null;
        this.terrainMenu = document.getElementById('terrainMenu');
        this.terrainButton = {};

        // time controls
        this.playPauseButton = document.getElementById('playPauseButton');
        this.speedButtons = [
            document.getElementById('speedButton0'),
            document.getElementById('speedButton1'),
            document.getElementById('speedButton2'),
            document.getElementById('speedButton3'),
            document.getElementById('speedButton4')
        ]

        // scores
        this.scoresElement = document.getElementById('scores');

        // init
        this.attachEventListeners();
    }

    buildMenues() {
        terrainMenu.innerHTML = '';

        Terrains.forEach(terrain => {
            const button = document.createElement('button');
            button.classList.add('terrain-button');
            button.innerHTML = terrain.name;
            button.onclick = () => this.terrainButtonListener(terrain.name);
            terrainMenu.appendChild(button);
            this.terrainButton[terrain.name] = button;
        });
    }

    draw() {
        // draw selected country
        if (this.selectedCountry) {
            this.selectedCountryElement.style.display = 'block';
            this.selectedCountryElements.name.innerHTML = `${this.selectedCountry?.name}` ?? 'None';
            this.selectedCountryElements.name.style.backgroundColor = this.selectedCountry?.color;
            this.selectedCountryElements.name.style.color = this.selectedCountry?.textColor;
            this.selectedCountryElements.score.innerHTML = this.selectedCountry?.score.toFixed(2) ?? 0;
            this.selectedCountryElements.money.innerHTML = '$' + (this.selectedCountry?.money ?? 0).toFixed(2);
            this.selectedCountryElements.size.innerHTML = this.selectedCountry?.size ?? 0;
            this.selectedCountryElements.attack.innerHTML = (this.selectedCountry?.attackChance * 100).toFixed(2) + '%';
            this.selectedCountryElements.defense.innerHTML = (this.selectedCountry?.defenseChance * 100).toFixed(2) + '%';
            this.selectedCountryElements.growth.innerHTML = (this.selectedCountry?.growthChance * 100).toFixed(2) + '%';
            this.selectedCountryElements.development.innerHTML = (this.selectedCountry?.developChance * 100).toFixed(2) + '%';
            this.selectedCountryElements.governmentalStability.innerHTML = (this.selectedCountry?.governmentalStability * 100).toFixed(2) + '%';
        } else {
            this.selectedCountryElement.style.display = 'none';
        }

        // draw date
        let suffix = DaySuffixes[game.date.day] ?? 'th';
        this.dateElements.day.innerHTML = game.date.day.toString() + suffix + ' of';
        this.dateElements.month.innerHTML = Months[game.date.month];
        this.dateElements.year.innerHTML = game.date.year.toString().padStart(4, '0');

        // draw scores
        this.scoresElement.innerHTML = '';

        let countries = game.countries.sort((a, b) => b.score - a.score);

        countries.forEach(country => {
            const scoreElement = document.createElement('div');
            scoreElement.classList.add('score-element');
            scoreElement.innerHTML = `${country.name}: ${country.score.toFixed(2)}`;
            scoreElement.style.backgroundColor = country.color;
            scoreElement.style.color = country.textColor;
            if (country.size == 0) scoreElement.style.textDecoration = 'line-through';
            this.scoresElement.appendChild(scoreElement);
        });
    }

    attachEventListeners() {
        document.querySelectorAll('.control-button').forEach(button => button.classList.remove('active'));
        this.moveButton.classList.add('active');

        this.moveButton.addEventListener('click', e => this.moveButtonListener(e));
        this.drawButton.addEventListener('click', e => this.drawButtonListener(e));

        this.playPauseButton.addEventListener('click', () => game.playPause());
        this.speedButtons.forEach((button, index) => button.addEventListener('click', () => game.changeSpeed(index)));
    }

    terrainButtonListener(terrainType) {
        //highlight the button
        document.querySelectorAll('.terrain-button').forEach(button => button.classList.remove('active'));
        this.terrainButton[terrainType].classList.add('active');

        //store the setting
        this.drawButtonSetting = Terrains.find(terrain => terrain.name.toLowerCase() === terrainType.toLowerCase());
    }

    moveButtonListener(e) {
        document.querySelectorAll('.control-button').forEach(button => button.classList.remove('active'));
        this.moveButton.classList.add('active');

        this.terrainMenu.classList.add('hidden');

        game.eventListeners.mouseDownListener = (e) => game.tileMap.startDraggingMap(e);
        game.eventListeners.mouseMoveListener = (e) => game.tileMap.draggingMap(e);
        game.eventListeners.mouseUpListener = (e) => game.tileMap.stopDraggingMap(e);
    }

    selectButtonListener(e) {
        document.querySelectorAll('.control-button').forEach(button => button.classList.remove('active'));
        this.selectButton.classList.add('active');

        this.terrainMenu.classList.add('hidden');

        game.eventListeners.mouseDownListener = (e) => game.tileMap.selectCountry(e);
    }

    drawButtonListener(e) {
        this.buildMenues();

        document.querySelectorAll('.control-button').forEach(button => button.classList.remove('active'));
        this.drawButton.classList.add('active');

        this.terrainMenu.classList.remove('hidden');

        game.eventListeners.mouseDownListener = (e) => game.tileMap.startDrawingOnMap(e);
        game.eventListeners.mouseMoveListener = (e) => game.tileMap.drawingOnMap(e);
        game.eventListeners.mouseUpListener = (e) => game.tileMap.stopDrawingOnMap();
    }
}