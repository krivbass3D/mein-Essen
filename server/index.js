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

const multer = require('multer');

// Configure Multer (Memory Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const PORT = process.env.PORT || 3000;

// Health Check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'mein-essen-backend' });
});

/**
 * POST /api/upload
 * Uploads a receipt image to Supabase Storage and returns the public URL.
 */
app.post('/api/upload', upload.single('receipt'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate a unique filename: timestamp-originalName
    const timestamp = Date.now();
    // Sanitize filename: remove non-ascii, replace spaces
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${timestamp}-${safeName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('receipts')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      throw error;
    }

    // Get Public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('receipts')
      .getPublicUrl(fileName);

    res.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: fileName
    });

  } catch (err) {
    console.error('Upload Endpoint Error:', err);
    res.status(500).json({ error: 'Failed to upload image', details: err.message });
  }
});

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/analyze
 * Analyzes a receipt image URL using OpenAI Vision.
 * Body: { imageUrl: string }
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing imageUrl' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use GPT-4o for best vision performance
      messages: [
        {
          role: "system",
          content: "You are a receipt parser. Extract items from the receipt image. Return ONLY raw JSON array with no markdown formatting. Format: [{ \"name\": \"Item Name\", \"qty\": 1, \"price\": 0.00 }]. If quantity is missing, assume 1. Fix typos if obvious."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Parse this receipt." },
            {
              type: "image_url",
              image_url: {
                "url": imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    
    // Clean up markdown if AI adds it
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const items = JSON.parse(cleanContent);

    res.json({ success: true, items });

  } catch (err) {
    console.error('Analyze Endpoint Error:', err);
    res.status(500).json({ error: 'Failed to analyze receipt', details: err.message });
  }
});

/**
 * POST /api/receipts
 * Saves parsed receipt items to Supabase.
 * Body: { imageUrl: string, items: Array<{name, qty, price}> }
 */
app.post('/api/receipts', async (req, res) => {
  try {
    const { imageUrl, items } = req.body;
    
    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);

    // 1. Insert Receipt
    const { data: receiptData, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        image_path: imageUrl, // Storing full URL for simplicity in MVP
        total_amount: totalAmount,
        merchant_name: 'Unknown', // AI could detect this, skipping for now
        purchase_date: new Date().toISOString()
      })
      .select()
      .single();

    if (receiptError) throw receiptError;

    // 2. Insert Items
    const receiptItems = items.map(item => ({
      receipt_id: receiptData.id,
      name: item.name,
      quantity: item.qty || 1,
      price: item.price || 0,
      total_price: (item.price || 0) * (item.qty || 1)
    }));

    const { error: itemsError } = await supabase
      .from('receipt_items')
      .insert(receiptItems);

    if (itemsError) throw itemsError;

    res.json({ success: true, receiptId: receiptData.id, total: totalAmount.toFixed(2) });

  } catch (err) {
    console.error('Save Receipt Error:', err);
    res.status(500).json({ error: 'Failed to save receipt', details: err.message });
  }
});

/**
 * GET /api/budget
 * Returns current week's budget status.
 */
app.get('/api/budget', async (req, res) => {
  try {
    const WEEKLY_LIMIT = 210.00;

    // Calculate start of the week (Monday)
    const now = new Date();
    const day = now.getDay() || 7; // Get current day number, converting Sun (0) to 7
    if (day !== 1) {
       now.setHours(-24 * (day - 1)); // Go back to Monday
    } else {
       // It is Monday
    }
    now.setHours(0, 0, 0, 0);
    const startOfWeek = now.toISOString();

    // Query Receipts
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('total_amount, purchase_date')
      .gte('purchase_date', startOfWeek);

    if (error) throw error;

    const spent = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const remaining = WEEKLY_LIMIT - spent;

    res.json({
      weekStart: startOfWeek.split('T')[0],
      limit: WEEKLY_LIMIT,
      spent: spent,
      remaining: remaining
    });

  } catch (err) {
    console.error('Budget Error:', err);
    res.status(500).json({ error: 'Failed to calc budget', details: err.message });
  }
});

/**
 * POST /api/plan
 * Generates a shopping list for tomorrow based on history and budget.
 * Body: { wishes: string }
 */
app.post('/api/plan', async (req, res) => {
  try {
    const { wishes } = req.body;
    const WEEKLY_LIMIT = 210.00;

    // 1. Get Budget Context
    const now = new Date();
    // Logic for "Tomorrow"
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });

    // Calculate start of week for budget
    const day = now.getDay() || 7; 
    const startOfWeekDate = new Date(now);
    if (day !== 1) startOfWeekDate.setHours(-24 * (day - 1));
    startOfWeekDate.setHours(0, 0, 0, 0);
    const startOfWeek = startOfWeekDate.toISOString();

    const { data: receipts } = await supabase
      .from('receipts')
      .select('total_amount')
      .gte('purchase_date', startOfWeek);

    const spent = receipts ? receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0) : 0;
    const remaining = WEEKLY_LIMIT - spent;

    // 2. Get Recent Items (to see what we have)
    const { data: recentItems } = await supabase
      .from('receipt_items')
      .select('name, quantity')
      .order('id', { ascending: false })
      .limit(20);

    const pantryContext = recentItems ? recentItems.map(i => `${i.name} (${i.quantity})`).join(', ') : 'None';

    // 3. Prompt AI
    const prompt = `
      Act as a strict shopping list generator. 
      Context:
      - Weekly Budget Limit: €${WEEKLY_LIMIT}
      - Spent so far: €${spent.toFixed(2)}
      - Remaining: €${remaining.toFixed(2)}
      - Today is: ${now.toLocaleDateString('en-US', { weekday: 'long' })}. Planning for: ${dayName}.
      - Recent purchases (in pantry): ${pantryContext}
      - Family Wishes: ${wishes || 'None'}

      Task:
      Generate a concise shopping list for tomorrow in Russian.
      - STRICTLY NO intro/outro text (like "Here is your list", "Bon appetit").
      - Only list items.
      - If tomorrow is Sunday, include Monday needs.
      - Keep it within budget.
      
      Output Format matches exactly:
      - Item Name (~€Price)
      - Item Name (~€Price)
      
      Total: ~€XX.XX
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful home assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
    });

    const planText = response.choices[0].message.content;

    res.json({ success: true, plan: planText });

  } catch (err) {
    console.error('Planning Error:', err);
    res.status(500).json({ error: 'Failed to generate plan', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
