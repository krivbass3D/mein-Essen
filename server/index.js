require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
// const { Telegraf } = require('telegraf'); // Uncomment when token is ready

const app = express();
app.use(cors());
app.use(express.json());

// Supabase Setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Health Check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'mein-essen-backend' });
});

/*
// Bot Setup
if (process.env.TELEGRAM_BOT_TOKEN) {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    bot.launch();
    console.log('Bot started');
}
*/

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
