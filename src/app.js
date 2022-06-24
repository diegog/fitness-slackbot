const dotenv = require('dotenv');
const { App } = require('@slack/bolt');
const schedule = require('node-schedule');
const { exercises } = require('./exercise.json');
const { negativeStmts } = require('./negativeStmt.json');
const { positiveStmts } = require('./positiveStmt.json');

dotenv.config();
const inProgress = {};

// Initializes your app with your bot token and signing secret
const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  channel: process.env.SLACK_CHANNEL_ID,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
});

const promptUserToDoExercise = async (user) => {
  // Get random exercise / reps or seconds
  const exercise = exercises[Math.floor(Math.random() * exercises.length)];
  const reps = Math.floor(
    Math.random() * (exercise.maxReps - exercise.minReps) + exercise.minReps
  );

  await app.client.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    text: `<@${user}> was chosen to do ${reps} ${exercise.units} of ${exercise.name}!`,
  });

  // Send messages only visible to the user that was chosen.
  const message = await app.client.chat.postEphemeral({
    user,
    channel: process.env.SLACK_CHANNEL_ID,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Hey there <@${user}>! Have you done your ${reps} ${exercise.units} of ${exercise.name}?`,
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
              text: 'Yes! 💪',
              emoji: true,
            },
            action_id: 'accept',
          },
          {
            type: 'button',
            style: 'danger',
            text: {
              type: 'plain_text',
              text: `I can't 😫`,
              emoji: true,
            },
            action_id: 'reject',
          },
        ],
      },
    ],
    text: `Error loading data...`,
  });

  // add user and exercise info to inProgress Object
  inProgress[user] = { exercise, reps, ts: message.message_ts };
};

const getRandomUser = async () => {
  const { user_id: botId } = await app.client.auth.test();

  let { members } = await app.client.conversations.members({
    channel: process.env.SLACK_CHANNEL_ID,
  });
  // remove bot user from members list
  members = members.filter((m) => m !== botId);

  // return random member from channel
  return members[Math.floor(Math.random() * members.length)];
};

const sendSuccessMessage = async (user) => {
  const statement =
    positiveStmts[Math.floor(Math.random() * positiveStmts.length)];
  const { exercise, reps } = inProgress[user];
  await app.client.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    text: `<@${user}> has completed their ${reps} ${exercise.units} of ${exercise.name}! ${statement}`,
  });

  // Remove data from inProgress
  delete inProgress[user];
};

const sendFailureMessage = async (user) => {
  const statement =
    negativeStmts[Math.floor(Math.random() * negativeStmts.length)];
  const { exercise, reps } = inProgress[user];

  await app.client.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    text: `<@${user}> failed to complete their ${reps} ${exercise.units} of ${exercise.name}. ${statement}`,
  });
  // Remove data from inProgress
  delete inProgress[user];
};

const goodMorning = async () => {
  await app.client.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    text: `Goodmorning <!here>! Remember to stretch and drink plenty of water today!`,
  });
};

const goodNight = async () => {
  await app.client.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    text: `Goodnight <!here>! Remember to disconnect and some point and try to get a good night's rest!`,
  });
};

// Good Morning message
schedule.scheduleJob('* 09 * * *', async () => {
  await goodMorning();
});

//
schedule.scheduleJob('*/30 09-17 * * *', async () => {
  const user = await getRandomUser();

  const current = inProgress[user];
  if (current) {
    await sendFailureMessage(user);
  }

  await promptUserToDoExercise(user);
});

schedule.scheduleJob('* 17 * * *', async () => {
  await goodNight();
});

app.action('accept', async ({ body, ack, respond }) => {
  await ack();
  if (inProgress[body.user.id]) {
    await sendSuccessMessage(body.user.id);
  }

  // Delete ephemeral message
  await respond({
    response_type: 'ephemeral',
    text: '',
    replace_original: true,
    delete_original: true,
  });
});

app.action('reject', async ({ body, ack, respond }) => {
  await ack();
  const current = inProgress[body.user.id];

  // if responding to current message
  if (current && body.container.message_ts === current.ts) {
    await sendFailureMessage(body.user.id);
  }

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
