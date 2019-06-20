import * as shell from 'shelljs';

export function sh(command: string): string {
  return shell.exec(command, { silent: true }).toString();
}
