/**
 * Tests for Reversi board initialization and state management
 */

// Create a test suite for board operations
const boardSuite = TestFramework.createSuite('Board Tests');

// Set up a fresh board before each test
TestFramework.beforeEach(boardSuite, function() {
    // Reset the game state before each test
    initTestEnvironment();
});

// Test board initialization
TestFramework.addTest(boardSuite, 'Board should initialize with correct starting positions', function() {
    // Create the expected initial board
    const expectedBoard = Array.from({ length: BOARD_SIZE }, 
        () => Array(BOARD_SIZE).fill(EMPTY));
    
    const mid = BOARD_SIZE / 2;
    expectedBoard[mid - 1][mid - 1] = WHITE;
    expectedBoard[mid - 1][mid] = BLACK;
    expectedBoard[mid][mid - 1] = BLACK;
    expectedBoard[mid][mid] = WHITE;
    
    // Assert the initial board matches the expected state
    assertBoardEqual(gameState.board, expectedBoard);
});

// Test disc counting
TestFramework.addTest(boardSuite, 'Should correctly count discs on the board', function() {
    // Count discs using the same approach as updateScores function
    const counts = gameState.board.flat().reduce((acc, cell) => {
        if (cell === BLACK) acc.black++;
        else if (cell === WHITE) acc.white++;
        return acc;
    }, { black: 0, white: 0 });
    
    // Assert the counts are correct for initial board
    assertEqual(counts.black, 2, 'Initial board should have 2 black discs');
    assertEqual(counts.white, 2, 'Initial board should have 2 white discs');
});

// Test board boundaries
TestFramework.addTest(boardSuite, 'isInBounds should correctly identify valid coordinates', function() {
    // Test valid coordinates
    assertTrue(isInBounds(0, 0), 'Top-left corner should be in bounds');
    assertTrue(isInBounds(7, 7), 'Bottom-right corner should be in bounds');
    assertTrue(isInBounds(3, 4), 'Middle position should be in bounds');
    
    // Test invalid coordinates
    assertFalse(isInBounds(-1, 0), 'Negative row should be out of bounds');
    assertFalse(isInBounds(0, -1), 'Negative column should be out of bounds');
    assertFalse(isInBounds(8, 7), 'Row beyond board size should be out of bounds');
    assertFalse(isInBounds(7, 8), 'Column beyond board size should be out of bounds');
});

// Test board dimensions
TestFramework.addTest(boardSuite, 'Board should have correct dimensions', function() {
    // Check board row count
    assertEqual(gameState.board.length, BOARD_SIZE, 'Board should have BOARD_SIZE rows');
    
    // Check each row's column count
    for (let i = 0; i < BOARD_SIZE; i++) {
        assertEqual(gameState.board[i].length, BOARD_SIZE, `Row ${i} should have BOARD_SIZE columns`);
    }
});