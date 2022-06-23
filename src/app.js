import dotenv from 'dotenv';
import bolt from '@slack/bolt';
const { App } = bolt;

dotenv.config();

// Initializes your app with your bot token and signing secret
const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
});

// Listens to incoming messages that contain "hello"
app.message('hello', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  await say(`<@${message.user}> was chosen to do exercise!`);

  // Send messages only visible to users that were chosen
  await app.client.chat.postEphemeral({
    channel: message.channel,
    user: message.user,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Hey there <@${message.user}>!`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            style: 'primary',
            text: {
              type: 'plain_text',
              text: 'Accept',
              emoji: true,
            },
            action_id: 'accept',
          },
          {
            type: 'button',
            style: 'danger',
            text: {
              type: 'plain_text',
              text: 'Reject',
              emoji: true,
            },
            action_id: 'reject',
          },
        ],
      },
    ],
    text: `Error loading data...`,
    delete_original: true,
  });
});

app.action('accept', async ({ body, ack }) => {
  await ack();
  await say(`<@${body.user.id}> accepted the challenge`);
});

app.action('reject', async ({ body, ack, say }) => {
  await ack();
  await say(`<@${body.user.id}> rejected the challenge`);
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
