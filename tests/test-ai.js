/**
 * Tests for Reversi AI strategies
 */

// Create a test suite for AI operations
const aiSuite = TestFramework.createSuite('AI Strategy Tests');

// Set up a fresh board before each test
TestFramework.beforeEach(aiSuite, function() {
    // Reset the game state before each test
    initTestEnvironment();
});

// Test easy AI move selection
TestFramework.addTest(aiSuite, 'makeEasyMove should return a valid move from the available moves', function() {
    // Get valid moves for WHITE
    const validMoves = getValidMoves(gameState.board, WHITE);
    
    // Mock Math.random to return a predictable value (0.5)
    const originalRandom = Math.random;
    Math.random = () => 0.5;
    
    try {
        // Get easy move
        const move = makeEasyMove(validMoves);
        
        // Check that the returned move is included in valid moves
        assertTrue(validMoves.some(([row, col]) => row === move[0] && col === move[1]), 
            'Easy AI should return a move from the valid moves list');
    } finally {
        // Restore original Math.random
        Math.random = originalRandom;
    }
});

// Test medium AI move selection
TestFramework.addTest(aiSuite, 'makeMediumMove should prioritize corners and edges', function() {
    // Create a board with more strategic options
    const testBoard = Array.from({ length: BOARD_SIZE }, 
        () => Array(BOARD_SIZE).fill(EMPTY));
    
    // Set up some pieces to create multiple valid moves including a corner
    testBoard[3][3] = BLACK;
    testBoard[3][4] = BLACK;
    testBoard[3][5] = BLACK;
    testBoard[4][3] = BLACK;
    testBoard[5][3] = BLACK;
    testBoard[4][4] = WHITE;
    testBoard[5][5] = BLACK;
    
    // Set up the board to make the corner (0, 0) a valid move for WHITE
    // We place BLACK discs in a diagonal line and a WHITE disc at the end
    testBoard[1][1] = BLACK;
    testBoard[2][2] = BLACK;
    testBoard[3][3] = WHITE;
    
    // Get valid moves for WHITE
    const validMoves = getValidMoves(testBoard, WHITE);
    
    // Check that a corner is valid
    assertTrue(validMoves.some(([row, col]) => row === 0 && col === 0), 
        'Corner (0, 0) should be a valid move for WHITE');
    
    // Get medium move
    const move = makeMediumMove(validMoves);
    
    // Medium AI should pick the corner
    assertEqual(move[0], 0, 'Medium AI should choose row 0 (corner)');
    assertEqual(move[1], 0, 'Medium AI should choose column 0 (corner)');
});

// Test hard AI move evaluation
TestFramework.addTest(aiSuite, 'evaluatePosition should rate corners highly', function() {
    // Test corner values
    const cornerScore = evaluatePosition(0, 0);
    assertTrue(cornerScore > 0, 'Corner positions should have positive scores');
    
    // Test positions next to corners
    const adjacentToCornerScore = evaluatePosition(0, 1);
    assertTrue(adjacentToCornerScore < 0, 'Positions adjacent to corners should have negative scores');
    
    // Test center positions
    const centerScore = evaluatePosition(3, 3);
    assertTrue(centerScore >= 0, 'Center positions should have non-negative scores');
});

// Test that hard AI makes strategic moves
TestFramework.addTest(aiSuite, 'makeHardMove should prefer corners when available', function() {
    // Create a board with a corner as a valid move
    const testBoard = Array.from({ length: BOARD_SIZE }, 
        () => Array(BOARD_SIZE).fill(EMPTY));
    
    // Set up pieces to make a corner a valid move
    // We place BLACK discs in a diagonal line and a WHITE disc at the end
    testBoard[1][1] = BLACK;
    testBoard[2][2] = BLACK;
    testBoard[3][3] = WHITE;
    
    // Get valid moves for WHITE
    const validMoves = getValidMoves(testBoard, WHITE);
    
    // Store the original board and temporarily replace it
    const originalBoard = gameState.board;
    gameState.board = testBoard;
    
    try {
        // Get hard move
        const move = makeHardMove(validMoves);
        
        // Hard AI should pick the corner
        assertEqual(move[0], 0, 'Hard AI should choose row 0 (corner)');
        assertEqual(move[1], 0, 'Hard AI should choose column 0 (corner)');
    } finally {
        // Restore the original board
        gameState.board = originalBoard;
    }
});

// Test that the different AI levels return different moves when appropriate
TestFramework.addTest(aiSuite, 'Different AI levels should make different decisions in complex positions', function() {
    // Create a more complex board state
    const testBoard = Array.from({ length: BOARD_SIZE }, 
        () => Array(BOARD_SIZE).fill(EMPTY));
    
    // Set up a complex position with multiple valid moves of different quality
    testBoard[2][2] = BLACK;
    testBoard[2][3] = BLACK;
    testBoard[2][4] = BLACK;
    testBoard[3][2] = WHITE;
    testBoard[3][3] = WHITE;
    testBoard[3][4] = WHITE;
    testBoard[4][2] = BLACK;
    testBoard[4][3] = BLACK;
    testBoard[4][4] = WHITE;
    testBoard[5][5] = BLACK;
    
    // Add a piece to make a corner available
    testBoard[1][1] = BLACK;
    testBoard[0][1] = WHITE;
    testBoard[1][0] = WHITE;
    
    // Get valid moves for WHITE
    const validMoves = getValidMoves(testBoard, WHITE);
    
    // Make sure we have enough valid moves to test
    assertTrue(validMoves.length >= 3, 'Should have at least 3 valid moves for this test');
    
    // Store the original board and temporarily replace it
    const originalBoard = gameState.board;
    gameState.board = testBoard;
    
    try {
        // Get moves from each strategy
        // Use the same validMoves list for all to ensure fair comparison
        const easyMove = makeEasyMove(validMoves);
        const mediumMove = makeMediumMove(validMoves);
        const hardMove = makeHardMove(validMoves);
        
        // At least one pair of strategies should make different moves
        const movesAreDifferent = 
            (easyMove[0] !== mediumMove[0] || easyMove[1] !== mediumMove[1]) ||
            (easyMove[0] !== hardMove[0] || easyMove[1] !== hardMove[1]) ||
            (mediumMove[0] !== hardMove[0] || mediumMove[1] !== hardMove[1]);
        
        assertTrue(movesAreDifferent, 'Different AI levels should make different moves when appropriate');
    } finally {
        // Restore the original board
        gameState.board = originalBoard;
    }
});