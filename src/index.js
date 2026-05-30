require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'リクエストが多すぎます。' },
});
app.use('/api/', limiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/suggest-courses', async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: '位置情報が必要です' });
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: `緯度${lat}経度${lng}付近のウォーキングコースを3つJSON配列で提案してください。各要素: title, distance, time, difficulty(easy/medium/hard), tags, tagTypes(park/flat/hill/river/historical/scenic), description, highlights。前置き不要。` }],
    });
    const text = message.content[0].text;
    const json = text.match(/\[[\s\S]*\]/);
    if (!json) throw new Error('invalid');
    res.json({ courses: JSON.parse(json[0]) });
  } catch (e) {
    res.status(500).json({ error: 'エラーが発生しました' });
  }
});

app.post('/api/analyze-route', async (req, res) => {
  const { distance, points } = req.body;
  if (!distance) return res.status(400).json({ error: 'ルート情報が必要です' });
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: `距離${distance}km、${points}地点のウォーキングルートをJSON形式で分析。calories(数値), advice(30字以内), intensity(low/medium/high), tips(配列)。前置き不要。` }],
    });
    const text = message.content[0].text;
    const json = text.match(/\{[\s\S]*\}/);
    if (!json) throw new Error('invalid');
    res.json(JSON.parse(json[0]));
  } catch (e) {
    res.status(500).json({ error: 'エラーが発生しました' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
