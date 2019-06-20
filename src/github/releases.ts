import fetch from 'node-fetch';

type ReleaseData = {
  name: string;
};

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
};

const GITHUB_REPO = 'process-engine/bpmn-studio';
const RELEASES_API_URI = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

export async function getLatestReleases(): Promise<ReleaseData[]> {
  const result = await fetch(RELEASES_API_URI);
  const data = await result.json();
  const releases = data.filter((x: any): boolean => !x.prerelease && !x.draft);

  const releaseData = releases.map(
    (release: any): ReleaseData => {
      return {
        name: release.name
      };
    }
  );

  return releaseData;
}
