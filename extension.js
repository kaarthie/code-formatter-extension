const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const removeCommentsAndLogs = require('./utils/cleanCode.js');

const { expressBp, fastifyBp, expressPackageJson, fastifyPackageJson } = require('./utils/boilerPlateCodes.js')

const apiKey = "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";

const openai = new OpenAI({
    apiKey
});

var flag = 0; // For sending three requests per minute

// Extension Activate Function
function activate(context) {
    console.log('Congratulations, your extension is now active!');

    let backendStructureDisposable = vscode.commands.registerCommand('backend.createFolders', createBackendStructure);

    let documentationDisposable = vscode.commands.registerCommand('codeformatter.generateDocumentation', createDocumentation);

    let frontendStructureDisposable = vscode.commands.registerCommand('frontend.createFolders', createFrontendStructure);

    let removeCommentsAndLogsDisposable = vscode.commands.registerCommand('extension.removeCommentsAndLogs', removeCommentsAndLogsCommand);

    let removeEmptyFilesDisposable = vscode.commands.registerCommand('extension.removeEmptyFiles', removeEmptyFilesAndFoldersCommand);

    context.subscriptions.push(backendStructureDisposable, documentationDisposable, frontendStructureDisposable, removeCommentsAndLogsDisposable, removeEmptyFilesDisposable);
}

// Code Documentation Creation
async function generateDocumentation(folderPath, outputFolder) {
    // Create the 'documentation' folder if it doesn't exist
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }

    // Read all files and directories in the folder
    const items = fs.readdirSync(folderPath);

    for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const outputPath = path.join(outputFolder, item);

        // Skip processing node_modules folder
        if (item === 'node_modules' || item.startsWith('.') || item === 'documentation') {
            continue;
        }

        try {
            // Check if it's a directory
            if (fs.statSync(itemPath).isDirectory()) {
                // Recursively call generateDocumentation for nested folders
                await generateDocumentation(itemPath, path.join(outputFolder, item));
            } else if (fs.statSync(itemPath).isFile() && (path.extname(itemPath) === '.js' || path.extname(itemPath) === '.jsx')) {
                // Read the content of the JS file
                const fileContent = fs.readFileSync(itemPath, 'utf-8');

                // Get information from ChatGPT
                flag++;
                if (flag > 3) {
                    await new Promise(resolve => setTimeout(resolve, 60000));
                    flag = 1;
                    console.log(item.toString());
                }

                const response = await getChatGPTResponse(fileContent);
                const documentationFileName = path.basename(item, path.extname(item)) + '_documentation.txt';
                const documentationFilePath = path.join(outputFolder, documentationFileName);
                fs.writeFileSync(documentationFilePath, response);
                vscode.window.showInformationMessage(`Generated documentation for ${item}`);

            }
        } catch (error) {
            console.error(`Error processing ${item}: ${error.message}`);
        }
    }
}

async function createDocumentation() {
    // Get the workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folders.');
        return;
    }

    // Generate documentation for all JS files in all workspace folders
    for (const workspaceFolder of workspaceFolders) {
        const folderPath = workspaceFolder.uri.fsPath;
        const outputFolder = path.join(folderPath, 'documentation'); // Create a 'documentation' folder in each workspace folder
        await generateDocumentation(folderPath, outputFolder);
    }

    vscode.window.showInformationMessage('Generated documentation for all JS files!');
}

// Backend Folder Structure Creation
async function createBackendStructure() {
    const projectPath = vscode.workspace.rootPath;

    if (projectPath) {
        vscode.window.showInputBox({ prompt: 'Enter FrameWork (Default: Express):', placeHolder: 'fastify/express' })
            .then((data) => createFolders(projectPath, data.toLowerCase() || 'express'));
    } else {
        vscode.window.showWarningMessage('Please open a workspace to create folders.');
    }
}

// Frontend Folder Structure Creation
async function createFrontendStructure() {
    const projectPath = vscode.workspace.rootPath;

    if (projectPath) {
        createFolders2(projectPath);
    } else {
        vscode.window.showWarningMessage('Please open a react workspace to create folder structure.');
    }
}

// ChatGPT Model Request Function
async function getChatGPTResponse(input) {
    try {
        // Define the maximum token count allowed by the model
        const maxTokenCount = 4000;

        // Split the input into chunks based on the maximum token count
        const inputChunks = [];
        let currentChunk = "";
        for (const word of input.split(" ")) {
            const currentChunkLength = currentChunk.split(" ").length;
            if (currentChunkLength + 1 <= maxTokenCount) {
                currentChunk += word + " ";
            } else {
                inputChunks.push(currentChunk.trim());
                currentChunk = word + " ";
            }
        }
        if (currentChunk.trim() !== "") {
            inputChunks.push(currentChunk.trim());
        }

        // Create an array to store the completions
        const completions = [];

        // Process each input chunk and combine the completions
        for (const chunk of inputChunks) {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: chunk }],
                model: "gpt-3.5-turbo",
            });

            // Log the token count for each completion (optional)
            console.log('Token count for chunk:', completion.usage.total_tokens);

            // Store the completion content
            completions.push(completion.choices[0].message.content.trim());
        }

        // Combine all completions into a single response
        const combinedResponse = completions.join(" ");

        return combinedResponse;
    } catch (error) {
        console.error(`Error with ChatGPT API request: ${error.message}`);
        return 'Please upgrade the API key or give only 3 requests per minute';
    }
}

// Backend Folders Creation
function createFolders(rootPath, appFrameWork) {
    const foldersToCreate = [
        'src',
        'src/apis',
        'src/constants',
        'src/middleware',
        'src/dao',
        'src/config',
        'utils'
    ];

    // Creates folders as provided in the above array 

    foldersToCreate.forEach(folder => {
        const folderPath = path.join(rootPath, folder);
        if (!fs.existsSync(folderPath)) {
            if (path.extname(folder) !== '') {
                fs.writeFileSync(folderPath, '');
            } else {
                fs.mkdirSync(folderPath);
            }
        }
    });

    // .env creation

    fs.writeFileSync(path.join(rootPath, '.env'), 'SAMPLE_KEY=sample_value');

    // Creation of package.json file for express/fastify

    const packageJsonPath = path.join(rootPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        const defaultPackageJson = appFrameWork == 'fastify' ? fastifyPackageJson : expressPackageJson;
        fs.writeFileSync(packageJsonPath, JSON.stringify(defaultPackageJson, null, 2));
    }

    // Appending Boiler Plate code for express/fastify in app.js

    const appJsPath = path.join(rootPath, 'src/app.js');
    if (!fs.existsSync(appJsPath)) {
        const appJsCode = appFrameWork == 'fastify' ? fastifyBp : expressBp;
        fs.writeFileSync(appJsPath, appJsCode);
    }

    vscode.window.showInformationMessage('Folders Structure Created🎉. Install packages using "npm install" and start the server using "npm start"');
}

// Frontend Folders Creation
function createFolders2(rootPath) {
    const srcPath = path.join(rootPath, 'src');
    const publicPath = path.join(rootPath, 'public');
    const foldersToCreate = ['components', 'utils', 'pages', 'pages/home', 'services', 'context'];
    const assetsPath = path.join(publicPath, 'assets');

    if (!fs.existsSync(srcPath)) {
        vscode.window.showWarningMessage('Source folder not found. Please make sure your project structure is correct.');
        return;
    }

    if (!fs.existsSync(publicPath)) {
        vscode.window.showWarningMessage('Public folder not found. Please make sure your project structure is correct.');
        return;
    }

    // Create folders within src
    foldersToCreate.forEach(folder => {
        const folderPath = path.join(srcPath, folder);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
    });

    // Create assets folder within public
    if (!fs.existsSync(assetsPath)) {
        fs.mkdirSync(assetsPath);
    }

    vscode.window.showInformationMessage('Folder Structure created successfully 🎉', 5000);
}

// Process file for finding comments and log statements
function processFile(filePath) {
    // Read the file content
    let fileContent = fs.readFileSync(filePath, 'utf-8');

    // Apply the removeCommentsAndLogs function
    fileContent = removeCommentsAndLogs(fileContent);

    // Write the modified content back to the file
    fs.writeFileSync(filePath, fileContent, 'utf-8');
}

// Removes empty files and folders
function removeEmptyFilesAndFolders(dirPath) {
    const entries = fs.readdirSync(dirPath);

    entries.forEach(entry => {
        const entryPath = path.join(dirPath, entry);
        const stat = fs.statSync(entryPath);

        if (stat.isDirectory()) {
            // Recursively remove empty subdirectories
            removeEmptyFilesAndFolders(entryPath);

            // Check if the subdirectory is empty
            if (fs.readdirSync(entryPath).length === 0) {
                fs.rmdirSync(entryPath);
            }
        } else if (stat.isFile() && fs.readFileSync(entryPath, 'utf-8').trim() === '') {
            // Remove empty files
            fs.unlinkSync(entryPath);
        }
    });
}

function removeEmptyFilesAndFoldersCommand() {
    const projectPath = vscode.workspace.rootPath;

    if (projectPath) {
        // If the workspace is open
        removeEmptyFilesAndFolders(projectPath);

        vscode.window.showInformationMessage('Empty files and folders removed successfully.');
    } else {
        vscode.window.showWarningMessage('Please open a workspace to remove empty files and folders.');
    }
}

// Removes comments and log statements
function removeCommentsAndLogsCommand() {
    const editor = vscode.window.activeTextEditor;

    if (editor && (editor.document.languageId === 'javascript' || editor.document.languageId === 'javascriptreact')) {
        const projectPath = vscode.workspace.rootPath;

        if (projectPath) {
            // If the editor is open in a project
            traverseDirectory(projectPath);

            vscode.window.showInformationMessage('Comments, console logs, and unused imports removed successfully.');
        } else {
            vscode.window.showWarningMessage('Please open a workspace to apply changes across all files.');
        }
    } else {
        vscode.window.showWarningMessage('Please open a JavaScript or React file to remove comments, console logs, and unused imports.');
    }
}

function traverseDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath);

    entries.forEach(entry => {
        const entryPath = path.join(dirPath, entry);
        const stat = fs.statSync(entryPath);

        if (stat.isDirectory()) {
            traverseDirectory(entryPath);
        } else if (stat.isFile() && entryPath.endsWith('.js')) {
            processFile(entryPath);
        }
    });
}

module.exports = { activate };
