// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "copy-relative-path" is now active');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('copy-relative-path.copyPath', async function () {
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;
		
		if (editor) {
			const document = editor.document;
			const workspaceFolders = vscode.workspace.workspaceFolders;

			if (!workspaceFolders) {
				vscode.window.showErrorMessage('No workspace folder open');
				return;
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const filePath = document.uri.fsPath;
			
			// Get relative path
			let relativePath = path.relative(workspaceRoot, filePath);
			
			// Convert path separators to dots
			relativePath = relativePath.replace(/[\\/]/g, '.');
			
			// Remove file extension
			relativePath = relativePath.replace(/\.[^/.]+$/, '');

			// Get current symbol at cursor position
			const position = editor.selection.active;
			const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
			
			if (symbols) {
				const currentSymbol = findSymbolAtPosition(symbols, position);
				if (currentSymbol) {
					// Append the symbol name to the path
					relativePath = `${relativePath}.${currentSymbol.name}`;
					
					// Add line number if cursor is inside function body but not on function definition
					if (currentSymbol.selectionRange.start.line !== position.line) {
						relativePath = `${relativePath}:${position.line + 1}`;
					}
				}
			}

			// Copy to clipboard
			vscode.env.clipboard.writeText(relativePath).then(() => {
				vscode.window.showInformationMessage(`Copied: ${relativePath}`);
			});
		} else {
			vscode.window.showErrorMessage('No active editor');
		}
	});

	context.subscriptions.push(disposable);
}

/**
 * Find the innermost symbol at the given position
 * @param {vscode.DocumentSymbol[]} symbols
 * @param {vscode.Position} position
 * @returns {vscode.DocumentSymbol | null}
 */
function findSymbolAtPosition(symbols, position) {
	for (const symbol of symbols) {
		if (symbol.range.contains(position)) {
			// Check children first to get the most specific symbol
			if (symbol.children) {
				const childSymbol = findSymbolAtPosition(symbol.children, position);
				if (childSymbol) {
					return childSymbol;
				}
			}
			// Only include certain types of symbols
			if (symbol.kind === vscode.SymbolKind.Function || 
				symbol.kind === vscode.SymbolKind.Method ||
				symbol.kind === vscode.SymbolKind.Class ||
				symbol.kind === vscode.SymbolKind.Interface) {
				return symbol;
			}
		}
	}
	return null;
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
