const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../src');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\\n');
  let insideJSX = false;
  let insideText = false;
  let errors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect start and end of JSX block simplistically
    if (line.startsWith('return (') || line.startsWith('return<') || line.includes('<View') || line.includes('<>')) {
      insideJSX = true;
    }
    if (insideJSX && line.includes('</View>')) {
      insideJSX = false;
    }

    // Detect if inside <Text> component
    if (line.includes('<Text')) {
      insideText = true;
    }
    if (insideText && line.includes('</Text>')) {
      insideText = false;
    }

    // Check for string literals outside <Text>
    const stringLiteralMatch = line.match(/(["'`])(?:(?=(\\\\?))\\2.)*?\\1/);
    if (stringLiteralMatch && insideJSX && !insideText) {
      errors.push({
        line: i + 1,
        text: line,
      });
    }
  }

  if (errors.length > 0) {
    console.log(`Potential text strings outside <Text> in file: ${filePath}`);
    errors.forEach(e => {
      console.log(`  Line ${e.line}: ${e.text.trim()}`);
    });
    console.log('');
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
      checkFile(fullPath);
    }
  });
}

walkDir(rootDir);console.warn` once.
      // When we uninstall we keep the same reference and only change its
      // internal implementation
      const isFirstInstall = originalConsoleError == null;
      if (isFirstInstall) {
        originalConsoleError = console.error.bind(console);
        originalConsoleWarn = console.warn.bind(console);

        // $FlowExpectedError[cannot-write]
        console.error = (...args) => {
          consoleErrorImpl?.(...args);
        };
        // $FlowExpectedError[cannot-write]
        console.warn = (...args) => {
          consoleWarnImpl?.(...args);
        };
      }

      consoleErrorImpl = registerError;
      consoleWarnImpl = registerWarning;

      if (Platform.isTesting) {
        LogBoxData.setDisabled(true);
      }

      RCTLog.setWarningHandler((...args) => {
        registerWarning(...args);
      });
    },

    uninstall(): void {
      if (!isLogBoxInstalled) {
        return;
      }

      isLogBoxInstalled = false;

      // IMPORTANT: we don't re-assign to `

