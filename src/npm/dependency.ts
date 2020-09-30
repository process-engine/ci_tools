import { sh } from '../cli/shell';

export type Dependency = { name: string; version: string }
type DependencyObject = { [name: string]: string }

export function convertToDependencyArray(dependencies: DependencyObject): Dependency[] {
  return Object
    .entries(dependencies)
    .map(([name, version]) => {
      return {
        name: name,
        version: version,
      };
    });
}

export function getDependencyAsString(dependency: Dependency): string {
  return `${dependency.name}@${dependency.version}`;
}

export function getRegistryInfo(packageName: string) {
  const registryInfoRaw = sh(`npm view --json ${packageName}`);

  return JSON.parse(registryInfoRaw);
}

export function getLatestRevision(packageName: string, baseVersion: string, releaseChannelName: string): string {
  const registryInfo = getRegistryInfo(packageName);
  const availableVersions = registryInfo.versions as string[];
  const versionCandidates = availableVersions
    .filter((versionCandidate) => {
      if (releaseChannelName === 'stable') {
        return versionCandidate === baseVersion;
      }

      return versionCandidate.startsWith(`${baseVersion}-${releaseChannelName}`);
    })
    .sort();

  return versionCandidates[versionCandidates.length - 1];
}
