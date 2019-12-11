import fetch, { Response } from 'node-fetch';

export function sendSlackMessage(message: string): Promise<Response> {
  const body = {
    text: message
  };

  return fetch(getSlackWebhook(), {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });
}

function getSlackWebhook(): string {
  const webhook: string = process.env.SLACK_WEBHOOK;

  if (webhook === undefined) {
    throw new Error("The slack incoming webhook URL must be configured as environment variable 'SLACK_WEBHOOK'!");
  }

  return webhook;
}
