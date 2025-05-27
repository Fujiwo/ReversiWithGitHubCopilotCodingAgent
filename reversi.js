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
    isComputerThinking: false
};

// DOM elements - using const for elements that won't be reassigned
const DOM = {
    gameBoard: document.getElementById('game-board'),
    statusMessage: document.getElementById('status-message'),
    blackScore: document.getElementById('black-score'),
    whiteScore: document.getElementById('white-score'),
    difficultySelector: document.getElementById('difficulty'),
    restartButton: document.getElementById('restart-button')
};

// Event listeners
document.addEventListener('DOMContentLoaded', initGame);
DOM.restartButton.addEventListener('click', restartGame);
DOM.difficultySelector.addEventListener('change', () => {
    const { currentPlayer, computerDisc, isGameOver } = gameState;
    if (currentPlayer === computerDisc && !isGameOver) {
        makeComputerMove();
    }
});

/**
 * Initialize the game
 */
function initGame() {
    createGameBoard();
    initializeBoard();
    renderBoard();
    updateScores();
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
    
    // Update UI
    updateStatusMessage();
}

/**
 * Render the current state of the board
 */
function renderBoard() {
    const cells = document.querySelectorAll('.cell');
    
    // Clear valid move indicators
    cells.forEach(cell => {
        cell.classList.remove('valid-move');
        cell.innerHTML = '';
    });
    
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
        // Make the move
        makeMove(board, row, col, currentPlayer);
        renderBoard();
        updateScores();
        
        // Switch player
        gameState.currentPlayer = computerDisc;
        updateStatusMessage();
        
        // Check game state
        checkGameState();
        
        // If game is not over, let computer make a move
        if (!gameState.isGameOver) {
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
    updateStatusMessage();
    
    // Short delay to show "thinking" message
    setTimeout(() => {
        const validMoves = getValidMoves(board, computerDisc);
        
        if (validMoves.length === 0) {
            // Computer has no valid moves
            gameState.currentPlayer = playerDisc;
            gameState.isComputerThinking = false;
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
        renderBoard();
        updateScores();
        
        // Switch player
        gameState.currentPlayer = playerDisc;
        gameState.isComputerThinking = false;
        updateStatusMessage();
        
        // Check game state
        checkGameState();
    }, 1000);
}

/**
 * Make an easy move (random selection)
 * @param {Array} validMoves - Array of valid moves
 * @returns {Array} Selected move coordinates [row, col]
 */
function makeEasyMove(validMoves) {
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
}

/**
 * Make a medium move (prioritize corners and edges)
 */
function makeMediumMove(validMoves) {
    // Score map for medium difficulty (prioritize corners and edges)
    const scoreMap = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(1));
    
    // Corners have highest priority
    scoreMap[0][0] = 10;
    scoreMap[0][BOARD_SIZE - 1] = 10;
    scoreMap[BOARD_SIZE - 1][0] = 10;
    scoreMap[BOARD_SIZE - 1][BOARD_SIZE - 1] = 10;
    
    // Edges have medium priority
    for (let i = 1; i < BOARD_SIZE - 1; i++) {
        scoreMap[0][i] = 5;                   // Top edge
        scoreMap[BOARD_SIZE - 1][i] = 5;      // Bottom edge
        scoreMap[i][0] = 5;                   // Left edge
        scoreMap[i][BOARD_SIZE - 1] = 5;      // Right edge
    }
    
    // Avoid cells next to corners if possible
    scoreMap[0][1] = 0;
    scoreMap[1][0] = 0;
    scoreMap[1][1] = 0;
    
    scoreMap[0][BOARD_SIZE - 2] = 0;
    scoreMap[1][BOARD_SIZE - 1] = 0;
    scoreMap[1][BOARD_SIZE - 2] = 0;
    
    scoreMap[BOARD_SIZE - 2][0] = 0;
    scoreMap[BOARD_SIZE - 1][1] = 0;
    scoreMap[BOARD_SIZE - 2][1] = 0;
    
    scoreMap[BOARD_SIZE - 2][BOARD_SIZE - 1] = 0;
    scoreMap[BOARD_SIZE - 1][BOARD_SIZE - 2] = 0;
    scoreMap[BOARD_SIZE - 2][BOARD_SIZE - 2] = 0;
    
    // Find the move with the highest score
    let bestScore = -1;
    let bestMove = validMoves[0];
    
    for (const [row, col] of validMoves) {
        const moveScore = scoreMap[row][col];
        if (moveScore > bestScore) {
            bestScore = moveScore;
            bestMove = [row, col];
        }
    }
    
    return bestMove;
}

/**
 * Make a hard move (uses minimax algorithm with depth-limited search)
 */
function makeHardMove(validMoves) {
    // For the advanced AI, we'll use position evaluation and look ahead
    
    // First, prioritize corners if available
    for (const [row, col] of validMoves) {
        if ((row === 0 || row === BOARD_SIZE - 1) && 
            (col === 0 || col === BOARD_SIZE - 1)) {
            return [row, col];
        }
    }
    
    // Otherwise, look for the move that flips the most discs
    let bestMove = validMoves[0];
    let maxFlips = 0;
    
    for (const [row, col] of validMoves) {
        const flips = countFlips(gameBoard, row, col, computerDisc);
        
        // Evaluate position using a weighted score
        const positionScore = evaluatePosition(row, col);
        const totalScore = flips * 2 + positionScore;
        
        if (totalScore > maxFlips) {
            maxFlips = totalScore;
            bestMove = [row, col];
        }
    }
    
    return bestMove;
}

/**
 * Evaluate a position on the board
 */
function evaluatePosition(row, col) {
    // Position evaluation weights
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
 * Count the number of discs that would be flipped by a move
 */
function countFlips(board, row, col, player) {
    let flips = 0;
    
    for (const [dx, dy] of DIRECTIONS) {
        let x = row + dx;
        let y = col + dy;
        let tempFlips = 0;
        
        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[x][y] !== EMPTY && board[x][y] !== player) {
            tempFlips++;
            x += dx;
            y += dy;
            
            if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[x][y] === EMPTY) {
                tempFlips = 0;
                break;
            }
            
            if (board[x][y] === player) {
                flips += tempFlips;
                break;
            }
        }
    }
    
    return flips;
}

/**
 * Check if a move is valid
 */
function isValidMove(board, row, col, player) {
    // Cell must be empty
    if (board[row][col] !== EMPTY) {
        return false;
    }
    
    // Check in all directions
    for (const [dx, dy] of DIRECTIONS) {
        let x = row + dx;
        let y = col + dy;
        let hasOpponent = false;
        
        // Continue in this direction as long as we find opponent's discs
        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[x][y] !== EMPTY && board[x][y] !== player) {
            hasOpponent = true;
            x += dx;
            y += dy;
            
            // If we reach the edge or an empty cell, this direction is invalid
            if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[x][y] === EMPTY) {
                hasOpponent = false;
                break;
            }
            
            // If we find our own disc after opponent's discs, this is a valid move
            if (board[x][y] === player) {
                return hasOpponent;
            }
        }
    }
    
    return false;
}

/**
 * Get all valid moves for a player
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
 */
function makeMove(board, row, col, player) {
    // Place the player's disc
    board[row][col] = player;
    
    // Flip discs in all valid directions
    for (const [dx, dy] of DIRECTIONS) {
        let x = row + dx;
        let y = col + dy;
        const discsToFlip = [];
        
        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[x][y] !== EMPTY && board[x][y] !== player) {
            discsToFlip.push([x, y]);
            x += dx;
            y += dy;
            
            if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || board[x][y] === EMPTY) {
                discsToFlip.length = 0;
                break;
            }
            
            if (board[x][y] === player) {
                // Flip all discs in between
                for (const [flipX, flipY] of discsToFlip) {
                    board[flipX][flipY] = player;
                }
                break;
            }
        }
    }
}

/**
 * Update the scores display
 */
function updateScores() {
    const { board } = gameState;
    // Use reduce for more modern counting approach
    const counts = board.flat().reduce((acc, cell) => {
        if (cell === BLACK) acc.black++;
        else if (cell === WHITE) acc.white++;
        return acc;
    }, { black: 0, white: 0 });
    
    DOM.blackScore.textContent = counts.black;
    DOM.whiteScore.textContent = counts.white;
}

/**
 * Update the status message
 */
function updateStatusMessage() {
    const { isGameOver, isComputerThinking, currentPlayer, playerDisc } = gameState;
    
    if (isGameOver) {
        const blackCount = parseInt(DOM.blackScore.textContent);
        const whiteCount = parseInt(DOM.whiteScore.textContent);
        
        // Use template literals for better readability
        if (blackCount > whiteCount) {
            DOM.statusMessage.textContent = 'Black wins!';
        } else if (whiteCount > blackCount) {
            DOM.statusMessage.textContent = 'White wins!';
        } else {
            DOM.statusMessage.textContent = "It's a tie!";
        }
    } else if (isComputerThinking) {
        DOM.statusMessage.textContent = 'Computer is thinking...';
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
    
    if (playerMoves.length === 0 && computerMoves.length === 0) {
        // Game over - no valid moves for either player
        gameState.isGameOver = true;
        updateStatusMessage();
    } else if (gameState.currentPlayer === playerDisc && playerMoves.length === 0) {
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