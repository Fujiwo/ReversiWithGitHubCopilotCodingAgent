/**
 * Tests for Reversi game state management
 */

// Create a test suite for game state operations
const gameStateSuite = TestFramework.createSuite('Game State Tests');

// Set up a fresh board before each test
TestFramework.beforeEach(gameStateSuite, function() {
    // Reset the game state before each test
    initTestEnvironment();
    
    // Create DOM elements mock for tests that interact with the UI
    if (!document.getElementById('status-message')) {
        const statusMessage = document.createElement('div');
        statusMessage.id = 'status-message';
        document.body.appendChild(statusMessage);
        DOM.statusMessage = statusMessage;
    }
    
    if (!document.getElementById('black-score')) {
        const blackScore = document.createElement('span');
        blackScore.id = 'black-score';
        blackScore.textContent = '2';
        document.body.appendChild(blackScore);
        DOM.blackScore = blackScore;
    }
    
    if (!document.getElementById('white-score')) {
        const whiteScore = document.createElement('span');
        whiteScore.id = 'white-score';
        whiteScore.textContent = '2';
        document.body.appendChild(whiteScore);
        DOM.whiteScore = whiteScore;
    }
});

// Clean up after each test
TestFramework.afterEach(gameStateSuite, function() {
    // Remove the DOM elements we created
    const statusMessage = document.getElementById('status-message');
    if (statusMessage && !statusMessage.classList.contains('status-message')) {
        document.body.removeChild(statusMessage);
    }
    
    const blackScore = document.getElementById('black-score');
    if (blackScore && blackScore.parentElement === document.body) {
        document.body.removeChild(blackScore);
    }
    
    const whiteScore = document.getElementById('white-score');
    if (whiteScore && whiteScore.parentElement === document.body) {
        document.body.removeChild(whiteScore);
    }
});

// Test game over detection
TestFramework.addTest(gameStateSuite, 'checkGameState should detect when game is over', function() {
    // Set up a board where neither player has valid moves
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            gameState.board[i][j] = (i + j) % 2 === 0 ? BLACK : WHITE;
        }
    }
    
    // Check game state
    checkGameState();
    
    // Assert that game is detected as over
    assertTrue(gameState.isGameOver, 'Game should be over when no valid moves exist');
});

// Test player turn switching when no moves available
TestFramework.addTest(gameStateSuite, 'checkGameState should switch turns when current player has no moves', function() {
    // Set up a board where BLACK has no valid moves but WHITE does
    // First fill most of the board with BLACK
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            gameState.board[i][j] = BLACK;
        }
    }
    
    // Create a pattern where WHITE has a valid move but BLACK doesn't
    gameState.board[0][0] = WHITE;
    gameState.board[0][1] = WHITE;
    gameState.board[0][2] = EMPTY; // WHITE can play here
    
    // Set current player to BLACK
    gameState.currentPlayer = BLACK;
    gameState.playerDisc = BLACK;
    gameState.computerDisc = WHITE;
    
    // Check game state
    checkGameState();
    
    // Assert that turn has switched to WHITE
    assertEqual(gameState.currentPlayer, WHITE, 'Turn should switch to WHITE when BLACK has no valid moves');
    assertFalse(gameState.isGameOver, 'Game should not be over when one player still has valid moves');
});

// Test score calculation
TestFramework.addTest(gameStateSuite, 'updateScores should calculate correct scores', function() {
    // Set up a board with known disc counts
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            gameState.board[i][j] = BLACK;
        }
    }
    
    for (let i = 3; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            gameState.board[i][j] = WHITE;
        }
    }
    
    // Update scores
    updateScores();
    
    // Assert correct score values in DOM
    assertEqual(DOM.blackScore.textContent, '9', 'Black score should be 9');
    assertEqual(DOM.whiteScore.textContent, '12', 'White score should be 12');
});

// Test status message updates
TestFramework.addTest(gameStateSuite, 'updateStatusMessage should show correct message based on game state', function() {
    // Test player's turn message
    gameState.isGameOver = false;
    gameState.isComputerThinking = false;
    gameState.currentPlayer = BLACK;
    gameState.playerDisc = BLACK;
    updateStatusMessage();
    assertEqual(DOM.statusMessage.textContent, 'Your turn', 'Should display "Your turn" when it is player\'s turn');
    
    // Test computer's turn message
    gameState.currentPlayer = WHITE;
    gameState.computerDisc = WHITE;
    updateStatusMessage();
    assertEqual(DOM.statusMessage.textContent, 'Computer\'s turn', 'Should display "Computer\'s turn" when it is computer\'s turn');
    
    // Test computer thinking message
    gameState.isComputerThinking = true;
    updateStatusMessage();
    assertEqual(DOM.statusMessage.textContent, 'Computer is thinking...', 'Should display "Computer is thinking..." when computer is making a move');
    
    // Test game over with black win
    gameState.isGameOver = true;
    DOM.blackScore.textContent = '40';
    DOM.whiteScore.textContent = '24';
    updateStatusMessage();
    assertEqual(DOM.statusMessage.textContent, 'Black wins!', 'Should display "Black wins!" when game is over and black has more discs');
    
    // Test game over with white win
    DOM.blackScore.textContent = '20';
    DOM.whiteScore.textContent = '44';
    updateStatusMessage();
    assertEqual(DOM.statusMessage.textContent, 'White wins!', 'Should display "White wins!" when game is over and white has more discs');
    
    // Test game over with tie
    DOM.blackScore.textContent = '32';
    DOM.whiteScore.textContent = '32';
    updateStatusMessage();
    assertEqual(DOM.statusMessage.textContent, 'It\'s a tie!', 'Should display "It\'s a tie!" when game is over with equal discs');
});

// Test restart game functionality
TestFramework.addTest(gameStateSuite, 'restartGame should reset the game state', function() {
    // First, modify the game state
    gameState.board[0][0] = BLACK;
    gameState.currentPlayer = WHITE;
    gameState.isGameOver = true;
    
    // Call restartGame but prevent UI updates
    const originalRenderBoard = renderBoard;
    const originalUpdateScores = updateScores;
    
    renderBoard = function() {}; // Mock
    updateScores = function() {}; // Mock
    
    try {
        // Restart the game
        restartGame();
        
        // Check that board has been reset to initial state
        const mid = BOARD_SIZE / 2;
        assertEqual(gameState.board[mid-1][mid-1], WHITE, 'Board should be reset to initial state');
        assertEqual(gameState.board[mid-1][mid], BLACK, 'Board should be reset to initial state');
        assertEqual(gameState.board[mid][mid-1], BLACK, 'Board should be reset to initial state');
        assertEqual(gameState.board[mid][mid], WHITE, 'Board should be reset to initial state');
        assertEqual(gameState.board[0][0], EMPTY, 'Board should be reset to initial state');
        
        // Check that game state has been reset
        assertEqual(gameState.currentPlayer, BLACK, 'Current player should be reset to BLACK');
        assertFalse(gameState.isGameOver, 'Game over flag should be reset to false');
    } finally {
        // Restore original functions
        renderBoard = originalRenderBoard;
        updateScores = originalUpdateScores;
    }
});