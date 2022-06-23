import dotenv from 'dotenv';
import bolt from '@slack/bolt';
import schedule from 'node-schedule';
const { App } = bolt;

dotenv.config();

// Initializes your app with your bot token and signing secret
const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  channel: process.env.SLACK_CHANNEL_ID,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  token: process.env.SLACK_BOT_TOKEN,
});

const promptSomeoneToDoExercise = async () => {
  const user = await getRandomUser();

  await app.client.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    text: `<@${user}> was chosen to do exercise!`,
  });

  // Send messages only visible to the user that was chosen.
  await app.client.chat.postEphemeral({
    user: user,
    channel: process.env.SLACK_CHANNEL_ID,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Hey there <@${user}>!`,
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
  });
};

const getRandomUser = async () => {
  const { user_id: bot_id } = await app.client.auth.test();

  let { members } = await app.client.conversations.members({
    channel: process.env.SLACK_CHANNEL_ID,
  });
  // remove bot user from members list
  members = members.filter((m) => m != bot_id);

  // return random member from channel
  return members[Math.floor(Math.random() * members.length)];
};

schedule.scheduleJob('*/1 * * * *', async () => {
  console.log('prompting...');
  await promptSomeoneToDoExercise();
});

app.action('accept', async ({ body, ack, say, respond }) => {
  await ack();
  await say(`<@${body.user.id}> accepted the challenge`);

  // Delete ephemeral message
  await respond({
    response_type: 'ephemeral',
    text: '',
    replace_original: true,
    delete_original: true,
  });
});

app.action('reject', async ({ body, ack, say, respond }) => {
  await ack();
  await say(`<@${body.user.id}> rejected the challenge`);

  // Delete ephemeral message
  await respond({
    response_type: 'ephemeral',
    text: '',
    replace_original: true,
    delete_original: true,
  });
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
