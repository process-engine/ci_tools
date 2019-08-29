import * as shell from 'shelljs';

export function sh(command: string): string {
  const result = shell.exec(command, { silent: true });

  return result.toString();
}

export function asyncSh(command: string): Promise<string> {
  return new Promise((resolve: Function, reject: Function): void => {
    shell.exec(command, { silent: true, async: true }, (code, stdout, stderr): void => {
      if (code !== 0) {
        return reject(new Error(stderr));
      }

      return resolve(stdout);
    });
  });
}
