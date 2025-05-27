/**
 * Tests for Reversi move validation and execution
 */

// Create a test suite for move operations
const moveSuite = TestFramework.createSuite('Move Tests');

// Set up a fresh board before each test
TestFramework.beforeEach(moveSuite, function() {
    // We need to create a test-specific copy of the game state
    window.testGameState = {
        board: [],
        currentPlayer: BLACK,
        isGameOver: false,
        playerDisc: BLACK,
        computerDisc: WHITE,
        isComputerThinking: false
    };
    
    // Initialize the board for testing
    testGameState.board = Array.from({ length: BOARD_SIZE }, 
        () => Array(BOARD_SIZE).fill(EMPTY));
    
    // Set up starting positions
    const mid = BOARD_SIZE / 2;
    testGameState.board[mid - 1][mid - 1] = WHITE;
    testGameState.board[mid - 1][mid] = BLACK;
    testGameState.board[mid][mid - 1] = BLACK;
    testGameState.board[mid][mid] = WHITE;
});

// Test valid move detection
TestFramework.addTest(moveSuite, 'isValidMove should identify valid moves correctly', function() {
    // Valid moves for BLACK in initial board state
    assertTrue(isValidMove(testGameState.board, 2, 3, BLACK), 'Position (2, 3) should be valid for Black');
    assertTrue(isValidMove(testGameState.board, 3, 2, BLACK), 'Position (3, 2) should be valid for Black');
    assertTrue(isValidMove(testGameState.board, 4, 5, BLACK), 'Position (4, 5) should be valid for Black');
    assertTrue(isValidMove(testGameState.board, 5, 4, BLACK), 'Position (5, 4) should be valid for Black');
    
    // Invalid moves
    assertFalse(isValidMove(testGameState.board, 0, 0, BLACK), 'Corner (0, 0) should be invalid for Black');
    assertFalse(isValidMove(testGameState.board, 4, 4, BLACK), 'Occupied position should be invalid');
    assertFalse(isValidMove(testGameState.board, 2, 2, BLACK), 'Position (2, 2) should be invalid for Black');
});

// Test getting all valid moves
TestFramework.addTest(moveSuite, 'getValidMoves should return all valid moves', function() {
    const validMovesBlack = getValidMoves(testGameState.board, BLACK);
    
    // Check the length of valid moves for BLACK in initial state (should be 4)
    assertEqual(validMovesBlack.length, 4, 'BLACK should have 4 valid moves in initial state');
    
    // Check specific positions are included in valid moves
    assertTrue(validMovesBlack.some(([row, col]) => row === 2 && col === 3), 'Valid moves should include (2, 3)');
    assertTrue(validMovesBlack.some(([row, col]) => row === 3 && col === 2), 'Valid moves should include (3, 2)');
    assertTrue(validMovesBlack.some(([row, col]) => row === 4 && col === 5), 'Valid moves should include (4, 5)');
    assertTrue(validMovesBlack.some(([row, col]) => row === 5 && col === 4), 'Valid moves should include (5, 4)');
});

// Test making a move
TestFramework.addTest(moveSuite, 'makeMove should update the board correctly', function() {
    // Make a move for BLACK at position (2, 3)
    makeMove(testGameState.board, 2, 3, BLACK);
    
    // Check that the position has BLACK disc
    assertEqual(testGameState.board[2][3], BLACK, 'The moved position should have a BLACK disc');
    
    // Check that the appropriate disc is flipped
    assertEqual(testGameState.board[3][3], BLACK, 'The WHITE disc at (3, 3) should be flipped to BLACK');
    
    // Check that other positions are unchanged
    assertEqual(testGameState.board[3][4], WHITE, 'The WHITE disc at (3, 4) should remain unchanged');
});

// Test flip counting
TestFramework.addTest(moveSuite, 'countFlips should return the correct number of flips', function() {
    // Check flips for BLACK at position (2, 3)
    const flipsAt2_3 = countFlips(testGameState.board, 2, 3, BLACK);
    assertEqual(flipsAt2_3, 1, 'Move at (2, 3) should flip 1 disc');
    
    // Check flips for BLACK at position (5, 4)
    const flipsAt5_4 = countFlips(testGameState.board, 5, 4, BLACK);
    assertEqual(flipsAt5_4, 1, 'Move at (5, 4) should flip 1 disc');
});

// Test move sequence
TestFramework.addTest(moveSuite, 'A sequence of moves should update the board correctly', function() {
    // First move: BLACK at (2, 3)
    makeMove(testGameState.board, 2, 3, BLACK);
    
    // Second move: WHITE at (2, 2)
    makeMove(testGameState.board, 2, 2, WHITE);
    
    // Third move: BLACK at (1, 2)
    makeMove(testGameState.board, 1, 2, BLACK);
    
    // Check the board state
    assertEqual(testGameState.board[2][3], BLACK, 'Position (2, 3) should have BLACK');
    assertEqual(testGameState.board[3][3], BLACK, 'Position (3, 3) should have BLACK (flipped)');
    assertEqual(testGameState.board[2][2], WHITE, 'Position (2, 2) should have WHITE');
    assertEqual(testGameState.board[1][2], BLACK, 'Position (1, 2) should have BLACK');
});