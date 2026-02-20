class Country {
    constructor(name, color) {
        // Country name and color
        this.name = name;
        this.color = color;
        this.textColor = findContrastingTextColor(color);

        // Country size is the number of tiles it controls
        this.size = 1;

        // Money is the amount of resources the country has
        this.money = 0;

        // Score is the prosperity of the country's controlled tiles
        this.score = 0;

        // Stats are the governmental stability, growth chance, attack chance, defense chance and development chance
        this.growthChance = Math.random()/2 + 0.05;
        this.attackChance = Math.random()/2 + 0.05;
        this.defenseChance = Math.random()/2 + 0.05;
        this.developChance = Math.random()/2 + 0.05;
        this.governmentalStability = 1 - Math.random() / 20;

        // Capital tile is the tile that is the capital of the country
        this.capitalTile = null;

        // Tiles is a set of tiles controlled by the country
        this.tiles = new Set();

        // Neighbouring tiles is a set of tiles that are not controlled by the country but are adjacent to the country's tiles
        this.neighbouringTiles = new Set();
    }

    updateTiles(tileMap = game.tileMap) {
        // Only update the country's tiles if it has changed
        this.tiles.clear();
        for (let tile of tileMap.mapData.flat()) {
            if (tile.belongsTo(this)) {
                this.tiles.add(tile);
            }
        }
    }

    updateNeighbouringTiles(tileMap = game.tileMap) {
        // Create a set of all tiles that border at least one of the country's tiles
        const borderingTiles = new Set();
        for (let tile of this.tiles) {
            for (let neighbour of tile.getNeighbours(tileMap)) {
                borderingTiles.add(neighbour);
            }
        }

        // Filter out tiles that are already owned by the country
        this.neighbouringTiles = new Set([...borderingTiles].filter(tile => !this.tiles.has(tile)));
    }

    refresh() {
        // Update the country's tiles and neighbouring tiles
        this.updateTiles();
        this.updateNeighbouringTiles();
    }

    update() {
        // Update the country's money
        if (this.tiles.size === 0) return;
        if (this.capitalTile.country !== this) this.shrink();

        this.getTaxes();
        this.governmentalChange();

        // Check if country can develop, then develop
        this.develop();
        
        // Choose an action
        if (this.attack());
        else if (this.expand());
        else if (this.reclaimLand());

        // Update country size and score
        this.size = this.tiles.size;
        this.calculateScore();
    }

    attack() {
        // Cost of attacking is proportional to country size
        const attackCost = 2 * this.size;

        // Get all foreign tiles adjacent to the country
        const attackableTiles = [...this.neighbouringTiles].filter(({ country }) => country !== null);

        // Check if there are any attackable tiles and if the country has enough money
        const canAttack = attackableTiles.length > 0 && this.money >= attackCost;

        if (canAttack && this.attackChance > Math.random()) {
            // Choose the tile closest to the country's capital
            attackableTiles.sort((a, b) => this.distanceToCapital(a) - this.distanceToCapital(b));
            const selectedTile = attackableTiles[0];

            // subtract the defense cost for the defending country
            const defenseCost = selectedTile.country.size;
            let defenseBonus = 0;
            if (selectedTile.country.money > defenseCost) {
                selectedTile.country.money -= defenseCost;
                defenseBonus = selectedTile.country.defenseChance;
            }

            // If the country's defense is low enough, the attack is successful
            if (defenseBonus + selectedTile.development / 8 < Math.random()) {
                // Take the tile from the attacked country
                selectedTile.country.loseTile(selectedTile);
                this.gainTile(selectedTile);

                // Subtract the cost of attacking from the country's money
                this.money -= attackCost;
                return true;
            }
        }

        return false;
    }

    develop() {
        const developCost = 0;

        // Get all accessible tiles in the country that can still be developed
        const developableTiles = [...this.tiles].filter(tile => tile.isAccessible() && tile.development < 4);

        // Check if there are any tiles that can be developed and if the country has enough money
        const canDevelop = developableTiles.length > 0 && this.money >= developCost;

        // If so, develop the most prosperous developable tile
        if (canDevelop && this.developChance > Math.random()) {
            const tileToDevelop = developableTiles.reduce((mostProsperousTile, currentTile) =>
                currentTile.prosperity > mostProsperousTile.prosperity ? currentTile : mostProsperousTile, developableTiles[0]);
            // Have the tile develop
            tileToDevelop.develop();
        }
    }

    expand() {
        const expansionCost = 4*this.size;

        // Get all unclaimed, accessible tiles that border the country
        const unclaimedTiles = [...this.neighbouringTiles].filter(tile => tile !== null && tile.isAccessible() && tile.country === null);
        const canExpand = unclaimedTiles.length > 0 && this.money >= expansionCost;

        // Expand the country by taking over the most prosperous unclaimed tile
        if (canExpand && this.growthChance > Math.random()) {
            const maxProsperity = Math.max(...unclaimedTiles.map(tile => tile.calculateProsperity(this)));
            const bestTile = unclaimedTiles.find(tile => tile.calculateProsperity(this) === maxProsperity);

            if (bestTile !== null) {
                this.gainTile(bestTile);
                this.money -= expansionCost;
                return true;
            }
        }

        return false;
    }

    reclaimLand() {
        const reclaimCost = 8*this.size;

        // Can't expand if there are no unclaimed tiles left adjacent to the country
        const canExpand = [...this.neighbouringTiles].filter(tile => tile.isAccessible() && tile.country === null).length > 0;
        // If there are no adjacent tiles to expand into and no adjacent foreign tiles to attack, the country can reclaim land
        const canReclaimLand = !canExpand && this.money >= reclaimCost;

        if (canReclaimLand) {
            // Reclaim the neighbouring tile closest to the country's capital
            const tileToReclaim = [...this.neighbouringTiles].sort((a, b) => this.distanceToCapital(a) - this.distanceToCapital(b))[0];
            if (tileToReclaim) {
                // build a dock on the reclaimed land
                tileToReclaim.buildings.push('dock');
                tileToReclaim.development = 2;
                // Add the reclaimed tile to the country's tiles
                this.gainTile(tileToReclaim);
                // Subtract the cost of reclaiming land from the country's money
                this.money -= reclaimCost;
            }
        }
    }

    shrink() {
        // Check if the country's defense chance is lower than a random value
        if (Math.random() > this.defenseChance) {
            // Find the tile with the lowest prosperity to remove
            const tileToShrink = [...this.tiles].sort((a, b) => b.calculateProsperity(this) - a.calculateProsperity(this))[0];
            // Remove the identified tile from the country
            this.loseTile(tileToShrink);
        }
    }

    governmentalChange() {
        // Change the country's stats based on governmental stability
        if (Math.random() > this.governmentalStability) {
            // Change the country's growth, attack, defense, and develop chances
            const changeAmount = () => Math.random() / 10 - 0.05;
            this.growthChance = Math.min(1, Math.max(0.05, this.growthChance + changeAmount()));
            this.attackChance = Math.min(1, Math.max(0.05, this.attackChance + changeAmount()));
            this.defenseChance = Math.min(0.5, Math.max(0.05, this.defenseChance + changeAmount()));
            this.developChance = Math.min(1, Math.max(0.05, this.developChance + changeAmount()));
        }

        // Change the country's governmental stability
        const changeAmount = () => Math.random() / 1000 - 0.0005;
        this.governmentalStability = Math.min(1, Math.max(0, this.governmentalStability + changeAmount()));
    }

    gainTile(tile) {
        // Add the tile to the country's tiles
        tile.country = this;
        tile.calculateProsperity();
        this.neighbouringTiles.delete(tile);
        this.tiles.add(tile);
        for (let neighbour of tile.getNeighbours()) {
            if (!neighbour.belongsTo(this)) {
                this.neighbouringTiles.add(neighbour);
            }
        }
    }

    loseTile(tile) {
        // Remove the tile from the country's tiles
        tile.country = null;
        tile.calculateProsperity();
        this.tiles.delete(tile);
        this.refresh();
    }

    getTaxes() {
        // Calculate the taxes from the country's tiles
        this.money += [...this.tiles].reduce((total, tile) => total + tile.prosperity, 0);
    }

    distanceToCapital(tile) {
        // Calculate the distance between a tile and the capital tile
        if (this.capitalTile === null) return 0;
        return this.capitalTile.distanceToTile(tile) + 1;
    }

    calculateScore() {
        // Calculate the country's score
        this.score = Math.max(this.score, [...this.tiles].reduce((total, tile) => total + tile.prosperity, 0));
    }
}
