class Tile {
    constructor(x, y, elevationBias) {
        this.x = x;
        this.y = y;
        this.country = null;
        this.neighbours = [];

        this.prosperity = 0;
        this.development = 0.1;
        this.buildings = [];

        const randomOffset = Math.random() * 20 - 10;
        this.elevation = Math.max(0, Math.min(elevationBias + randomOffset, 5));

        this.terrain = Terrains[Math.round(this.elevation)];
    }

    paintTerrain(terrain, elevation = terrain.elevation) {
        if (terrain) {
            this.elevation = elevation;
            this.terrain = terrain;
            this.buildings = [];
            this.development = 0.1;
            this.hasChanged = true;
            this.calculateProsperity();
            if (!this.terrain.accessible) this.country?.loseTile(this);
        }
    }

    draw(x, y, size) {
        const { ctx } = game.tileMap;
        
        // Draw terrain
        if (size >= 20) {
            ctx.drawImage(document.getElementById(this.terrain.name.toLowerCase()), x, y, size, size);
        } else {
            ctx.fillStyle = this.terrain.color;
            ctx.fillRect(x, y, size, size);
        }

        if (this.country) {
            ctx.fillStyle = this.country.color;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(x, y, size, size);
            ctx.globalAlpha = 1;
        }

        const imageId = [
            "capital",
            "ruins2",
            "ruins1",
            "ruins0",
            "developed3",
            "developed2",
            "developed1",
            "developed0",
            "dock",
        ].find((id) => this.country?.capitalTile === this || this.buildings.includes(id));

        if (imageId && (size >= 20 || ["capital", "ruins2", "ruins1", "ruins0"].includes(imageId))) {
            ctx.drawImage(document.getElementById(imageId), x, y, size, size);
        }
    }

    getNeighbours(tileMap = game.tileMap) {
        const { mapData, mapWidth, mapHeight } = tileMap;
        const { x, y } = this;
        const neighbours = this.neighbours;

        if (neighbours.length > 0) return neighbours;

        // top
        if (y > 0) neighbours.push(mapData[y - 1][x]);
        // bottom
        if (y < mapHeight - 1) neighbours.push(mapData[y + 1][x]);
        // left
        neighbours.push(mapData[y][(x - 1 + mapWidth) % mapWidth]);
        // right
        neighbours.push(mapData[y][(x + 1) % mapWidth]);

        return neighbours;
    }

    belongsTo(country) {
        return this.country?.name === country.name;
    }

    isUnclaimed() {
        return this.country === null;
    }

    isAccessible() {
        return this.terrain.accessible;
    }

    evolveLand() {
        this.elevation += Math.random() * 0.2 - 0.1;
        this.elevation = this.getNeighbours().reduce((acc, neighbour) => acc + neighbour.elevation, this.elevation) / (this.getNeighbours().length + 1);
        if (this.elevation < 2) this.elevation *= 0.95;
        if (this.elevation > 2) this.elevation *= 1.05;

        this.paintTerrain(Terrains[Math.round(this.elevation)], this.elevation);
    }

    canByTakenBy(country) {
        if (!this.isAccessible()) return false;
        if (this.belongsTo(country)) return false;

        return true;
    }

    develop() {
        this.development += 0.05;

        if (this.buildings.includes("ruins0")) {
            if (this.development >= 4 && !this.buildings.includes("ruins2")) this.buildings.push("ruins2");
            if (this.development > 3 && !this.buildings.includes("ruins1")) this.buildings.push("ruins1");

        } else {
            if (this.development > 4 && !this.buildings.includes("developed3")) this.buildings.push("developed3");
            if (this.development > 3 && !this.buildings.includes("developed2")) this.buildings.push("developed2");
            if (this.development > 2 && !this.buildings.includes("developed1")) this.buildings.push("developed1");
            if (this.development > 1 && !this.buildings.includes("developed0")) this.buildings.push("developed0");
        }

        this.hasChanged = true;
        this.calculateProsperity();
    }

    calculateProsperity(country = this.country) {
        if (country) {
            const distanceToCapital = country.distanceToCapital(this);
            const neighbouringTilesOwned = [...this.getNeighbours()].filter(tile => tile.country === country).length;
            this.prosperity = (this.terrain.prosperity * this.development)/5 - distanceToCapital/25 + neighbouringTilesOwned/100;
        } else {
            this.prosperity = this.terrain.prosperity * this.development;
        }

        if (this.buildings.includes("ruins0")) this.prosperity *= 50;

        return this.prosperity;
    }

    distanceToTile(tile) {
        const xDistance = Math.min(Math.abs(this.x - tile.x), game.tileMap.mapWidth - Math.abs(this.x - tile.x));
        const yDistance = Math.abs(this.y - tile.y);
        const diagonalDistance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
        return Math.min(diagonalDistance, xDistance + yDistance);
    }
}