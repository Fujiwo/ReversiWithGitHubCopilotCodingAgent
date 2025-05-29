/**
 * Reversi Game Implementation
 * 
 * A modern implementation of the classic Reversi (also known as Othello) board game.
 * Features an AI opponent with multiple difficulty levels, undo functionality,
 * keyboard navigation, and comprehensive accessibility support.
 * 
 * @author Reversi Game
 * @version 1.0.0
 */

// =============================================================================
// GAME CONSTANTS
// =============================================================================

/** Standard Reversi board dimensions (8x8 grid) */
const BOARD_SIZE = 8;

/** Cell state constants for board representation */
const EMPTY = 0;  // Empty cell
const BLACK = 1;  // Black disc (player typically starts as black)
const WHITE = 2;  // White disc (computer typically plays as white)

/** 
 * Direction vectors for move validation and disc flipping
 * Represents all 8 possible directions from any cell:
 * Top-left, Top, Top-right, Left, Right, Bottom-left, Bottom, Bottom-right
 */
const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],  // Top row: NW, N, NE
    [0, -1],           [0, 1],   // Middle row: W, E (center position excluded)
    [1, -1],  [1, 0],  [1, 1]    // Bottom row: SW, S, SE
];

/** 
 * AI difficulty settings and timing constants
 */
const AI_CONSTANTS = {
    THINKING_DELAY: 500,           // Milliseconds to show "thinking" message
    ANIMATION_DURATION: 300,       // Duration for disc flip animations
    POSITION_WEIGHTS: {            // Strategic value of board positions
        CORNER: 100,               // Corners are most valuable
        EDGE: 10,                  // Edges are moderately valuable
        ADJACENT_TO_CORNER: -25,   // Positions next to corners are risky
        CENTER: 1                  // Center positions have base value
    }
};

/** Keyboard navigation constants */
const KEYBOARD = {
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown', 
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape'
};

// =============================================================================
// GAME STATE MANAGEMENT  
// =============================================================================

/**
 * Central game state object containing all game-related data
 * This object maintains the current state of the game including board position,
 * player information, and UI state.
 */
const gameState = {
    /** 2D array representing the game board (8x8 grid) */
    board: [],
    
    /** Current player (BLACK or WHITE) - Black always starts first */
    currentPlayer: BLACK,
    
    /** Flag indicating if the game has ended */
    isGameOver: false,
    
    /** Which disc color the human player is using */
    playerDisc: BLACK,
    
    /** Which disc color the computer AI is using */
    computerDisc: WHITE,
    
    /** Flag indicating if the computer is currently calculating its move */
    isComputerThinking: false,
    
    /** Array storing previous game states for undo functionality */
    moveHistory: [],
    
    /** Total number of moves made in the current game */
    moveCounter: 0,
    
    /** Coordinates of the last move made [row, col] or null */
    lastMove: null
};

// =============================================================================
// DOM ELEMENT REFERENCES
// =============================================================================

/**
 * Cached DOM element references for performance optimization
 * Using const ensures these references won't be accidentally reassigned
 */
const DOM = {
    /** Main game board container element */
    gameBoard: document.getElementById('game-board'),
    
    /** Status message display element */
    statusMessage: document.getElementById('status-message'),
    
    /** Black player score display */
    blackScore: document.getElementById('black-score'),
    
    /** White player score display */
    whiteScore: document.getElementById('white-score'),
    
    /** AI difficulty level selector */
    difficultySelector: document.getElementById('difficulty'),
    
    /** Game restart button */
    restartButton: document.getElementById('restart-button'),
    
    /** Undo last move button */
    undoButton: document.getElementById('undo-button'),
    
    /** Help section toggle button */
    helpButton: document.getElementById('help-button'),
    
    /** Help content section */
    helpSection: document.getElementById('help-section'),
    
    /** Move counter display */
    moveCounter: document.getElementById('move-counter'),
    
    /** Board coverage percentage display */
    boardCoverage: document.getElementById('board-coverage')
};

// =============================================================================
// EVENT LISTENERS SETUP
// =============================================================================

/**
 * Initialize event listeners when the DOM is fully loaded
 * This ensures all DOM elements are available before accessing them
 */
document.addEventListener('DOMContentLoaded', initGame);

/**
 * Button event listeners for game controls
 */
DOM.restartButton.addEventListener('click', restartGame);
DOM.undoButton.addEventListener('click', undoLastMove);
DOM.helpButton.addEventListener('click', toggleHelp);

/**
 * Difficulty selector change handler
 * Automatically triggers computer move if it's currently the computer's turn
 */
DOM.difficultySelector.addEventListener('change', () => {
    const { currentPlayer, computerDisc, isGameOver } = gameState;
    if (currentPlayer === computerDisc && !isGameOver) {
        makeComputerMove();
    }
});

/**
 * Global keyboard navigation support for accessibility
 * Enables keyboard-only game interaction
 */
document.addEventListener('keydown', handleKeyboardInput);

// =============================================================================
// CORE GAME FUNCTIONS
// =============================================================================

/**
 * Initialize the game application
 * 
 * This is the main entry point called when the DOM is ready.
 * It sets up the game board, loads any saved state, and initializes the UI.
 * 
 * @function initGame
 * @returns {void}
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
 * Create the interactive game board in the DOM
 * 
 * Generates an 8x8 grid of clickable cells with proper accessibility attributes.
 * Each cell is equipped with event listeners for mouse and keyboard interaction.
 * 
 * @function createGameBoard
 * @returns {void}
 */
function createGameBoard() {
    DOM.gameBoard.innerHTML = '';
    
    // Create 64 cells (8x8 grid) with proper accessibility support
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.tabIndex = 0;  // Make focusable for keyboard navigation
            cell.setAttribute('aria-label', `Cell ${row + 1}, ${col + 1}`);
            
            // Use arrow function to maintain proper 'this' context
            cell.addEventListener('click', () => handleCellClick(row, col));
            DOM.gameBoard.appendChild(cell);
        }
    }
}

/**
 * Initialize the board with standard Reversi starting positions
 * 
 * Sets up the classic 2x2 center configuration:
 * - White discs at positions (3,3) and (4,4)  
 * - Black discs at positions (3,4) and (4,3)
 * Also resets all game state variables to their initial values.
 * 
 * @function initializeBoard  
 * @returns {void}
 */
function initializeBoard() {
    // Create empty 8x8 board using modern Array methods
    gameState.board = Array.from({ length: BOARD_SIZE }, 
        () => Array(BOARD_SIZE).fill(EMPTY));
    
    // Set up the classic Reversi starting position in the center
    const mid = BOARD_SIZE / 2;  // mid = 4
    gameState.board[mid - 1][mid - 1] = WHITE;  // Position (3,3)
    gameState.board[mid - 1][mid] = BLACK;      // Position (3,4) 
    gameState.board[mid][mid - 1] = BLACK;      // Position (4,3)
    gameState.board[mid][mid] = WHITE;          // Position (4,4)
    
    // Reset all game state to initial values
    gameState.currentPlayer = BLACK;        // Black always moves first
    gameState.isGameOver = false;
    gameState.playerDisc = BLACK;           // Human plays as Black
    gameState.computerDisc = WHITE;         // AI plays as White
    gameState.isComputerThinking = false;
    gameState.moveHistory = [];             // Clear move history for undo
    gameState.moveCounter = 0;              // Reset move counter
    gameState.lastMove = null;              // No previous move
    
    // Update UI to reflect the new game state
    updateStatusMessage();
    updateMoveCounter();
    updateUndoButton();
    saveGameState();                        // Persist initial state
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
 * Handle user interaction with a game board cell
 * 
 * This function processes player clicks (or keyboard interactions) with board cells.
 * It validates the move, updates the game state, renders changes, and triggers
 * the computer's response move if appropriate.
 * 
 * @function handleCellClick
 * @param {number} row - Zero-based row index (0-7)
 * @param {number} col - Zero-based column index (0-7)
 * @returns {void}
 */
function handleCellClick(row, col) {
    const { currentPlayer, playerDisc, computerDisc, isGameOver, isComputerThinking, board } = gameState;
    
    // Prevent interaction during invalid game states
    if (currentPlayer !== playerDisc || isGameOver || isComputerThinking) {
        return;
    }
    
    // Validate the proposed move according to Reversi rules
    if (isValidMove(board, row, col, currentPlayer)) {
        // Preserve current state for undo functionality
        saveToHistory();
        
        // Execute the move and update game state
        makeMove(board, row, col, currentPlayer);
        gameState.lastMove = [row, col];
        gameState.moveCounter++;
        
        // Update all UI elements to reflect the new state
        renderBoard();
        updateScores();
        updateMoveCounter();
        updateUndoButton();
        
        // Switch turn to computer player
        gameState.currentPlayer = computerDisc;
        updateStatusMessage();
        
        // Check if game has ended or if players have valid moves
        checkGameState();
        
        // Persist current state to browser storage
        saveGameState();
        
        // Schedule computer move if game continues and it's computer's turn
        if (!gameState.isGameOver && gameState.currentPlayer === computerDisc) {
            setTimeout(makeComputerMove, AI_CONSTANTS.THINKING_DELAY);
        }
    }
}

/**
 * Execute a computer move based on the selected AI difficulty level
 * 
 * This function implements the AI opponent logic. It shows a "thinking" state,
 * calculates the best move according to the difficulty setting, and executes
 * the move with appropriate UI feedback.
 * 
 * @function makeComputerMove
 * @returns {void}
 */
function makeComputerMove() {
    const { isGameOver, currentPlayer, computerDisc, playerDisc, board } = gameState;
    
    // Exit early if game conditions don't allow computer move
    if (isGameOver || currentPlayer !== computerDisc) {
        return;
    }
    
    // Enter "thinking" state with visual feedback
    gameState.isComputerThinking = true;
    DOM.gameBoard.classList.add('loading');
    updateStatusMessage();
    
    // Artificial delay for better user experience (shows AI is "thinking")
    setTimeout(() => {
        const validMoves = getValidMoves(board, computerDisc);
        
        // Handle case where computer has no valid moves
        if (validMoves.length === 0) {
            gameState.currentPlayer = playerDisc;
            gameState.isComputerThinking = false;
            DOM.gameBoard.classList.remove('loading');
            updateStatusMessage();
            checkGameState();
            return;
        }
        
        // Select move based on difficulty level using strategy pattern
        const difficulty = DOM.difficultySelector.value;
        let moveCoordinates;
        
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

// =============================================================================
// AI STRATEGY IMPLEMENTATIONS
// =============================================================================

/**
 * Easy AI Strategy: Random move selection
 * 
 * This is the simplest AI strategy that randomly selects from all valid moves.
 * Provides an unpredictable but generally weak opponent suitable for beginners.
 * 
 * @function makeEasyMove
 * @param {Array<Array<number>>} validMoves - Array of valid move coordinates [[row, col], ...]
 * @returns {Array<number>} Selected move coordinates [row, col]
 */
function makeEasyMove(validMoves) {
    // Single move scenario - no choice needed
    if (validMoves.length === 1) {
        return validMoves[0];
    }
    
    // Select random move from available options
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
}

/**
 * Medium AI Strategy: Positional preference with corner/edge priority
 * 
 * This strategy implements basic Reversi positional knowledge:
 * - Corners are most valuable (score: 10) - they can't be flipped
 * - Edges are moderately valuable (score: 5) - harder to attack
 * - Positions adjacent to corners are avoided when possible (score: 0.1)
 * - All other positions have neutral value (score: 1)
 * 
 * @function makeMediumMove  
 * @param {Array<Array<number>>} validMoves - Array of valid move coordinates
 * @returns {Array<number>} Selected move coordinates [row, col]
 */
function makeMediumMove(validMoves) {
    // Single move scenario - no choice needed
    if (validMoves.length === 1) {
        return validMoves[0];
    }
    
    // Create positional scoring matrix for strategic evaluation
    const scoreMap = Array.from({ length: BOARD_SIZE }, 
        () => Array(BOARD_SIZE).fill(1));
    
    // Define corner positions (highest strategic value)
    const corners = [
        [0, 0], [0, BOARD_SIZE - 1], 
        [BOARD_SIZE - 1, 0], [BOARD_SIZE - 1, BOARD_SIZE - 1]
    ];
    
    // Assign high scores to corner positions
    corners.forEach(([row, col]) => {
        scoreMap[row][col] = AI_CONSTANTS.POSITION_WEIGHTS.CORNER / 10; // Scale to 10
    });
    
    // Assign medium scores to edge positions (excluding corners)
    for (let i = 1; i < BOARD_SIZE - 1; i++) {
        scoreMap[0][i] = 5;                   // Top edge
        scoreMap[BOARD_SIZE - 1][i] = 5;      // Bottom edge
        scoreMap[i][0] = 5;                   // Left edge
        scoreMap[i][BOARD_SIZE - 1] = 5;      // Right edge
    }
    
    // Positions adjacent to corners are generally poor choices
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

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate the number of opponent discs that would be flipped by a proposed move
 * 
 * This function is crucial for move validation and AI evaluation. It simulates
 * placing a disc at the specified position and counts how many opponent discs
 * would be captured (flipped) according to Reversi rules.
 * 
 * The function checks all 8 directions from the proposed position and counts
 * continuous lines of opponent discs that are bounded by the player's existing discs.
 * 
 * @function countFlips
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @param {number} row - Target row index (0-7)
 * @param {number} col - Target column index (0-7)
 * @param {number} player - Player disc color (BLACK or WHITE)
 * @returns {number} Total number of opponent discs that would be flipped
 */
function countFlips(board, row, col, player) {
    // Cannot place disc on occupied cell
    if (board[row][col] !== EMPTY) {
        return 0;
    }
    
    // Sum flips across all 8 directions using functional approach
    return DIRECTIONS.reduce((totalFlips, [dx, dy]) => {
        let x = row + dx;
        let y = col + dy;
        let tempFlips = 0;
        
        // Count consecutive opponent discs in this direction
        while (isInBounds(x, y) && board[x][y] !== EMPTY && board[x][y] !== player) {
            tempFlips++;
            x += dx;
            y += dy;
        }
        
        // Flips are only valid if the line ends with player's disc
        if (isInBounds(x, y) && board[x][y] === player && tempFlips > 0) {
            totalFlips += tempFlips;
        }
        
        return totalFlips;
    }, 0);
}

/**
 * Validate that coordinates fall within the game board boundaries
 * 
 * Simple bounds checking utility used throughout the game logic to prevent
 * array index out-of-bounds errors when checking adjacent cells.
 * 
 * @function isInBounds
 * @param {number} x - Row coordinate to check
 * @param {number} y - Column coordinate to check  
 * @returns {boolean} True if coordinates are within valid board range (0-7), false otherwise
 */
function isInBounds(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

// =============================================================================
// CORE GAME LOGIC FUNCTIONS
// =============================================================================

/**
 * Validate whether a move is legal according to Reversi rules
 * 
 * A move is valid if:
 * 1. The target cell is empty
 * 2. The move would flip at least one opponent disc
 * 
 * This function implements the fundamental rule of Reversi: you can only place
 * a disc where it will capture (flip) one or more opponent discs by sandwiching
 * them between the new disc and an existing disc of your color.
 * 
 * @function isValidMove
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @param {number} row - Target row index (0-7)
 * @param {number} col - Target column index (0-7)  
 * @param {number} player - Player disc color (BLACK or WHITE)
 * @returns {boolean} True if the move is legal, false otherwise
 */
function isValidMove(board, row, col, player) {
    // Basic requirement: target cell must be unoccupied
    if (board[row][col] !== EMPTY) {
        return false;
    }
    
    // Reversi rule: move must flip at least one opponent disc
    return countFlips(board, row, col, player) > 0;
}

/**
 * Generate all legal moves available to a player
 * 
 * Systematically checks every empty cell on the board to determine which
 * positions would result in valid moves for the specified player. This is
 * used for move validation, AI decision making, and game state evaluation.
 * 
 * @function getValidMoves
 * @param {Array<Array<number>>} board - 2D array representing the game board
 * @param {number} player - Player disc color (BLACK or WHITE)
 * @returns {Array<Array<number>>} Array of valid move coordinates [[row, col], ...]
 */
function getValidMoves(board, player) {
    const validMoves = [];
    
    // Scan entire board for valid move positions
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
 * Execute a move and flip all captured opponent discs
 * 
 * This function implements the core Reversi move mechanics:
 * 1. Places the player's disc at the specified position
 * 2. Identifies all opponent discs that should be flipped
 * 3. Flips those discs to the player's color
 * 
 * The function checks all 8 directions from the placed disc and flips
 * any continuous lines of opponent discs that are bounded by another
 * disc of the player's color.
 * 
 * @function makeMove
 * @param {Array<Array<number>>} board - 2D array representing the game board (modified in place)
 * @param {number} row - Target row index (0-7)
 * @param {number} col - Target column index (0-7)
 * @param {number} player - Player disc color (BLACK or WHITE)
 * @returns {void}
 */
function makeMove(board, row, col, player) {
    // Place the player's disc at the target position
    board[row][col] = player;
    
    // Check all 8 directions and flip opponent discs
    DIRECTIONS.forEach(([dx, dy]) => {
        let x = row + dx;
        let y = col + dy;
        const discsToFlip = [];
        
        // Collect opponent discs in this direction that could be flipped
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

// =============================================================================
// UI UPDATE FUNCTIONS
// =============================================================================

/**
 * Update the score display to reflect current disc counts
 * 
 * Counts all black and white discs on the board and updates the score display
 * elements. Also calculates and displays the board coverage percentage.
 * Uses modern array methods for efficient counting.
 * 
 * @function updateScores
 * @returns {void}
 */
function updateScores() {
    const { board } = gameState;
    
    // Count discs using modern functional programming approach
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
            DOM.statusMessage.textContent = 'Black wins!';
        } else if (whiteCount > blackCount) {
            DOM.statusMessage.textContent = 'White wins!';
        } else {
            DOM.statusMessage.textContent = "It's a tie!";
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
        setTimeout(makeComputerMove, AI_CONSTANTS.THINKING_DELAY);
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