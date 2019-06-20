import * as shell from 'shelljs';

export function sh(command: string): string {
  console.log(`exec: ${command}`);
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  const result = shell.exec(command, { silent: true });
  console.log(result.toString());
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

  return result.toString();
}
