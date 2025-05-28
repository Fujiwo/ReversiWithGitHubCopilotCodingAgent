/**
 * Advanced tests for Reversi board scenarios and edge cases
 */

// Create a test suite for advanced board scenarios
const advancedBoardSuite = TestFramework.createSuite('Advanced Board Tests');

// Set up a fresh board before each test
TestFramework.beforeEach(advancedBoardSuite, function() {
    // Reset the game state before each test
    initTestEnvironment();
});

// Test multiple flips in different directions
TestFramework.addTest(advancedBoardSuite, 'makeMove should flip discs in multiple directions', function() {
    // Set up a board where a move will flip discs in multiple directions
    // Create a pattern where BLACK can flip WHITE discs in multiple directions
    gameState.board[1][3] = BLACK;  // Add BLACK to make vertical flip valid
    gameState.board[2][2] = WHITE;
    gameState.board[2][3] = WHITE;
    gameState.board[2][4] = BLACK;
    
    gameState.board[3][1] = BLACK;  // Add BLACK to make horizontal flip valid
    gameState.board[3][2] = WHITE;
    // (3,3) will be the move position
    gameState.board[3][4] = WHITE;
    gameState.board[3][5] = BLACK;  // Add BLACK to make flipping valid
    
    gameState.board[4][2] = BLACK;
    gameState.board[4][3] = WHITE;
    gameState.board[4][4] = WHITE;
    gameState.board[4][5] = BLACK;  // Add BLACK to make flipping valid
    gameState.board[5][3] = BLACK;  // Add BLACK to make vertical flip valid
    
    // Make the move at (3,3)
    makeMove(gameState.board, 3, 3, BLACK);
    
    // Assert that discs were flipped in all directions
    assertEqual(gameState.board[2][2], WHITE, 'Disc at (2,2) should not be flipped');
    assertEqual(gameState.board[2][3], BLACK, 'Disc at (2,3) should be flipped to BLACK');
    assertEqual(gameState.board[3][2], BLACK, 'Disc at (3,2) should be flipped to BLACK');
    assertEqual(gameState.board[3][3], BLACK, 'Disc at (3,3) should be BLACK (the move)');
    assertEqual(gameState.board[3][4], BLACK, 'Disc at (3,4) should be flipped to BLACK');
    assertEqual(gameState.board[4][3], BLACK, 'Disc at (4,3) should be flipped to BLACK');
});

// Test edge case: flipping a long line of discs
TestFramework.addTest(advancedBoardSuite, 'makeMove should flip a long line of discs', function() {
    // Set up a board with a long line of WHITE discs that can be flipped by BLACK
    for (let i = 1; i < 7; i++) {
        gameState.board[3][i] = WHITE;
    }
    gameState.board[3][7] = BLACK;
    
    // Make the move at (3,0)
    makeMove(gameState.board, 3, 0, BLACK);
    
    // Assert that all discs in the line were flipped
    for (let i = 0; i <= 7; i++) {
        assertEqual(gameState.board[3][i], BLACK, `Disc at (3,${i}) should be BLACK`);
    }
});

// Test edge case: capturing corner positions
TestFramework.addTest(advancedBoardSuite, 'Corner positions should be captured correctly', function() {
    // Set up a board where BLACK can capture the top-left corner
    gameState.board[0][1] = WHITE;
    gameState.board[0][2] = WHITE;
    gameState.board[0][3] = WHITE;
    gameState.board[0][4] = BLACK;
    
    // Make the move at (0,0)
    makeMove(gameState.board, 0, 0, BLACK);
    
    // Assert that the corner and the line are flipped
    assertEqual(gameState.board[0][0], BLACK, 'Corner at (0,0) should be BLACK');
    assertEqual(gameState.board[0][1], BLACK, 'Disc at (0,1) should be flipped to BLACK');
    assertEqual(gameState.board[0][2], BLACK, 'Disc at (0,2) should be flipped to BLACK');
    assertEqual(gameState.board[0][3], BLACK, 'Disc at (0,3) should be flipped to BLACK');
    assertEqual(gameState.board[0][4], BLACK, 'Disc at (0,4) should remain BLACK');
});

// Test edge case: no valid moves for both players
TestFramework.addTest(advancedBoardSuite, 'Game should detect when neither player has valid moves', function() {
    // Create a board with no valid moves for either player
    // Fill most of the board, leaving only isolated empty cells
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            // Fill with BLACK and WHITE in a pattern that prevents valid moves
            gameState.board[i][j] = (i < 4) ? BLACK : WHITE;
        }
    }
    
    // Leave a few isolated empty cells that don't create valid moves
    gameState.board[3][7] = EMPTY;  // Surrounded by BLACK
    gameState.board[4][0] = EMPTY;  // Surrounded by WHITE
    
    // Assert that there are no valid moves for either player
    const blackMoves = getValidMoves(gameState.board, BLACK);
    const whiteMoves = getValidMoves(gameState.board, WHITE);
    
    assertEqual(blackMoves.length, 0, 'BLACK should have no valid moves');
    assertEqual(whiteMoves.length, 0, 'WHITE should have no valid moves');
    
    // Check game state
    checkGameState();
    
    // Assert that the game is detected as over
    assertTrue(gameState.isGameOver, 'Game should be over when neither player has valid moves');
});

// Test counting flips in complex scenarios
TestFramework.addTest(advancedBoardSuite, 'countFlips should correctly count flips in complex scenarios', function() {
    // Set up a board with multiple flip opportunities in different directions
    gameState.board[1][1] = WHITE;
    gameState.board[1][2] = WHITE;
    gameState.board[1][3] = BLACK;
    
    gameState.board[2][1] = WHITE;
    gameState.board[2][2] = WHITE;
    gameState.board[2][3] = WHITE;
    gameState.board[2][4] = BLACK;
    
    gameState.board[3][1] = WHITE;
    gameState.board[3][2] = WHITE;
    gameState.board[3][3] = WHITE;
    gameState.board[3][4] = WHITE;
    gameState.board[3][5] = BLACK;
    
    gameState.board[4][2] = BLACK;
    gameState.board[4][4] = WHITE;
    gameState.board[5][3] = BLACK;
    gameState.board[5][5] = BLACK; // Add BLACK disc to make diagonal flip valid
    
    // Count flips for a move at (0,0) by BLACK
    const flipsAt0_0 = countFlips(gameState.board, 0, 0, BLACK);
    
    // The move should flip discs in two directions: diagonal and horizontal
    // Diagonal: (1,1), (2,2), (3,3), (4,4) = 4 flips
    // Horizontal: none (no line to an existing BLACK)
    // Vertical: none (no line to an existing BLACK)
    assertEqual(flipsAt0_0, 4, 'Move at (0,0) should flip 4 discs');
    
    // Count flips for a move at (0,4) by BLACK
    const flipsAt0_4 = countFlips(gameState.board, 0, 4, BLACK);
    
    // This shouldn't be a valid move (no opponent discs to flip)
    assertEqual(flipsAt0_4, 0, 'Move at (0,4) should flip 0 discs (invalid move)');
});

// Test board state after a full game simulation
TestFramework.addTest(advancedBoardSuite, 'Board should maintain consistency throughout a simulated game', function() {
    // Define a sequence of valid moves for a mini-game simulation
    const moves = [
        { player: BLACK, row: 2, col: 3 },  // Valid opening move
        { player: WHITE, row: 2, col: 2 },  // Valid response
        { player: BLACK, row: 3, col: 2 },  // Valid move
        { player: WHITE, row: 4, col: 2 },  // Valid move
        { player: BLACK, row: 5, col: 3 },  // Valid move
    ];
    
    // Execute the moves
    moves.forEach(move => {
        // Check that the move is valid before making it
        assertTrue(isValidMove(gameState.board, move.row, move.col, move.player), 
            `Move at (${move.row},${move.col}) should be valid for player ${move.player}`);
            
        makeMove(gameState.board, move.row, move.col, move.player);
    });
    
    // Count discs of each color after the simulation
    const counts = gameState.board.flat().reduce((acc, cell) => {
        if (cell === BLACK) acc.black++;
        else if (cell === WHITE) acc.white++;
        return acc;
    }, { black: 0, white: 0, empty: 0 });
    
    counts.empty = BOARD_SIZE * BOARD_SIZE - counts.black - counts.white;
    
    // Assert that we have a valid board state
    assertEqual(counts.black + counts.white + counts.empty, BOARD_SIZE * BOARD_SIZE, 
        'Total cell count should equal board size squared');
});