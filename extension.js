const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const apiKey = "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";

const openai = new OpenAI({
    apiKey
});
var flag = 0;
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
            const outputFolder = path.join(folderPath, 'documentation'); // Create a 'documentation' folder in each workspace folder
            await generateDocumentation(folderPath, outputFolder);
        }

        vscode.window.showInformationMessage('Generated documentation for all JS files!');
    });

    context.subscriptions.push(disposable);
}

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

// async function getChatGPTResponse(input) {
//     try {
//         const completion = await openai.chat.completions.create({
//             messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: input.trim()}],
//             model: "gpt-3.5-turbo",
//         });
//         console.log('Token count:', completion.usage.total_tokens);
//         return completion.choices[0].message.content.trim();
//     } catch (error) {
//         console.error(`Error with ChatGPT API request: ${error.message}`);
//         return 'Please upgrade the API key or give only 3 requests per minute';
//     }
// }

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


module.exports = {
    activate
};
