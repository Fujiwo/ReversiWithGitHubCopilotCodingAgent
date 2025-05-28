/**
 * Reversi Game Implementation
 * 
 * This file contains the core game logic and AI implementation for the Reversi game.
 */

// Game constants
const BOARD_SIZE = 8;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// Direction vectors for checking valid moves (diagonal, horizontal, vertical)
const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

// Game state variables
const gameState = {
    board: [],
    currentPlayer: BLACK, // Black always starts
    isGameOver: false,
    playerDisc: BLACK,
    computerDisc: WHITE,
    isComputerThinking: false,
    moveHistory: [],
    moveCounter: 0,
    lastMove: null
};

// DOM elements - using const for elements that won't be reassigned
const DOM = {
    gameBoard: document.getElementById('game-board'),
    statusMessage: document.getElementById('status-message'),
    blackScore: document.getElementById('black-score'),
    whiteScore: document.getElementById('white-score'),
    difficultySelector: document.getElementById('difficulty'),
    restartButton: document.getElementById('restart-button'),
    undoButton: document.getElementById('undo-button'),
    helpButton: document.getElementById('help-button'),
    helpSection: document.getElementById('help-section'),
    moveCounter: document.getElementById('move-counter'),
    boardCoverage: document.getElementById('board-coverage')
};

// Event listeners
document.addEventListener('DOMContentLoaded', initGame);
DOM.restartButton.addEventListener('click', restartGame);
DOM.undoButton.addEventListener('click', undoLastMove);
DOM.helpButton.addEventListener('click', toggleHelp);
DOM.difficultySelector.addEventListener('change', () => {
    const { currentPlayer, computerDisc, isGameOver } = gameState;
    if (currentPlayer === computerDisc && !isGameOver) {
        makeComputerMove();
    }
});

// Add keyboard navigation support
document.addEventListener('keydown', handleKeyboardInput);

/**
 * Initialize the game
 */
function initGame() {
    createGameBoard();
    
    // Try to load saved state, otherwise initialize new game
    if (!loadGameState()) {
        initializeBoard();
    }
    
    renderBoard();
    updateScores();
    updateMoveCounter();
    updateUndoButton();
}

/**
 * Create the game board in the DOM
 */
function createGameBoard() {
    DOM.gameBoard.innerHTML = '';
    
    // Using template literals for more readable element creation
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.tabIndex = 0;
            cell.setAttribute('aria-label', `Cell ${row + 1}, ${col + 1}`);
            
            // Use arrow function to maintain context
            cell.addEventListener('click', () => handleCellClick(row, col));
            DOM.gameBoard.appendChild(cell);
        }
    }
}

/**
 * Initialize the board with starting positions
 */
function initializeBoard() {
    // Create empty board using Array.from for more modern approach
    gameState.board = Array.from({ length: BOARD_SIZE }, 
        () => Array(BOARD_SIZE).fill(EMPTY));
    
    // Set up starting positions
    const mid = BOARD_SIZE / 2;
    gameState.board[mid - 1][mid - 1] = WHITE;
    gameState.board[mid - 1][mid] = BLACK;
    gameState.board[mid][mid - 1] = BLACK;
    gameState.board[mid][mid] = WHITE;
    
    // Reset game state
    gameState.currentPlayer = BLACK;
    gameState.isGameOver = false;
    gameState.playerDisc = BLACK;
    gameState.computerDisc = WHITE;
    gameState.isComputerThinking = false;
    gameState.moveHistory = [];
    gameState.moveCounter = 0;
    gameState.lastMove = null;
    
    // Update UI
    updateStatusMessage();
    updateMoveCounter();
    updateUndoButton();
    saveGameState();
}

/**
 * Render the current state of the board
 */
function renderBoard() {
    const cells = document.querySelectorAll('.cell');
    
    // Clear valid move indicators and last move indicators
    cells.forEach(cell => {
        cell.classList.remove('valid-move', 'last-move');
        cell.innerHTML = '';
    });
    
    // Mark last move
    if (gameState.lastMove) {
        const [lastRow, lastCol] = gameState.lastMove;
        const lastMoveIndex = lastRow * BOARD_SIZE + lastCol;
        cells[lastMoveIndex].classList.add('last-move');
    }
    
    // Mark valid moves for current player
    if (gameState.currentPlayer === gameState.playerDisc) {
        const validMoves = getValidMoves(gameState.board, gameState.currentPlayer);
        validMoves.forEach(([row, col]) => {
            const cellIndex = row * BOARD_SIZE + col;
            cells[cellIndex].classList.add('valid-move');
        });
    }
    
    // Render discs
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cellValue = gameState.board[row][col];
            if (cellValue !== EMPTY) {
                const cellIndex = row * BOARD_SIZE + col;
                const disc = document.createElement('div');
                const discColor = cellValue === BLACK ? 'black' : 'white';
                disc.className = `disc ${discColor}`;
                
                // Add animation class for new discs
                if (gameState.lastMove && gameState.lastMove[0] === row && gameState.lastMove[1] === col) {
                    disc.classList.add('new-disc');
                }
                
                cells[cellIndex].appendChild(disc);
            }
        }
    }
}

/**
 * Handle a cell click
 * @param {number} row - Row index
 * @param {number} col - Column index
 */
function handleCellClick(row, col) {
    const { currentPlayer, playerDisc, computerDisc, isGameOver, isComputerThinking, board } = gameState;
    
    // Ignore clicks if it's not the player's turn or game is over
    if (currentPlayer !== playerDisc || isGameOver || isComputerThinking) {
        return;
    }
    
    // Check if the move is valid
    if (isValidMove(board, row, col, currentPlayer)) {
        // Save game state for undo functionality
        saveToHistory();
        
        // Make the move
        makeMove(board, row, col, currentPlayer);
        gameState.lastMove = [row, col];
        gameState.moveCounter++;
        
        renderBoard();
        updateScores();
        updateMoveCounter();
        updateUndoButton();
        
        // Switch player
        gameState.currentPlayer = computerDisc;
        updateStatusMessage();
        
        // Check game state - this might change player turn if no valid moves
        checkGameState();
        
        // Save game state to localStorage
        saveGameState();
        
        // If game is not over and it's still computer's turn, make computer move
        if (!gameState.isGameOver && gameState.currentPlayer === computerDisc) {
            setTimeout(makeComputerMove, 500); // Delay for better UX
        }
    }
}

/**
 * Make a computer move based on the selected difficulty
 */
function makeComputerMove() {
    const { isGameOver, currentPlayer, computerDisc, playerDisc, board } = gameState;
    
    if (isGameOver || currentPlayer !== computerDisc) {
        return;
    }
    
    gameState.isComputerThinking = true;
    DOM.gameBoard.classList.add('loading');
    updateStatusMessage();
    
    // Short delay to show "thinking" message
    setTimeout(() => {
        const validMoves = getValidMoves(board, computerDisc);
        
        if (validMoves.length === 0) {
            // Computer has no valid moves
            gameState.currentPlayer = playerDisc;
            gameState.isComputerThinking = false;
            DOM.gameBoard.classList.remove('loading');
            updateStatusMessage();
            checkGameState();
            return;
        }
        
        const difficulty = DOM.difficultySelector.value;
        let moveCoordinates;
        
        // Use object literal for cleaner switch replacement
        const difficultyStrategies = {
            'easy': () => makeEasyMove(validMoves),
            'medium': () => makeMediumMove(validMoves),
            'hard': () => makeHardMove(validMoves),
            'default': () => makeMediumMove(validMoves)
        };
        
        // Get strategy function or use default
        const strategy = difficultyStrategies[difficulty] || difficultyStrategies.default;
        moveCoordinates = strategy();
        
        const [row, col] = moveCoordinates;
        
        // Make the move
        makeMove(board, row, col, computerDisc);
        gameState.lastMove = [row, col];
        gameState.moveCounter++;
        
        renderBoard();
        updateScores();
        updateMoveCounter();
        
        // Switch player
        gameState.currentPlayer = playerDisc;
        gameState.isComputerThinking = false;
        DOM.gameBoard.classList.remove('loading');
        updateStatusMessage();
        
        // Check game state
        checkGameState();
        
        // Save game state to localStorage
        saveGameState();
    }, 1000);
}

/**
 * Make an easy move (random selection)
 * @param {Array} validMoves - Array of valid moves
 * @returns {Array} Selected move coordinates [row, col]
 */
function makeEasyMove(validMoves) {
    // If there's only one valid move, return it
    if (validMoves.length === 1) {
        return validMoves[0];
    }
    
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
}

/**
 * Make a medium move (prioritize corners and edges)
 * @param {Array} validMoves - Array of valid moves
 * @returns {Array} Selected move coordinates [row, col]
 */
function makeMediumMove(validMoves) {
    // If there's only one valid move, return it
    if (validMoves.length === 1) {
        return validMoves[0];
    }
    
    // Score map for medium difficulty (prioritize corners and edges)
    const scoreMap = Array.from({ length: BOARD_SIZE }, 
        () => Array(BOARD_SIZE).fill(1));
    
    // Corners have highest priority
    const corners = [
        [0, 0], [0, BOARD_SIZE - 1], 
        [BOARD_SIZE - 1, 0], [BOARD_SIZE - 1, BOARD_SIZE - 1]
    ];
    
    // Set corner values
    corners.forEach(([row, col]) => {
        scoreMap[row][col] = 10;
    });
    
    // Edges have medium priority
    for (let i = 1; i < BOARD_SIZE - 1; i++) {
        scoreMap[0][i] = 5;                   // Top edge
        scoreMap[BOARD_SIZE - 1][i] = 5;      // Bottom edge
        scoreMap[i][0] = 5;                   // Left edge
        scoreMap[i][BOARD_SIZE - 1] = 5;      // Right edge
    }
    
    // Avoid cells next to corners if possible
    const adjacentCorners = [
        [0, 1], [1, 0], [1, 1],
        [0, BOARD_SIZE - 2], [1, BOARD_SIZE - 1], [1, BOARD_SIZE - 2],
        [BOARD_SIZE - 2, 0], [BOARD_SIZE - 1, 1], [BOARD_SIZE - 2, 1],
        [BOARD_SIZE - 2, BOARD_SIZE - 1], [BOARD_SIZE - 1, BOARD_SIZE - 2], [BOARD_SIZE - 2, BOARD_SIZE - 2]
    ];
    
    // Set adjacent corner values
    adjacentCorners.forEach(([row, col]) => {
        scoreMap[row][col] = 0;
    });
    
    // Find the move with the highest score
    return validMoves.reduce((bestMove, currentMove) => {
        const [currentRow, currentCol] = currentMove;
        const [bestRow, bestCol] = bestMove;
        return scoreMap[currentRow][currentCol] > scoreMap[bestRow][bestCol] 
            ? currentMove : bestMove;
    }, validMoves[0]);
}

/**
 * Make a hard move (uses minimax with alpha-beta pruning and strategic evaluation)
 * @param {Array} validMoves - Array of valid moves
 * @returns {Array} Selected move coordinates [row, col]
 */
function makeHardMove(validMoves) {
    // If there's only one valid move, return it
    if (validMoves.length === 1) {
        return validMoves[0];
    }
    
    const { board, computerDisc } = gameState;
    const opponentDisc = computerDisc === BLACK ? WHITE : BLACK;
    
    // First, prioritize corners if available
    const cornerMove = validMoves.find(([row, col]) => 
        (row === 0 || row === BOARD_SIZE - 1) && (col === 0 || col === BOARD_SIZE - 1));
    
    if (cornerMove) {
        return cornerMove;
    }
    
    // Determine game phase for evaluation adjustments
    const totalDiscs = countDiscs(board).total;
    const gamePhase = totalDiscs < 20 ? 'early' : (totalDiscs < 50 ? 'mid' : 'late');
    
    // Use minimax with alpha-beta pruning to find the best move
    let bestScore = -Infinity;
    let bestMove = validMoves[0];
    
    // Adjust search depth based on number of valid moves and game phase for performance
    let searchDepth;
    if (gamePhase === 'late') {
        searchDepth = validMoves.length > 8 ? 3 : (validMoves.length > 4 ? 4 : 5);
    } else {
        searchDepth = validMoves.length > 10 ? 2 : (validMoves.length > 6 ? 3 : 4);
    }
    
    for (const move of validMoves) {
        const [row, col] = move;
        
        // Create a copy of the board to simulate the move
        const boardCopy = JSON.parse(JSON.stringify(board));
        
        // Make the move on the copied board
        makeMove(boardCopy, row, col, computerDisc);
        
        // Calculate the score using minimax
        const score = minimax(boardCopy, searchDepth - 1, -Infinity, Infinity, false, computerDisc, opponentDisc, gamePhase);
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    return bestMove;
}

/**
 * Minimax algorithm with alpha-beta pruning for AI decision making
 * @param {Array} board - Game board state
 * @param {number} depth - Remaining search depth
 * @param {number} alpha - Alpha value for pruning
 * @param {number} beta - Beta value for pruning
 * @param {boolean} isMaximizingPlayer - Whether the current player is maximizing
 * @param {number} maxPlayer - Disc color of the maximizing player
 * @param {number} minPlayer - Disc color of the minimizing player
 * @param {string} gamePhase - Current game phase (early, mid, late)
 * @returns {number} Best score for the current board position
 */
function minimax(board, depth, alpha, beta, isMaximizingPlayer, maxPlayer, minPlayer, gamePhase) {
    const currentPlayer = isMaximizingPlayer ? maxPlayer : minPlayer;
    
    // Terminal condition: reached depth limit or game over
    if (depth === 0) {
        return evaluateBoard(board, maxPlayer, minPlayer, gamePhase);
    }
    
    const validMoves = getValidMoves(board, currentPlayer);
    
    // If no valid moves, either pass or end game
    if (validMoves.length === 0) {
        // Check if the opponent has any moves
        const opponentValidMoves = getValidMoves(board, currentPlayer === BLACK ? WHITE : BLACK);
        if (opponentValidMoves.length === 0) {
            // Game over, count discs
            const { black, white } = countDiscs(board);
            const scoreDiff = maxPlayer === BLACK ? black - white : white - black;
            return scoreDiff * 1000; // High value for winning, low for losing
        }
        // Need to pass, evaluate from opponent's perspective
        return minimax(board, depth - 1, alpha, beta, !isMaximizingPlayer, maxPlayer, minPlayer, gamePhase);
    }
    
    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        
        for (const [row, col] of validMoves) {
            // Create a copy of the board to simulate the move
            const boardCopy = JSON.parse(JSON.stringify(board));
            makeMove(boardCopy, row, col, currentPlayer);
            
            const eval = minimax(boardCopy, depth - 1, alpha, beta, false, maxPlayer, minPlayer, gamePhase);
            maxEval = Math.max(maxEval, eval);
            
            // Alpha-beta pruning
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                break;
            }
        }
        
        return maxEval;
    } else {
        let minEval = Infinity;
        
        for (const [row, col] of validMoves) {
            // Create a copy of the board to simulate the move
            const boardCopy = JSON.parse(JSON.stringify(board));
            makeMove(boardCopy, row, col, currentPlayer);
            
            const eval = minimax(boardCopy, depth - 1, alpha, beta, true, maxPlayer, minPlayer, gamePhase);
            minEval = Math.min(minEval, eval);
            
            // Alpha-beta pruning
            beta = Math.min(beta, eval);
            if (beta <= alpha) {
                break;
            }
        }
        
        return minEval;
    }
}

/**
 * Enhanced board evaluation function for the minimax algorithm
 * @param {Array} board - Game board
 * @param {number} maxPlayer - Disc color of the maximizing player
 * @param {number} minPlayer - Disc color of the minimizing player
 * @param {string} gamePhase - Current game phase (early, mid, late)
 * @returns {number} Evaluation score of the board position
 */
function evaluateBoard(board, maxPlayer, minPlayer, gamePhase) {
    // Count discs of each color
    const { black, white } = countDiscs(board);
    
    // Disc parity (difference in disc count)
    const discParity = maxPlayer === BLACK ? black - white : white - black;
    
    // Mobility (number of valid moves for each player)
    const maxPlayerMobility = getValidMoves(board, maxPlayer).length;
    const minPlayerMobility = getValidMoves(board, minPlayer).length;
    const mobility = maxPlayerMobility - minPlayerMobility;
    
    // Corner control
    const corners = [
        [0, 0], [0, BOARD_SIZE - 1], 
        [BOARD_SIZE - 1, 0], [BOARD_SIZE - 1, BOARD_SIZE - 1]
    ];
    
    let cornerScore = 0;
    for (const [row, col] of corners) {
        if (board[row][col] === maxPlayer) {
            cornerScore += 25;
        } else if (board[row][col] === minPlayer) {
            cornerScore -= 25;
        }
    }
    
    // Potential mobility (count of empty squares adjacent to opponent's discs)
    let potentialMobility = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === EMPTY) {
                // Check if this empty square is adjacent to opponent's discs
                let adjacentToOpponent = false;
                for (const [dx, dy] of DIRECTIONS) {
                    const newRow = row + dx;
                    const newCol = col + dy;
                    if (isInBounds(newRow, newCol) && board[newRow][newCol] === minPlayer) {
                        adjacentToOpponent = true;
                        break;
                    }
                }
                if (adjacentToOpponent) {
                    potentialMobility++;
                }
            }
        }
    }
    
    // Edge control (controlling stable edges)
    let edgeControl = 0;
    // Check horizontal edges (top and bottom rows)
    for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[0][col] === maxPlayer) edgeControl++;
        if (board[0][col] === minPlayer) edgeControl--;
        if (board[BOARD_SIZE - 1][col] === maxPlayer) edgeControl++;
        if (board[BOARD_SIZE - 1][col] === minPlayer) edgeControl--;
    }
    // Check vertical edges (leftmost and rightmost columns)
    for (let row = 0; row < BOARD_SIZE; row++) {
        if (board[row][0] === maxPlayer) edgeControl++;
        if (board[row][0] === minPlayer) edgeControl--;
        if (board[row][BOARD_SIZE - 1] === maxPlayer) edgeControl++;
        if (board[row][BOARD_SIZE - 1] === minPlayer) edgeControl--;
    }
    
    // Position score based on the static position weights
    let positionScore = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === maxPlayer) {
                positionScore += evaluatePosition(row, col);
            } else if (board[row][col] === minPlayer) {
                positionScore -= evaluatePosition(row, col);
            }
        }
    }
    
    // Adjust weights based on game phase
    let discParityWeight, mobilityWeight, cornerWeight, positionWeight, edgeWeight, potentialMobilityWeight;
    
    switch (gamePhase) {
        case 'early':
            discParityWeight = 0.1;
            mobilityWeight = 2.5;
            cornerWeight = 4.0;
            positionWeight = 1.0;
            edgeWeight = 1.5;
            potentialMobilityWeight = 1.0;
            break;
        case 'mid':
            discParityWeight = 0.8;
            mobilityWeight = 2.0;
            cornerWeight = 3.0;
            positionWeight = 1.0;
            edgeWeight = 1.0;
            potentialMobilityWeight = 0.5;
            break;
        case 'late':
            discParityWeight = 3.5;
            mobilityWeight = 1.0;
            cornerWeight = 2.0;
            positionWeight = 0.5;
            edgeWeight = 0.5;
            potentialMobilityWeight = 0.0;
            break;
    }
    
    // Combine all factors with appropriate weights
    return discParityWeight * discParity + 
           mobilityWeight * mobility + 
           cornerWeight * cornerScore + 
           positionWeight * positionScore +
           edgeWeight * edgeControl +
           potentialMobilityWeight * potentialMobility;
}

/**
 * Evaluate a position on the board
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {number} Position score
 */
function evaluatePosition(row, col) {
    // Position evaluation weights - prioritize corners and edges
    const positionWeights = [
        [100, -20, 10,  5,  5, 10, -20, 100],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [ 10,  -2,  5,  1,  1,  5,  -2,  10],
        [  5,  -2,  1,  0,  0,  1,  -2,   5],
        [  5,  -2,  1,  0,  0,  1,  -2,   5],
        [ 10,  -2,  5,  1,  1,  5,  -2,  10],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [100, -20, 10,  5,  5, 10, -20, 100]
    ];
    
    return positionWeights[row][col];
}

/**
 * Count the number of discs of each color on the board
 * @param {Array} board - Game board
 * @returns {Object} Object with counts of black, white, and total discs
 */
function countDiscs(board) {
    let black = 0;
    let white = 0;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === BLACK) {
                black++;
            } else if (board[row][col] === WHITE) {
                white++;
            }
        }
    }
    
    return { black, white, total: black + white };
}

/**
 * Count the number of discs that would be flipped by a move
 * @param {Array} board - Game board
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {number} player - Player disc color
 * @returns {number} Number of flips
 */
function countFlips(board, row, col, player) {
    // If the cell is not empty, no flips are possible
    if (board[row][col] !== EMPTY) {
        return 0;
    }
    
    return DIRECTIONS.reduce((totalFlips, [dx, dy]) => {
        let x = row + dx;
        let y = col + dy;
        let tempFlips = 0;
        
        // Count opponent discs that would be flipped in this direction
        while (isInBounds(x, y) && board[x][y] !== EMPTY && board[x][y] !== player) {
            tempFlips++;
            x += dx;
            y += dy;
        }
        
        // If we reach a player disc at the end of the line, count the flips
        // Otherwise, no flips in this direction
        if (isInBounds(x, y) && board[x][y] === player && tempFlips > 0) {
            totalFlips += tempFlips;
        }
        
        return totalFlips;
    }, 0);
}

/**
 * Check if coordinates are within board bounds
 * @param {number} x - Row index
 * @param {number} y - Column index
 * @returns {boolean} True if in bounds
 */
function isInBounds(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

/**
 * Check if a move is valid
 * @param {Array} board - Game board
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {number} player - Player disc color
 * @returns {boolean} True if the move is valid
 */
function isValidMove(board, row, col, player) {
    // Cell must be empty
    if (board[row][col] !== EMPTY) {
        return false;
    }
    
    // A move is valid if it flips at least one opponent disc
    return countFlips(board, row, col, player) > 0;
}

/**
 * Get all valid moves for a player
 * @param {Array} board - Game board
 * @param {number} player - Player disc color
 * @returns {Array} Array of valid move coordinates
 */
function getValidMoves(board, player) {
    const validMoves = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isValidMove(board, row, col, player)) {
                validMoves.push([row, col]);
            }
        }
    }
    
    return validMoves;
}

/**
 * Make a move and flip appropriate discs
 * @param {Array} board - Game board
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {number} player - Player disc color
 */
function makeMove(board, row, col, player) {
    // Place the player's disc
    board[row][col] = player;
    
    // Flip discs in all valid directions
    DIRECTIONS.forEach(([dx, dy]) => {
        let x = row + dx;
        let y = col + dy;
        const discsToFlip = [];
        
        // First collect all potential discs to flip in this direction
        while (isInBounds(x, y) && board[x][y] !== EMPTY && board[x][y] !== player) {
            discsToFlip.push([x, y]);
            x += dx;
            y += dy;
        }
        
        // If we found our own disc at the end of the line, flip all collected discs
        if (isInBounds(x, y) && board[x][y] === player && discsToFlip.length > 0) {
            discsToFlip.forEach(([flipX, flipY]) => {
                board[flipX][flipY] = player;
            });
        }
    });
}

/**
 * Update the scores display
 */
function updateScores() {
    const { board } = gameState;
    
    // Use reduce for a more modern counting approach
    const counts = board.flat().reduce((acc, cell) => {
        if (cell === BLACK) acc.black++;
        else if (cell === WHITE) acc.white++;
        return acc;
    }, { black: 0, white: 0 });
    
    // Make sure to convert to string when setting textContent
    DOM.blackScore.textContent = String(counts.black);
    DOM.whiteScore.textContent = String(counts.white);
    
    // Update board coverage
    const totalDiscs = counts.black + counts.white;
    const coverage = Math.round((totalDiscs / (BOARD_SIZE * BOARD_SIZE)) * 100);
    DOM.boardCoverage.textContent = `${coverage}%`;
}

/**
 * Update the status message
 */
function updateStatusMessage() {
    const { isGameOver, isComputerThinking, currentPlayer, playerDisc } = gameState;
    
    // Remove any existing status classes
    DOM.statusMessage.classList.remove('thinking');
    
    if (isGameOver) {
        const blackCount = parseInt(DOM.blackScore.textContent);
        const whiteCount = parseInt(DOM.whiteScore.textContent);
        
        // Use template literals for better readability
        if (blackCount > whiteCount) {
            DOM.statusMessage.textContent = 'Black wins! 🎉';
        } else if (whiteCount > blackCount) {
            DOM.statusMessage.textContent = 'White wins! 🎉';
        } else {
            DOM.statusMessage.textContent = "It's a tie! 🤝";
        }
    } else if (isComputerThinking) {
        DOM.statusMessage.textContent = 'Computer is thinking...';
        DOM.statusMessage.classList.add('thinking');
    } else if (currentPlayer === playerDisc) {
        DOM.statusMessage.textContent = 'Your turn';
    } else {
        DOM.statusMessage.textContent = "Computer's turn";
    }
}

/**
 * Check if the game is over or if the current player has no valid moves
 */
function checkGameState() {
    const { board, playerDisc, computerDisc } = gameState;
    const playerMoves = getValidMoves(board, playerDisc);
    const computerMoves = getValidMoves(board, computerDisc);
    
    // Game is over if both players have no valid moves
    if (playerMoves.length === 0 && computerMoves.length === 0) {
        gameState.isGameOver = true;
        updateStatusMessage();
        return;
    }
    
    // Handle case where current player has no valid moves
    if (gameState.currentPlayer === playerDisc && playerMoves.length === 0) {
        // Player has no valid moves, switch to computer
        gameState.currentPlayer = computerDisc;
        updateStatusMessage();
        setTimeout(makeComputerMove, 500);
    } else if (gameState.currentPlayer === computerDisc && computerMoves.length === 0) {
        // Computer has no valid moves, switch to player
        gameState.currentPlayer = playerDisc;
        updateStatusMessage();
    }
}

/**
 * Restart the game
 */
function restartGame() {
    initializeBoard();
    renderBoard();
    updateScores();
}

/**
 * Update the move counter display
 */
function updateMoveCounter() {
    DOM.moveCounter.textContent = gameState.moveCounter;
}

/**
 * Update the undo button state
 */
function updateUndoButton() {
    DOM.undoButton.disabled = gameState.moveHistory.length === 0 || gameState.isComputerThinking;
}

/**
 * Save current game state to history for undo functionality
 */
function saveToHistory() {
    const state = {
        board: gameState.board.map(row => [...row]),
        currentPlayer: gameState.currentPlayer,
        lastMove: gameState.lastMove,
        moveCounter: gameState.moveCounter
    };
    gameState.moveHistory.push(state);
    
    // Limit history to last 10 moves to prevent memory issues
    if (gameState.moveHistory.length > 10) {
        gameState.moveHistory.shift();
    }
}

/**
 * Undo the last move
 */
function undoLastMove() {
    if (gameState.moveHistory.length === 0 || gameState.isComputerThinking || gameState.isGameOver) {
        return;
    }
    
    // Restore the last saved state
    const lastState = gameState.moveHistory.pop();
    gameState.board = lastState.board;
    gameState.currentPlayer = lastState.currentPlayer;
    gameState.lastMove = lastState.lastMove;
    gameState.moveCounter = lastState.moveCounter;
    
    // Update UI
    renderBoard();
    updateScores();
    updateMoveCounter();
    updateUndoButton();
    updateStatusMessage();
    saveGameState();
}

/**
 * Save game state to localStorage
 */
function saveGameState() {
    try {
        const state = {
            board: gameState.board,
            currentPlayer: gameState.currentPlayer,
            moveCounter: gameState.moveCounter,
            lastMove: gameState.lastMove,
            playerDisc: gameState.playerDisc,
            computerDisc: gameState.computerDisc
        };
        localStorage.setItem('reversiGameState', JSON.stringify(state));
    } catch (e) {
        // Ignore localStorage errors
    }
}

/**
 * Load game state from localStorage
 */
function loadGameState() {
    try {
        const saved = localStorage.getItem('reversiGameState');
        if (saved) {
            const state = JSON.parse(saved);
            gameState.board = state.board;
            gameState.currentPlayer = state.currentPlayer;
            gameState.moveCounter = state.moveCounter || 0;
            gameState.lastMove = state.lastMove;
            gameState.playerDisc = state.playerDisc || BLACK;
            gameState.computerDisc = state.computerDisc || WHITE;
            return true;
        }
    } catch (e) {
        // Ignore localStorage errors
    }
    return false;
}

/**
 * Handle keyboard input for accessibility
 */
function handleKeyboardInput(event) {
    // Only handle keyboard input when it's the player's turn
    if (gameState.currentPlayer !== gameState.playerDisc || gameState.isGameOver || gameState.isComputerThinking) {
        return;
    }
    
    // Get currently focused cell or first valid move
    let focusedCell = document.querySelector('.cell:focus');
    if (!focusedCell) {
        const validMoves = getValidMoves(gameState.board, gameState.currentPlayer);
        if (validMoves.length > 0) {
            const [row, col] = validMoves[0];
            const cellIndex = row * BOARD_SIZE + col;
            focusedCell = document.querySelectorAll('.cell')[cellIndex];
        }
    }
    
    if (!focusedCell) return;
    
    const cells = Array.from(document.querySelectorAll('.cell'));
    const currentIndex = cells.indexOf(focusedCell);
    const currentRow = Math.floor(currentIndex / BOARD_SIZE);
    const currentCol = currentIndex % BOARD_SIZE;
    
    let newRow = currentRow;
    let newCol = currentCol;
    
    switch (event.key) {
        case 'ArrowUp':
            newRow = Math.max(0, currentRow - 1);
            event.preventDefault();
            break;
        case 'ArrowDown':
            newRow = Math.min(BOARD_SIZE - 1, currentRow + 1);
            event.preventDefault();
            break;
        case 'ArrowLeft':
            newCol = Math.max(0, currentCol - 1);
            event.preventDefault();
            break;
        case 'ArrowRight':
            newCol = Math.min(BOARD_SIZE - 1, currentCol + 1);
            event.preventDefault();
            break;
        case 'Enter':
        case ' ':
            handleCellClick(currentRow, currentCol);
            event.preventDefault();
            break;
        case 'u':
        case 'U':
            if (event.ctrlKey || event.metaKey) {
                undoLastMove();
                event.preventDefault();
            }
            break;
        case 'r':
        case 'R':
            if (event.ctrlKey || event.metaKey) {
                restartGame();
                event.preventDefault();
            }
            break;
        default:
            return;
    }
    
    if (newRow !== currentRow || newCol !== currentCol) {
        const newIndex = newRow * BOARD_SIZE + newCol;
        cells[newIndex].focus();
    }
}

/**
 * Toggle help section visibility
 */
function toggleHelp() {
    const isVisible = DOM.helpSection.style.display !== 'none';
    DOM.helpSection.style.display = isVisible ? 'none' : 'block';
    DOM.helpButton.textContent = isVisible ? 'Help' : 'Hide Help';
    DOM.helpButton.setAttribute('aria-expanded', !isVisible);
}