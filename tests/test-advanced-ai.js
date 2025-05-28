/**
 * Advanced tests for Reversi AI strategies and edge cases
 */

// Create a test suite for advanced AI strategies
const advancedAISuite = TestFramework.createSuite('Advanced AI Strategy Tests');

// Set up a fresh board before each test
TestFramework.beforeEach(advancedAISuite, function() {
    // Reset the game state before each test
    initTestEnvironment();
});

// Test AI move selection with very limited options
TestFramework.addTest(advancedAISuite, 'AI should handle scenarios with only one valid move', function() {
    // Set up a board where WHITE has only one valid move
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            gameState.board[i][j] = EMPTY;
        }
    }
    
    // Set up a position where (0,0) is the only valid move for WHITE
    gameState.board[0][0] = EMPTY;
    gameState.board[0][1] = BLACK;
    gameState.board[0][2] = WHITE;
    
    // Get valid moves for WHITE
    const validMoves = getValidMoves(gameState.board, WHITE);
    
    // Assert there's only one valid move
    assertEqual(validMoves.length, 1, 'WHITE should have exactly one valid move');
    assertEqual(validMoves[0][0], 0, 'The only valid move should be at row 0');
    assertEqual(validMoves[0][1], 0, 'The only valid move should be at column 0');
    
    // Test each AI strategy
    const easyMove = makeEasyMove(validMoves);
    const mediumMove = makeMediumMove(validMoves);
    const hardMove = makeHardMove(validMoves);
    
    // All strategies should select the only available move
    assertEqual(easyMove[0], 0, 'Easy AI should select the only available move (row 0)');
    assertEqual(easyMove[1], 0, 'Easy AI should select the only available move (column 0)');
    assertEqual(mediumMove[0], 0, 'Medium AI should select the only available move (row 0)');
    assertEqual(mediumMove[1], 0, 'Medium AI should select the only available move (column 0)');
    assertEqual(hardMove[0], 0, 'Hard AI should select the only available move (row 0)');
    assertEqual(hardMove[1], 0, 'Hard AI should select the only available move (column 0)');
});

// Test handling of full board or near-full board
TestFramework.addTest(advancedAISuite, 'AI should handle a nearly full board correctly', function() {
    // Set up a board with only one empty cell
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            gameState.board[i][j] = (i + j) % 2 === 0 ? BLACK : WHITE;
        }
    }
    
    // Leave one cell empty
    gameState.board[7][7] = EMPTY;
    
    // Adjust adjacent cells to make it a valid move for WHITE
    gameState.board[6][7] = BLACK;
    gameState.board[7][6] = BLACK;
    gameState.board[6][6] = WHITE;
    
    // Get valid moves for WHITE
    const validMoves = getValidMoves(gameState.board, WHITE);
    
    // Assert there's only one valid move
    assertEqual(validMoves.length, 1, 'WHITE should have exactly one valid move');
    assertEqual(validMoves[0][0], 7, 'The only valid move should be at row 7');
    assertEqual(validMoves[0][1], 7, 'The only valid move should be at column 7');
    
    // Test that makeComputerMove handles this scenario
    // Store the original board
    const originalBoard = JSON.parse(JSON.stringify(gameState.board));
    
    // Mock the DOM updates
    const originalUpdateStatusMessage = updateStatusMessage;
    const originalRenderBoard = renderBoard;
    const originalUpdateScores = updateScores;
    const originalSetTimeout = setTimeout;
    
    updateStatusMessage = function() {};
    renderBoard = function() {};
    updateScores = function() {};
    
    // Mock setTimeout to execute immediately
    window.setTimeout = function(callback) {
        callback();
    };
    
    try {
        // Set up the game state for computer move
        gameState.currentPlayer = WHITE;
        gameState.computerDisc = WHITE;
        
        // Make the computer move
        makeComputerMove();
        
        // Assert that the move was made
        assertEqual(gameState.board[7][7], WHITE, 'Computer should make the only valid move at (7,7)');
    } finally {
        // Restore original functions
        updateStatusMessage = originalUpdateStatusMessage;
        renderBoard = originalRenderBoard;
        updateScores = originalUpdateScores;
        window.setTimeout = originalSetTimeout;
    }
});

// Test AI difficulty differences in a controlled scenario
TestFramework.addTest(advancedAISuite, 'Different AI difficulties should make distinct choices in certain scenarios', function() {
    // Create a board with strategic choices
    const testBoard = Array.from({ length: BOARD_SIZE }, 
        () => Array(BOARD_SIZE).fill(EMPTY));
    
    // Set up a position where corner, edge and regular moves are all available
    testBoard[3][3] = BLACK;
    testBoard[3][4] = WHITE;
    testBoard[4][3] = WHITE;
    testBoard[4][4] = BLACK;
    
    // Add some additional pieces to create more diverse move options
    testBoard[2][2] = WHITE;
    testBoard[2][3] = WHITE;
    testBoard[2][4] = BLACK;
    
    testBoard[5][5] = WHITE;
    testBoard[5][6] = WHITE;
    testBoard[6][5] = BLACK;
    
    // Add pieces to make corners available
    testBoard[1][1] = WHITE;
    testBoard[0][1] = BLACK;
    testBoard[1][0] = BLACK;
    testBoard[2][2] = WHITE;
    
    // Store the original board and temporarily replace it
    const originalBoard = gameState.board;
    gameState.board = testBoard;
    
    try {
        // Check that there are valid moves for WHITE
        const validMoves = getValidMoves(testBoard, WHITE);
        assertTrue(validMoves.length > 0, 'WHITE should have valid moves');
        
        // Set up a "rigged" random function that always returns the first move for easy AI
        const originalRandom = Math.random;
        
        // For easy AI, force it to select a move that's not a corner
        Math.random = function() {
            return 0.01; // This should select the first move in the array
        };
        
        // Get easy move
        const easyMove = makeEasyMove(validMoves);
        
        // For medium AI, the position evaluation should prefer edges over center
        const mediumMove = makeMediumMove(validMoves);
        
        // For hard AI, corners should be prioritized
        const hardMove = makeHardMove(validMoves);
        
        // Restore original Math.random
        Math.random = originalRandom;
        
        // Test if the AI strategies make different choices in this scenario
        // Hard AI should prioritize corners if available
        if (validMoves.some(move => (move[0] === 0 && move[1] === 0) || 
                                   (move[0] === 0 && move[1] === 7) ||
                                   (move[0] === 7 && move[1] === 0) ||
                                   (move[0] === 7 && move[1] === 7))) {
            assertTrue(
                (hardMove[0] === 0 && hardMove[1] === 0) ||
                (hardMove[0] === 0 && hardMove[1] === 7) ||
                (hardMove[0] === 7 && hardMove[1] === 0) ||
                (hardMove[0] === 7 && hardMove[1] === 7),
                'Hard AI should choose a corner if available'
            );
        }
        
        // If hard AI could select a corner and easy AI didn't (by our rigged random),
        // they should make different choices
        if ((hardMove[0] === 0 && hardMove[1] === 0) ||
            (hardMove[0] === 0 && hardMove[1] === 7) ||
            (hardMove[0] === 7 && hardMove[1] === 0) ||
            (hardMove[0] === 7 && hardMove[1] === 7)) {
            
            assertFalse(
                (easyMove[0] === hardMove[0] && easyMove[1] === hardMove[1]),
                'Easy AI and Hard AI should make different choices in this scenario'
            );
        }
    } finally {
        // Restore the original board
        gameState.board = originalBoard;
    }
});

// Test that the enhanced Hard AI makes better strategic choices
TestFramework.addTest(advancedAISuite, 'Enhanced Hard AI should prioritize strategic positions over immediate flips', function() {
    // Create a board with a choice between a high-flip but poor position and a lower-flip but strategic position
    const testBoard = Array.from({ length: BOARD_SIZE }, 
        () => Array(BOARD_SIZE).fill(EMPTY));
    
    // Set up the standard starting position
    testBoard[3][3] = WHITE;
    testBoard[3][4] = BLACK;
    testBoard[4][3] = BLACK;
    testBoard[4][4] = WHITE;
    
    // Add pieces to create a trap scenario:
    // - One move will flip more discs immediately but lead to opponent getting a corner
    // - Another move will flip fewer discs but prevent opponent from getting a corner
    testBoard[2][2] = BLACK;
    testBoard[2][3] = BLACK;
    testBoard[2][4] = BLACK;
    testBoard[2][5] = EMPTY; // Potential high-flip but poor strategic move for WHITE
    testBoard[2][6] = WHITE;
    
    testBoard[5][5] = BLACK;
    testBoard[6][6] = EMPTY; // Potential lower-flip but better strategic move for WHITE
    
    // Store the original board and temporarily replace it
    const originalBoard = gameState.board;
    gameState.board = testBoard;
    gameState.computerDisc = WHITE;
    
    try {
        // Get valid moves for WHITE
        const validMoves = getValidMoves(testBoard, WHITE);
        assertTrue(validMoves.length >= 2, 'There should be at least two valid moves for this test');
        
        // Ensure the "trap" move is available
        const trapMoveAvailable = validMoves.some(move => move[0] === 2 && move[1] === 5);
        assertTrue(trapMoveAvailable, 'The trap move should be available');
        
        // Count flips for each move to identify the high-flip and strategic moves
        const moveFlips = validMoves.map(([row, col]) => ({
            row,
            col,
            flips: countFlips(testBoard, row, col, WHITE)
        }));
        
        // Get the move with the most flips
        const highFlipMove = moveFlips.reduce((max, move) => 
            move.flips > max.flips ? move : max, moveFlips[0]);
        
        // Make the Hard AI choose its move
        const hardMove = makeHardMove(validMoves);
        
        // The hard AI should not choose the high-flip move if it's the trap move
        if (highFlipMove.row === 2 && highFlipMove.col === 5) {
            assertFalse(
                hardMove[0] === highFlipMove.row && hardMove[1] === highFlipMove.col,
                'Hard AI should avoid the trap move even if it flips more discs'
            );
        }
    } finally {
        // Restore the original board
        gameState.board = originalBoard;
    }
});