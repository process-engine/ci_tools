import * as Octokit from '@octokit/rest';

export type PullRequest = {
  hash: string;
  mergedAt: string;
  number: number;
  title: string;
};

export default class GitHubClient {
  private octokit: Octokit;

  public static async create(token?: string): Promise<GitHubClient> {
    const client = new GitHubClient();

    if (token) {
      await client.initializeClient(token);
    }

    return client;
  }

  public async initializeClient(token?: string): Promise<Octokit> {
    const octokit: Octokit = new Octokit();

    octokit.authenticate({
      type: 'token',
      token: process.env.GH_TOKEN
    });

    return octokit;
  }
}
