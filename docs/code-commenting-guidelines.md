# Code Commenting Best Practices Guidelines

## Core Principles (Clean Code & Node.js Best Practices)

### What to Comment
1. **Complex Business Logic** - Explain WHY, not WHAT
2. **Non-obvious Algorithms** - Document the approach and reasoning
3. **API Contracts** - Parameters, return values, exceptions
4. **Edge Cases & Gotchas** - Warn about potential pitfalls
5. **Dependencies & Assumptions** - External requirements

### What NOT to Comment
1. **Obvious Operations** - Self-explanatory code
2. **Journal Entries** - Change history (use git instead)
3. **Commented-Out Code** - Delete it, use version control
4. **Positional Markers** - Avoid `//////////////////`
5. **Redundant Descriptions** - Code that explains itself

## Language-Specific Standards

### JavaScript/TypeScript (Google Style Guide)
- **JSDoc Format**: Use `/** */` for documentation
- **Function Documentation**: `@param {type} name Description` 
- **Class Documentation**: Include `@implements`, `@extends`
- **Type Annotations**: Explicit nullability `?` or `!`
- **Return Types**: Always document with `@return {type}`

### Python
- **Docstrings**: Triple quotes for module/class/function docs
- **PEP 257**: One-line summary + detailed explanation
- **Type Hints**: Use annotations where helpful

### Java
- **Javadoc**: Complete API documentation
- **Parameters**: `@param name description`
- **Exceptions**: `@throws ExceptionType condition`

### C/C++
- **Doxygen**: Structured documentation format
- **Header Comments**: Function contracts in headers
- **Implementation**: Focus on algorithm details

## Comment Quality Guidelines

### Good Comments
```javascript
/**
 * Calculates compound interest using the formula A = P(1 + r/n)^(nt)
 * @param {number} principal - Initial investment amount
 * @param {number} rate - Annual interest rate (as decimal, e.g., 0.05 for 5%)
 * @param {number} compoundingFrequency - Times per year interest compounds
 * @param {number} years - Investment duration in years
 * @return {number} Final amount after compound interest
 * @throws {Error} If any parameter is negative
 */
function calculateCompoundInterest(principal, rate, compoundingFrequency, years) {
    if (principal < 0 || rate < 0 || compoundingFrequency < 0 || years < 0) {
        throw new Error('All parameters must be non-negative');
    }
    
    // Handle edge case: no compounding
    if (compoundingFrequency === 0) {
        return principal * (1 + rate * years); // Simple interest
    }
    
    return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * years);
}
```

### Bad Comments
```javascript
// Bad: States the obvious
let i = 0; // Set i to 0

// Bad: Journal entry  
// 2024-01-15: Changed algorithm (JS)
// 2023-12-10: Fixed bug (AS)
function processData() { /* ... */ }

// Bad: Positional marker
////////////////////////////////////////////////////////////////////////////////
// USER VALIDATION SECTION
////////////////////////////////////////////////////////////////////////////////
```

## Documentation Standards

### Function/Method Comments
- Start with verb phrase describing the action
- Document all parameters with types and constraints
- Specify return value and type
- List possible exceptions/errors
- Include usage examples for complex functions

### Class Comments
- Describe purpose and responsibility
- Document key relationships and dependencies
- Include usage patterns
- Specify thread safety if relevant

### Variable Comments
- Explain purpose for non-obvious variables
- Document units, ranges, or constraints
- Clarify relationship to other variables

## Anti-Patterns to Avoid

1. **Misleading Comments** - Outdated information
2. **Noise Comments** - Redundant obvious statements
3. **Mandated Comments** - Required but useless docs
4. **Position Markers** - ASCII art separators
5. **Closing Brace Comments** - Indicating end of blocks
6. **Attributions** - Author/date info (use VCS)
7. **HTML in Comments** - Formatting markup
8. **Too Much Information** - Excessive detail
9. **Inobvious Connection** - Unclear code-comment relationship
10. **Function Headers** - Redundant signatures in comments

## Maintenance Guidelines

1. **Keep Comments Current** - Update with code changes
2. **Review During Code Review** - Check comment accuracy
3. **Delete Obsolete Comments** - Remove outdated information
4. **Refactor Instead of Comment** - Make code self-explanatory when possible
5. **Use Linters** - ESLint JSDoc rules, etc.

## Tools and Validation

- **ESLint**: `eslint-plugin-jsdoc` for JavaScript
- **Prettier**: Consistent formatting
- **TSDoc**: TypeScript documentation
- **Doxygen**: C/C++ documentation
- **Sphinx**: Python documentation
- **Javadoc**: Java API docs