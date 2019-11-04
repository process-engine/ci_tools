import * as shell from 'shelljs';

export function sh(command: string): string {
  const result = shell.exec(`${command} 2>&1`, { silent: true });

  return result.stdout;
}

export function asyncSh(command: string): Promise<string> {
  return new Promise((resolve: Function, reject: Function): void => {
    shell.exec(`${command} 2>&1`, { silent: true, async: true }, (code, stdout, stderr): void => {
      return resolve(stdout);
    });
  });
}

export function escapeForShell(text: string): string {
  return text.replace(/(`|\$|")/g, '\\$1');
}
