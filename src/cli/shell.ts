import * as shell from 'shelljs';

export function sh(command: string): string {
  const result = shell.exec(command, { silent: true });

  return result.toString();
}
