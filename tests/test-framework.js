/**
 * Simple Test Framework for Reversi Game
 */

const TestFramework = {
    // Store test suites
    suites: [],
    
    // Test results
    passed: 0,
    failed: 0,
    totalTests: 0,
    
    // Create a new test suite
    createSuite: function(name) {
        const suite = {
            name: name,
            tests: [],
            beforeEach: null,
            afterEach: null
        };
        
        this.suites.push(suite);
        return suite;
    },
    
    // Add a test to a suite
    addTest: function(suite, description, testFn) {
        suite.tests.push({
            description: description,
            testFn: testFn
        });
    },
    
    // Set up a function to run before each test in a suite
    beforeEach: function(suite, fn) {
        suite.beforeEach = fn;
    },
    
    // Set up a function to run after each test in a suite
    afterEach: function(suite, fn) {
        suite.afterEach = fn;
    },
    
    // Run all tests
    runTests: function() {
        const results = document.getElementById('test-results');
        results.innerHTML = '';
        
        this.passed = 0;
        this.failed = 0;
        this.totalTests = 0;
        
        this.suites.forEach(suite => {
            const suiteElement = document.createElement('div');
            suiteElement.className = 'test-suite';
            
            const suiteTitle = document.createElement('h2');
            suiteTitle.textContent = suite.name;
            suiteElement.appendChild(suiteTitle);
            
            const testList = document.createElement('ul');
            
            // Run each test in the suite
            suite.tests.forEach(test => {
                this.totalTests++;
                const testItem = document.createElement('li');
                
                try {
                    // Run beforeEach if it exists
                    if (suite.beforeEach) {
                        suite.beforeEach();
                    }
                    
                    // Run the test
                    test.testFn();
                    
                    // Run afterEach if it exists
                    if (suite.afterEach) {
                        suite.afterEach();
                    }
                    
                    // Test passed
                    testItem.className = 'test-pass';
                    testItem.innerHTML = `✓ ${test.description}`;
                    this.passed++;
                } catch (error) {
                    // Test failed
                    testItem.className = 'test-fail';
                    testItem.innerHTML = `✗ ${test.description} <span class="error">${error.message}</span>`;
                    this.failed++;
                }
                
                testList.appendChild(testItem);
            });
            
            suiteElement.appendChild(testList);
            results.appendChild(suiteElement);
        });
        
        // Add summary
        const summary = document.createElement('div');
        summary.className = 'test-summary';
        const status = this.failed === 0 ? 'pass' : 'fail';
        summary.innerHTML = `
            <h3 class="${status}">Results: ${this.passed} passed, ${this.failed} failed (${this.totalTests} total)</h3>
        `;
        results.appendChild(summary);
    }
};

// Assertion functions
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
}

function assertDeepEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    
    if (actualStr !== expectedStr) {
        throw new Error(message || `Expected ${expectedStr}, but got ${actualStr}`);
    }
}

function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message || 'Expected true, but got false');
    }
}

function assertFalse(condition, message) {
    if (condition) {
        throw new Error(message || 'Expected false, but got true');
    }
}

// Helper to compare board positions
function assertBoardEqual(actual, expected, message) {
    // Convert to string representation for easier comparison
    const actualBoard = actual.map(row => row.join('')).join('\n');
    const expectedBoard = expected.map(row => row.join('')).join('\n');
    
    if (actualBoard !== expectedBoard) {
        throw new Error(message || `Board state doesn't match expected state:\nExpected:\n${expectedBoard}\n\nActual:\n${actualBoard}`);
    }
}