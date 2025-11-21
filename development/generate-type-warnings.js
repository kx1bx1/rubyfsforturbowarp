import pathUtil from 'node:path';
import ts from 'typescript';

/**
 * @fileoverview
 * tsc command output will be parsed by GitHub Actions as errors.
 * We want them to be just warnings.
 */

const check = () => {
  const rootDir = pathUtil.join(import.meta.dirname, '..');

  const tsconfigPath = pathUtil.join(rootDir, 'tsconfig.json');
  const commandLine = ts.getParsedCommandLineOfConfigFile(tsconfigPath, {}, ts.sys);

  const program = ts.createProgram({
    rootNames: commandLine.fileNames,
    options: commandLine.options
  });
  const emitted = program.emit();

  const diagnostics = [
    ...ts.getPreEmitDiagnostics(program),
    ...emitted.diagnostics
  ];

  let numWarnings = 0;

  for (const diagnostic of diagnostics) {
    // https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
    const relativeFileName = pathUtil.relative(rootDir, diagnostic.file.fileName);
    let output = `::warning file=${relativeFileName}`;

    const startPosition = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
    const endPosition = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
    output += `,line=${startPosition.line + 1},col=${startPosition.character + 1}`;
    output += `,endLine=${endPosition.line + 1},endCol=${endPosition.character + 1}`;

    output += ",title=Type warning - may indicate a bug. No action required if no bug::";

    const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, ', ', 0);
    output += text;

    console.log(output);
  }

  console.log(`${numWarnings} warnings.`);
};

check();
