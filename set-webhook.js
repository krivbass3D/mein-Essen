/**
 * Run this script to set up the Telegram Webhook.
 * Usage: node set-webhook.js <YOUR_VERCEL_URL>
 * Example: node set-webhook.js https://mein-essen.vercel.app
 */

const token = process.env.TELEGRAM_BOT_TOKEN || '8589210318:AAFARUP4E6vxw61AW7jvaw_bf2vA0yj5fg0';
const url = process.argv[2];

if (!url) {
    console.error('Please provide your Vercel URL as an argument.');
    console.error('Example: node set-webhook.js https://mein-essen.vercel.app');
    process.exit(1);
}

const webhookUrl = `${url}/api/webhook`;
const telegramUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`;

console.log(`Setting webhook to: ${webhookUrl}`);

fetch(telegramUrl)
    .then(res => res.json())
    .then(data => {
        console.log('Response:', data);
    })
    .catch(err => {
        console.error('Error:', err);
    });
