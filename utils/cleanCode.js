// removeCommentsAndLogs.js

function removeCommentsAndLogs(code) {
  // Regular expression to match and remove single-line comments (excluding URLs)
  const singleLineCommentRegex = /^(?!.*https?:\/\/).*\/\/.*$/gm;
  code = code.replace(singleLineCommentRegex, '');

  // Regular expression to match and remove multi-line comments (excluding URLs)
  const multiLineCommentRegex = /^(?!.*https?:\/\/).*\/\*[\s\S]*?\*\//gm;
  code = code.replace(multiLineCommentRegex, '');

  // Regular expression to match and remove console.log statements
  const consoleLogRegex = /console\.log\(.+?\);?/g;
  code = code.replace(consoleLogRegex, '');

  return code;
}

module.exports = removeCommentsAndLogs;

