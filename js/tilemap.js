class TileMap {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.tileSizeBase = 10;
        this.tileSize = this.tileSizeBase;
        this.mapWidth = 128; // in tiles
        this.mapHeight = 64; // in tiles

        this.offsetX = 0; // current X offset of the map
        this.offsetY = 0; // current Y offset of the map

        this.clickStartX = 0;
        this.clickStartY = 0;

        this.secondClickStartX = 0;
        this.secondClickStartY = 0;

        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;

        this.isDrawing = false;
        this.drawStartX = 0;
        this.drawStartY = 0;

        this.mapData = [];

        this.mapSpawnSettings = {
            numberOfAgings: 5,
            countryFrequency: 25,
            ruinFrequency: 25
        }

        this.init();
    }

    generateRandomMap(stage = 1, subStage = 1) {
        const countries = game.countries;

        if (stage === 1) {
            const elevationBiasMinimum = -3;
            const elevationBiasVariance = 5;

            for (let y = 0; y < this.mapHeight; y++) {
                const yRatio = y / this.mapHeight;
                const elevationBias = -(4 * elevationBiasVariance) * yRatio * yRatio + (4 * elevationBiasVariance) * yRatio + elevationBiasMinimum;
                
                this.mapData[y] = Array.from({ length: this.mapWidth }, (_, x) => new Tile(x, y, elevationBias));
            }

            console.log("Stage 1 Complete: Map generated");
            setTimeout(() => this.generateRandomMap(2), game.tickRate);
            return;
        }

        if (stage === 2) {
            if (subStage < this.mapSpawnSettings.numberOfAgings) {
                this.mapData.flat().forEach(tile => tile.evolveLand());
                game.date.year += 50000;
                subStage++;
                setTimeout(() => this.generateRandomMap(2, subStage), game.tickRate);
            } else {
                console.log("Stage 2 Complete: Map flattened");
                setTimeout(() => this.generateRandomMap(3), game.tickRate);
                return;
            }
        }

        if (stage === 3) {
            const emptyCountry = new Country('', '');
            let availableTiles = this.mapData.flat().filter(t => t.canByTakenBy(emptyCountry) && t.isUnclaimed());
            let index = 0;

            while (availableTiles.length > 0) {
                const country = new Country(CountryNames[index % CountryNames.length], Colors[index % Colors.length]);
                game.countries.push(country);
                const randomTile = availableTiles[Math.floor(Math.random() * availableTiles.length)];
                country.capitalTile = randomTile;
                country.gainTile(randomTile);

                index++;
                availableTiles = availableTiles.filter(t => country.distanceToCapital(t) > this.mapSpawnSettings.countryFrequency);
            }

            console.log("Stage 3 Complete: Countries spawned");
            game.userInterface.selectedCountry = countries[0];
            setTimeout(() => this.generateRandomMap(4), game.tickRate);
            return;
        }

        if (stage === 4) {
            const emptyCountry = new Country('', '');
            let availableTiles = this.mapData.flat().filter(t => t.canByTakenBy(emptyCountry) && t.isUnclaimed());

            while (availableTiles.length > 0) {
                const randomTile = availableTiles[Math.floor(Math.random() * availableTiles.length)];
                randomTile.buildings.push('ruins0');
                randomTile.development = 2;
                availableTiles = availableTiles.filter(t => t.distanceToTile(randomTile) > this.mapSpawnSettings.ruinFrequency);
            }

            console.log("Stage 4 Complete: Ruins spawned");
        }
    }

    drawMap() {
        // Clear the entire canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate the visible range of columns and rows based on current offset and tile size
        const startCol = Math.floor(this.offsetX / this.tileSize);
        const startRow = Math.floor(this.offsetY / this.tileSize);
        const endCol = startCol + Math.ceil(this.canvas.width / this.tileSize) + 1;
        const endRow = startRow + Math.ceil(this.canvas.height / this.tileSize) + 1;

        // Loop through each tile in the visible range
        for (let mapY = startRow; mapY < endRow; mapY++) {
            for (let mapX = startCol; mapX < endCol; mapX++) {
                // Adjust x for wrapping horizontally across the map
                let rolloverX = mapX % this.mapWidth;
                if (rolloverX < 0) rolloverX += this.mapWidth;

                // Retrieve the tile at the current position
                const tile = this.mapData[mapY]?.[rolloverX];

                // Draw the tile if it exists
                tile?.draw(
                    mapX * this.tileSize - this.offsetX, 
                    mapY * this.tileSize - this.offsetY, 
                    this.tileSize
                );
            }
        }
    }

    init() {
        this.generateRandomMap();

        game.eventListeners.mouseDownListener = (e) => this.startDraggingMap(e);
        game.eventListeners.mouseMoveListener = (e) => this.draggingMap(e);
        game.eventListeners.mouseUpListener = (e) => this.stopDraggingMap(e);
        game.eventListeners.mouseLeaveListener = (e) => this.stopDraggingMap(e);
        game.eventListeners.wheelListener = (e) => this.zoomMap(e);
        game.eventListeners.pinchListener = (e) => this.zoomMapViaPinch(e);
        game.eventListeners.resizeListener = (e) => this.onResize(e);

        // adjust the position of the camera to center the map
        this.offsetY = (this.mapHeight * this.tileSize - this.canvas.height) / 2;
    }

    startDraggingMap(e) {
        const mouseX = e.clientX || e.touches[0].clientX;
        const mouseY = e.clientY || e.touches[0].clientY;

        this.isDragging = true;
        this.dragStartX = mouseX;
        this.dragStartY = mouseY;

        this.clickStartX = mouseX;
        this.clickStartY = mouseY;
    }

    draggingMap(e) {
        if (this.isDragging) {
            const mouseX = e.clientX === undefined ? e.changedTouches[0].clientX : e.clientX;
            const mouseY = e.clientY === undefined ? e.changedTouches[0].clientY : e.clientY;

            this.offsetX -= mouseX - this.dragStartX;
            this.offsetY -= mouseY - this.dragStartY;

            this.dragStartX = mouseX;
            this.dragStartY = mouseY;

            this.drawMap();
        }
    }

    stopDraggingMap(e) {
        this.isDragging = false;
        this.secondClickDistance = undefined;

        const mouseX = e.clientX === undefined ? e.changedTouches[0].clientX : e.clientX;
        const mouseY = e.clientY === undefined ? e.changedTouches[0].clientY : e.clientY;

        if (mouseX === this.clickStartX && mouseY === this.clickStartY) {
            this.selectCountry(e);
        }
    }

    selectCountry(e) {
        const mouseX = e.clientX === undefined ? e.changedTouches[0].clientX : e.clientX;
        const mouseY = e.clientY === undefined ? e.changedTouches[0].clientY : e.clientY;
        let mapX = Math.floor((mouseX + this.offsetX) / this.tileSize);
        let mapY = Math.floor((mouseY + this.offsetY) / this.tileSize);

        //rollover x
        mapX = mapX % this.mapWidth;
        if (mapX < 0) mapX += this.mapWidth;

        const country = this.mapData[mapY]?.[mapX]?.country;
        game.userInterface.selectedCountry = country ?? null;
    }

    startDrawingOnMap(e) {
        this.isDrawing = true;
        this.drawingOnMap(e);
    }

    drawingOnMap(e) {
        if (this.isDrawing) {
            const mouseX = e.clientX === undefined ? e.touches[0].clientX : e.clientX;
            const mouseY = e.clientY === undefined ? e.touches[0].clientY : e.clientY;
            let mapX = Math.floor((mouseX + this.offsetX) / this.tileSize);
            let mapY = Math.floor((mouseY + this.offsetY) / this.tileSize);

            //rollover x
            mapX = mapX % this.mapWidth;
            if (mapX < 0) mapX += this.mapWidth;

            const tile = this.mapData[mapY]?.[mapX];
            if (tile) {
                tile.paintTerrain(game.userInterface.drawButtonSetting);
                game.countries.forEach(country => country.refresh());
            }
        }
    }

    stopDrawingOnMap(e) {
        this.isDrawing = false;
    }

    zoomMap(e) {
        e.preventDefault();

        const zoomFactor = 1.1;
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const mapX = (mouseX + this.offsetX) / this.tileSize;
        const mapY = (mouseY + this.offsetY) / this.tileSize;

        const minTileSize = 10;
        const maxTileSize = 100;

        const isZoomingIn = e.deltaY > 0 && this.tileSize > minTileSize;
        const isZoomingOut = e.deltaY < 0 && this.tileSize < maxTileSize;

        if (isZoomingIn || isZoomingOut) {
            this.tileSize = Math.max(minTileSize, Math.min(maxTileSize, this.tileSize * (isZoomingIn ? 1 / zoomFactor : zoomFactor)));
            this.offsetX = mapX * this.tileSize - mouseX;
            this.offsetY = mapY * this.tileSize - mouseY;
        }
    }

    zoomMapViaPinch(e) {
        e.preventDefault();

        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const distance = Math.sqrt((e.touches[0].clientX - e.touches[1].clientX) * (e.touches[0].clientX - e.touches[1].clientX) + (e.touches[0].clientY - e.touches[1].clientY) * (e.touches[0].clientY - e.touches[1].clientY));
        if (!this.secondClickDistance) this.secondClickDistance = distance;
        const zoomFactor = distance / this.secondClickDistance;

        const mapX = (centerX + this.offsetX) / this.tileSize;
        const mapY = (centerY + this.offsetY) / this.tileSize;

        const minTileSize = 10;
        const maxTileSize = 100;

        const isZoomingIn = zoomFactor > 1 && this.tileSize >= minTileSize;
        const isZoomingOut = zoomFactor < 1 && this.tileSize <= maxTileSize;

        if (isZoomingIn || isZoomingOut) {
            this.tileSize = Math.max(minTileSize, Math.min(maxTileSize, this.tileSize * zoomFactor));
            this.offsetX = mapX * this.tileSize - centerX;
            this.offsetY = mapY * this.tileSize - centerY;
        }

        this.secondClickDistance = distance;
    }

    onResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}
