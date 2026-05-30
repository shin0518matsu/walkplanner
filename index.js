require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Rate limiting: 1IPあたり1時間に20回まで
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'リクエストが多すぎます。1時間後にお試しください。' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AIコース提案エンドポイント
app.post('/api/suggest-courses', async (req, res) => {
  const { lat, lng, prefecture } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: '位置情報が必要です' });
  }

  const areaName = prefecture || `緯度${parseFloat(lat).toFixed(3)}, 経度${parseFloat(lng).toFixed(3)}付近`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `あなたはウォーキングコース専門のAIアドバイザーです。
以下のエリアでウォーキングに適したコースを3つ提案してください。

エリア: ${areaName}

以下のJSONフォーマットのみで返してください。前置きや説明は不要です：
[
  {
    "title": "コース名（日本語、魅力的な名前）",
    "distance": "距離（例: 3.5km）",
    "time": "所要時間（例: 50分）",
    "difficulty": "easy | medium | hard",
    "tags": ["タグ1", "タグ2"],
    "tagTypes": ["park", "flat"],
    "description": "コースの特徴（40字以内）",
    "highlights": ["見どころ1", "見どころ2"]
  }
]

tagTypesの種類: park（公園・緑地）, flat（平坦）, hill（起伏あり）, river（川沿い）, historical（歴史・文化）, scenic（景色が良い）

地域の実際の地名・スポットを含めて、具体的で魅力的なコースを提案してください。`,
        },
      ],
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const courses = JSON.parse(jsonMatch[0]);
    res.json({ courses, area: areaName });
  } catch (error) {
    console.error('AI suggestion error:', error);
    res.status(500).json({ error: 'コース提案の取得に失敗しました' });
  }
});

// ルート情報解析エンドポイント
app.post('/api/analyze-route', async (req, res) => {
  const { distance, points } = req.body;

  if (!distance) {
    return res.status(400).json({ error: 'ルート情報が必要です' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `ウォーキングルートのアドバイスをください。

ルート情報:
- 距離: ${distance}km
- ポイント数: ${points}地点

以下のJSONフォーマットのみで返してください：
{
  "calories": 消費カロリー（体重60kgで計算、数値のみ）,
  "advice": "このルートへの一言アドバイス（30字以内）",
  "intensity": "low | medium | high",
  "tips": ["ウォーキングのコツ1", "コツ2"]
}`,
        },
      ],
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');

    const analysis = JSON.parse(jsonMatch[0]);
    res.json(analysis);
  } catch (error) {
    console.error('Route analysis error:', error);
    res.status(500).json({ error: 'ルート解析に失敗しました' });
  }
});

app.listen(PORT, () => {
  console.log(`WalkPlanner API server running on port ${PORT}`);
});
