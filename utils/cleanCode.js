// removeCommentsAndLogs.js

function removeCommentsAndLogs(code) {
  // Regular expression to match and remove console.log statements
  const consoleLogRegex = /console\.log\(.+?\);?/g;
  code = code.replace(consoleLogRegex, '');

  return code;
}

module.exports = removeCommentsAndLogs;

