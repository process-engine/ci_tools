export type ParsedVersion = {
  baseString: string;
  releaseChannelName: string;
  releaseChannelNumber?: number;
};

type ReleaseChannelInfo = {
  name: string;
  number?: number;
};

const RELEASE_CHANNEL_NAME_STABLE = 'stable';

export function parseVersion(version: string): ParsedVersion {
  const isSemVer = version.match(/^\d+\.\d+\.\d+/) != null;
  if (!isSemVer) {
    return null;
  }

  const isPreVersion = version.includes('-');

  if (isPreVersion) {
    const parts = version.split('-');
    const baseString = parts[0];
    const releaseChannelString = parts[1];

    const isNumberedReleaseChannel = releaseChannelString.includes('.');
    if (!isNumberedReleaseChannel) {
      return null;
    }

    const releaseChannelParts = releaseChannelString.split('.');
    const releaseChannelName = releaseChannelParts[0];
    const releaseChannelNumber = parseInt(releaseChannelParts[1]);

    return {
      baseString: baseString,
      releaseChannelName: releaseChannelName,
      releaseChannelNumber: releaseChannelNumber
    };
  }

  return {
    baseString: version,
    releaseChannelName: RELEASE_CHANNEL_NAME_STABLE
  };
}
