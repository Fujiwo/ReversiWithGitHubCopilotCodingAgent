/**
 * Tests for Reversi UI interactions
 */

// Create a test suite for UI interactions
const uiSuite = TestFramework.createSuite('UI Interaction Tests');

// Set up environment before each test
TestFramework.beforeEach(uiSuite, function() {
    // Reset the game state before each test
    initTestEnvironment();
    
    // Create a temporary game board for UI testing
    if (!document.getElementById('test-game-board')) {
        const gameBoard = document.createElement('div');
        gameBoard.id = 'test-game-board';
        document.body.appendChild(gameBoard);
    }
    
    // Create status message element if it doesn't exist
    if (!document.getElementById('status-message')) {
        const statusMessage = document.createElement('div');
        statusMessage.id = 'status-message';
        document.body.appendChild(statusMessage);
        DOM.statusMessage = statusMessage;
    }
});

// Clean up after each test
TestFramework.afterEach(uiSuite, function() {
    // Remove temporary UI elements
    const gameBoard = document.getElementById('test-game-board');
    if (gameBoard) {
        document.body.removeChild(gameBoard);
    }
    
    const statusMessage = document.getElementById('status-message');
    if (statusMessage && !statusMessage.classList.contains('status-message')) {
        document.body.removeChild(statusMessage);
    }
});

// Test cell click handling
TestFramework.addTest(uiSuite, 'handleCellClick should update the board when a valid move is clicked', function() {
    // Mock DOM elements
    const originalGameBoard = DOM.gameBoard;
    DOM.gameBoard = document.getElementById('test-game-board');
    
    try {
        // Set up the game state
        gameState.currentPlayer = BLACK;
        gameState.playerDisc = BLACK;
        
        // Create a spy for the makeMove function
        let moveMade = false;
        let moveRow = -1;
        let moveCol = -1;
        const originalMakeMove = makeMove;
        
        makeMove = function(board, row, col, player) {
            moveMade = true;
            moveRow = row;
            moveCol = col;
            // Call the original to actually update the board
            originalMakeMove(board, row, col, player);
        };
        
        // Mock renderBoard and checkGameState to avoid DOM manipulation
        const originalRenderBoard = renderBoard;
        const originalCheckGameState = checkGameState;
        const originalUpdateScores = updateScores;
        
        renderBoard = function() {};
        checkGameState = function() {};
        updateScores = function() {};
        
        try {
            // Simulate a click on a valid move position
            handleCellClick(2, 3); // This is a valid move for BLACK in the initial state
            
            // Assert the move was made
            assertTrue(moveMade, 'makeMove should be called when a valid move is clicked');
            assertEqual(moveRow, 2, 'makeMove should be called with the correct row');
            assertEqual(moveCol, 3, 'makeMove should be called with the correct column');
            assertEqual(gameState.board[2][3], BLACK, 'The board should be updated with the new move');
        } finally {
            // Restore original functions
            makeMove = originalMakeMove;
            renderBoard = originalRenderBoard;
            checkGameState = originalCheckGameState;
            updateScores = originalUpdateScores;
        }
    } finally {
        // Restore original DOM element
        DOM.gameBoard = originalGameBoard;
    }
});

// Test invalid cell click handling
TestFramework.addTest(uiSuite, 'handleCellClick should not update the board when an invalid move is clicked', function() {
    // Mock DOM elements
    const originalGameBoard = DOM.gameBoard;
    DOM.gameBoard = document.getElementById('test-game-board');
    
    try {
        // Set up the game state
        gameState.currentPlayer = BLACK;
        gameState.playerDisc = BLACK;
        
        // Create a spy for the makeMove function
        let moveMade = false;
        const originalMakeMove = makeMove;
        
        makeMove = function(board, row, col, player) {
            moveMade = true;
            // Don't actually make the move for this test
        };
        
        // Mock renderBoard and checkGameState to avoid DOM manipulation
        const originalRenderBoard = renderBoard;
        const originalCheckGameState = checkGameState;
        const originalUpdateScores = updateScores;
        
        renderBoard = function() {};
        checkGameState = function() {};
        updateScores = function() {};
        
        try {
            // Save the original board state
            const boardBefore = JSON.parse(JSON.stringify(gameState.board));
            
            // Simulate a click on an invalid move position
            handleCellClick(0, 0); // This is not a valid move for BLACK in the initial state
            
            // Assert no move was made
            assertFalse(moveMade, 'makeMove should not be called when an invalid move is clicked');
            
            // Assert the board is unchanged
            const boardAfter = JSON.stringify(gameState.board);
            assertEqual(JSON.stringify(boardBefore), boardAfter, 'The board should not change when an invalid move is clicked');
        } finally {
            // Restore original functions
            makeMove = originalMakeMove;
            renderBoard = originalRenderBoard;
            checkGameState = originalCheckGameState;
            updateScores = originalUpdateScores;
        }
    } finally {
        // Restore original DOM element
        DOM.gameBoard = originalGameBoard;
    }
});

// Test that computer move is triggered after player move
TestFramework.addTest(uiSuite, 'Computer should make a move after player makes a valid move', function() {
    // Mock DOM elements
    const originalGameBoard = DOM.gameBoard;
    DOM.gameBoard = document.getElementById('test-game-board');
    
    try {
        // Set up the game state
        gameState.currentPlayer = BLACK;
        gameState.playerDisc = BLACK;
        gameState.computerDisc = WHITE;
        
        // Create a spy for the makeComputerMove function
        let computerMoveCalled = false;
        const originalMakeComputerMove = makeComputerMove;
        
        makeComputerMove = function() {
            computerMoveCalled = true;
        };
        
        // Mock other functions to avoid DOM manipulation
        const originalRenderBoard = renderBoard;
        const originalUpdateScores = updateScores;
        const originalCheckGameState = checkGameState;
        const originalSetTimeout = setTimeout;
        
        renderBoard = function() {};
        updateScores = function() {};
        
        // Mock setTimeout to execute immediately
        window.setTimeout = function(callback) {
            callback();
        };
        
        // Replace checkGameState with one that keeps computer as current player
        checkGameState = function() {
            // Keep computer as current player (simulating computer has valid moves)
            gameState.currentPlayer = WHITE;
        };
        
        try {
            // Simulate a click on a valid move position
            handleCellClick(2, 3); // This is a valid move for BLACK in the initial state
            
            // Assert that computer move was triggered
            assertTrue(computerMoveCalled, 'makeComputerMove should be called after player makes a valid move');
        } finally {
            // Restore original functions
            makeComputerMove = originalMakeComputerMove;
            renderBoard = originalRenderBoard;
            updateScores = originalUpdateScores;
            checkGameState = originalCheckGameState;
            window.setTimeout = originalSetTimeout;
        }
    } finally {
        // Restore original DOM element
        DOM.gameBoard = originalGameBoard;
    }
});