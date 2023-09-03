const babel = require('@babel/core');
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;

// Function to convert a for loop to a map operation and return the transformed code
function convertForLoopToMap(inputCode) {
    let result;

    // Parse the input code
    const ast = parser.parse(inputCode, {
        sourceType: 'module', // or 'script' depending on your code
    });

    let loopStart, loopEnd;

    // Visitor to identify the loop range and body
    const loopVisitor = {
        ForStatement(path) {
            console.log('Found a for loop');

            // Extract loop start from the loop initialization
            const loopInit = path.node.init;
            let loopBody = path.node.body;

            // Check if loop body is a block statement
            if (loopBody.type === 'BlockStatement') {
                // Extract and concatenate individual statements in the block
                loopBody = loopBody.body.map(statement => generate(statement).code).join('\n');
            }

            if (
                loopInit &&
                loopInit.type === 'VariableDeclaration' &&
                loopInit.declarations.length === 1 &&
                loopInit.declarations[0].id.type === 'Identifier'
            ) {
                // Extract the loop start value
                loopStart = loopInit.declarations[0].init.value;
            }

            // Extract loop end from the loop condition
            const loopCondition = path.node.test;

            if (
                loopCondition &&
                loopCondition.type === 'BinaryExpression' &&
                loopCondition.left.type === 'Identifier'
            ) {
                // Extract the loop end value
                const loopEndExpression = loopCondition.right.value;

                // Generate a new AST for the equivalent map operation
                const mapExpression = `
                    Array.from({ length: ${loopEndExpression} - ${loopStart}}, (_, ${loopCondition.left.name}) => {
                        ${loopBody}
                    });
                `;

                result = mapExpression;
            }
        },
    };

    // Traverse the AST with the loopVisitor
    babel.traverse(ast, loopVisitor);

    return result;
}

// Input code to analyze
const inputCode = `
for (let i = 0; i < 5; i++) {
    console.log(i);
}
`;

// Convert the input code and get the transformed code
const transformedCode = convertForLoopToMap(inputCode);

console.log('Transformed Code:');
console.log(transformedCode);
