export function printMultiLineString(text: string | string[], linePrefix: string = ''): void {
  const lines = Array.isArray(text) ? text : text.split('\n');
  lines.forEach((line: string): void => console.log(`${linePrefix}${line}`));
}
