document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('startup-form');
    form.addEventListener('submit', startGame);

    let timeoutInterval = 1000;
    let timeoutId = null;
    let currentTeamIndex = 0;

    // Create speed slider
    const speedSlider = document.getElementById('speed-slider');

    speedSlider.addEventListener('input', () => {
        timeoutInterval = parseInt(speedSlider.value);
    });

    function startGame(event) {
        event.preventDefault();

        const numTeams = Math.min(parseInt(document.getElementById('num-teams').value), 10);
        const gridWidth = parseInt(document.getElementById('grid-width').value);
        const gridLength = parseInt(document.getElementById('grid-length').value);
        const teamSize = parseInt(document.getElementById('team-size').value);
        const startTogether = document.getElementById('start-together').checked;

        document.querySelector('.startup-menu').style.display = 'none';
        const gameContainer = document.getElementById('game-container');
        const gameGrid = document.getElementById('game-grid');
        gameGrid.style.display = 'grid';
        gameGrid.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;
        gameGrid.style.gridTemplateRows = `repeat(${gridLength}, 1fr)`;
        gameGrid.innerHTML = '';

        for (let i = 0; i < gridWidth * gridLength; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            gameGrid.appendChild(cell);
        }

        const teamColors = [
            '#B22222', '#4682B4', '#32CD32', '#DAA520',
            '#FF8C00', '#8A2BE2', '#20B2AA', '#FF69B4',
            '#A9A9A9', '#696969'
        ];

        const teams = [];
        for (let i = 0; i < numTeams; i++) {
            teams.push({
                id: i,
                color: teamColors[i],
                cells: []
            });
        }

        const cellOwners = Array(gridWidth * gridLength).fill(null);
        let assignedCells = new Set();

        if (startTogether) {
            for (let i = 0; i < numTeams; i++) {
                let placed = 0;
                while (placed < teamSize) {
                    const startX = Math.floor(Math.random() * (gridWidth - 1));
                    const startY = Math.floor(Math.random() * (gridLength - 1));
                    const positions = getClusterPositions(startX, startY, gridWidth, gridLength, teamSize);

                    if (positions.every(([x, y]) => !assignedCells.has(y * gridWidth + x))) {
                        positions.forEach(([x, y]) => {
                            const cellIndex = y * gridWidth + x;
                            const cell = gameGrid.children[cellIndex];
                            cell.style.backgroundColor = teams[i].color;
                            teams[i].cells.push(cell);
                            assignedCells.add(cellIndex);
                            cellOwners[cellIndex] = teams[i].id;
                        });
                        placed = teamSize;
                    }
                }
            }
        } else {
            for (let i = 0; i < numTeams; i++) {
                for (let j = 0; j < teamSize; j++) {
                    let placed = false;
                    while (!placed) {
                        const randomCellIndex = Math.floor(Math.random() * (gridWidth * gridLength));
                        if (!assignedCells.has(randomCellIndex)) {
                            const cell = gameGrid.children[randomCellIndex];
                            cell.style.backgroundColor = teams[i].color;
                            teams[i].cells.push(cell);
                            assignedCells.add(randomCellIndex);
                            cellOwners[randomCellIndex] = teams[i].id;
                            placed = true;
                        }
                    }
                }
            }
        }

        const teamControlDisplay = document.getElementById('team-control-display');
        teamControlDisplay.innerHTML = '';

        simulate(teams, gameGrid, gridWidth, gridLength, cellOwners);
    }

    function getClusterPositions(startX, startY, gridWidth, gridLength, teamSize) {
        const positions = [[startX, startY]];
        while (positions.length < teamSize) {
            const [lastX, lastY] = positions[positions.length - 1];
            const potentialPositions = [
                [lastX + 1, lastY],
                [lastX - 1, lastY],
                [lastX, lastY + 1],
                [lastX, lastY - 1]
            ].filter(([x, y]) => 
                x >= 0 && x < gridWidth && y >= 0 && y < gridLength && 
                !positions.some(([px, py]) => px === x && py === y)
            );

            if (potentialPositions.length > 0) {
                const [newX, newY] = potentialPositions[Math.floor(Math.random() * potentialPositions.length)];
                positions.push([newX, newY]);
            } else {
                break;
            }
        }
        return positions;
    }

    function simulate(teams, gameGrid, gridWidth, gridLength, cellOwners) {
        function nextMove() {
            const team = teams[currentTeamIndex];
            const teamCells = team.cells;
            let moved = false;

            for (let i = 0; i < teamCells.length; i++) {
                const cell = teamCells[i];
                const cellIndex = Array.prototype.indexOf.call(gameGrid.children, cell);
                const [x, y] = [cellIndex % gridWidth, Math.floor(cellIndex / gridWidth)];

                const adjacentCells = [
                    [x + 1, y],
                    [x - 1, y],
                    [x, y + 1],
                    [x, y - 1]
                ].filter(([adjX, adjY]) => 
                    adjX >= 0 && adjX < gridWidth && adjY >= 0 && adjY < gridLength
                );

                const emptyCells = adjacentCells.filter(([adjX, adjY]) => {
                    const adjCellIndex = adjY * gridWidth + adjX;
                    return cellOwners[adjCellIndex] === null;
                });

                if (emptyCells.length > 0) {
                    const [adjX, adjY] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                    const adjCellIndex = adjY * gridWidth + adjX;
                    const adjCell = gameGrid.children[adjCellIndex];
                    adjCell.style.backgroundColor = team.color;
                    team.cells.push(adjCell);
                    cellOwners[adjCellIndex] = team.id;
                    moved = true;
                    break;
                }
            }

            if (!moved) {
                const adjacentEnemyCells = [];

                for (let i = 0; i < teamCells.length; i++) {
                    const cell = teamCells[i];
                    const cellIndex = Array.prototype.indexOf.call(gameGrid.children, cell);
                    const [x, y] = [cellIndex % gridWidth, Math.floor(cellIndex / gridWidth)];

                    const adjacentCells = [
                        [x + 1, y],
                        [x - 1, y],
                        [x, y + 1],
                        [x, y - 1]
                    ].filter(([adjX, adjY]) => 
                        adjX >= 0 && adjX < gridWidth && adjY >= 0 && adjY < gridLength
                    );

                    for (const [adjX, adjY] of adjacentCells) {
                        const adjCellIndex = adjY * gridWidth + adjX;
                        const adjCell = gameGrid.children[adjCellIndex];

                        if (cellOwners[adjCellIndex] !== null && cellOwners[adjCellIndex] !== team.id) {
                            adjacentEnemyCells.push(adjCell);
                        }
                    }
                }

                if (adjacentEnemyCells.length > 0) {
                    const adjCell = adjacentEnemyCells[Math.floor(Math.random() * adjacentEnemyCells.length)];
                    const adjCellIndex = Array.prototype.indexOf.call(gameGrid.children, adjCell);
                    const previousOwnerIndex = cellOwners[adjCellIndex];
                    const previousOwner = teams.find(t => t.id === previousOwnerIndex);

                    if (previousOwner) {
                        const attackingTeamSize = team.cells.length;
                        const defendingTeamSize = previousOwner.cells.length;
                        const totalCells = attackingTeamSize + defendingTeamSize;

                        const biasFactor = 1;
                        const attackingTeamBias = (attackingTeamSize / totalCells) * biasFactor;
                        const defendingTeamBias = (defendingTeamSize / totalCells) * biasFactor;

                        const attackSuccessChance = Math.random() < (0.5 * attackingTeamBias) / (attackingTeamBias + defendingTeamBias);

                        if (attackSuccessChance) {
                            adjCell.style.backgroundColor = team.color;
                            team.cells.push(adjCell);
                            cellOwners[adjCellIndex] = team.id;
                            previousOwner.cells = previousOwner.cells.filter(c => c !== adjCell);
                        }
                    }

                    moved = true;
                }
            }

            currentTeamIndex = (currentTeamIndex + 1) % teams.length;
            updateTeamControlDisplay(teams);

            timeoutId = setTimeout(nextMove, timeoutInterval);
        }

        nextMove();
    }

    function updateTeamControlDisplay(teams) {
        const teamControlDisplay = document.getElementById('team-control-display');
        teamControlDisplay.innerHTML = '';

        teams.forEach(team => {
            const controlElement = document.createElement('div');
            controlElement.classList.add('team-control');
            controlElement.style.backgroundColor = team.color;
            controlElement.textContent = `Team ${team.id + 1}: ${team.cells.length} cells`;
            teamControlDisplay.appendChild(controlElement);
        });
    }
});
