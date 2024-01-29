const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const apiKey = "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";

const openai = new OpenAI({
    apiKey
});

function activate(context) {
    console.log('Congratulations, your extension "codeformatter" is now active!');

    let disposable = vscode.commands.registerCommand('codeformatter.generateDocumentation', async function () {
        // Get the workspace folders
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folders.');
            return;
        }

        // Generate documentation for all JS files in all workspace folders
        for (const workspaceFolder of workspaceFolders) {
            const folderPath = workspaceFolder.uri.fsPath;
            await generateDocumentation(folderPath);
        }

        vscode.window.showInformationMessage('Generated documentation for all JS files!');
    });

    context.subscriptions.push(disposable);
}

async function generateDocumentation(folderPath) {
    // Read all files and directories in the folder
    const items = fs.readdirSync(folderPath);

    for (const item of items) {
        const itemPath = path.join(folderPath, item);

        // Skip processing node_modules folder
        if (item === 'node_modules' || item.startsWith('.')) {
            continue;
        }

        try {
            // Check if it's a directory
            if (fs.statSync(itemPath).isDirectory()) {
                // Recursively call generateDocumentation for nested folders
                await generateDocumentation(itemPath);
            } else if (fs.statSync(itemPath).isFile() && (path.extname(itemPath) === '.js' || path.extname(itemPath) === '.jsx')) {
                // Read the content of the JS file
                const fileContent = fs.readFileSync(itemPath, 'utf-8');

                // Get information from ChatGPT
                const response = await getChatGPTResponse(fileContent);

                // Create a corresponding text file with ChatGPT response
                const documentationFileName = path.basename(item, path.extname(item)) + '_documentation.txt';
                const documentationFilePath = path.join(folderPath, documentationFileName);
                fs.writeFileSync(documentationFilePath, response);

                vscode.window.showInformationMessage(`Generated documentation for ${item}`);
            }
        } catch (error) {
            console.error(`Error processing ${item}: ${error.message}`);
        }
    }
}

async function getChatGPTResponse(input) {
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: input }],
            model: "gpt-3.5-turbo",
        });
        console.log(completion);
        return  completion.choices[0].message.content.trim();
    } catch (error) {
        console.error(`Error with ChatGPT API request: ${error.message}`);
        return 'Please upgrade the API key or give only 3 requests per minute';
    }
}

module.exports = {
    activate
};
