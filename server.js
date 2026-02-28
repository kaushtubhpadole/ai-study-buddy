require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Groq — free API, fast, reliable
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';  // free, fast, great quality

function buildPrompt(topic, mode) {
  const modeInstructions = {
    simple: 'Explain in simple language suitable for a 10th grade student.',
    exam:   'Explain in structured bullet points for exam preparation.',
    analogy:'Explain using real-life analogies that make the concept easy to understand.'
  };
  const instruction = modeInstructions[mode] || modeInstructions.simple;

  return `You are an expert study assistant. Help students understand topics clearly.

Topic/Notes: ${topic}

Mode: ${instruction}

Respond in EXACTLY this format (use these exact section headers, nothing else before EXPLANATION):

EXPLANATION:
[Thorough explanation according to the mode]

SUMMARY:
[3-4 sentence summary of key points]

MCQS:
1. [Question]
a) [Option A]
b) [Option B]
c) [Option C]
d) [Option D]
Answer: [letter]

2. [Question]
a) [Option A]
b) [Option B]
c) [Option C]
d) [Option D]
Answer: [letter]

3. [Question]
a) [Option A]
b) [Option B]
c) [Option C]
d) [Option D]
Answer: [letter]

4. [Question]
a) [Option A]
b) [Option B]
c) [Option C]
d) [Option D]
Answer: [letter]

5. [Question]
a) [Option A]
b) [Option B]
c) [Option C]
d) [Option D]
Answer: [letter]

FLASHCARDS:
Q: [Question 1]
A: [Answer 1]

Q: [Question 2]
A: [Answer 2]

Q: [Question 3]
A: [Answer 3]

Q: [Question 4]
A: [Answer 4]

Q: [Question 5]
A: [Answer 5]`;
}

// Debug route
app.get('/test-key', async (req, res) => {
  const key = process.env.GROQ_API_KEY;
  console.log('\n--- /test-key ---');
  console.log('Groq key loaded:', key ? `YES (starts with ${key.slice(0, 8)}...)` : 'NO KEY FOUND');

  if (!key) {
    return res.json({ ok: false, error: 'No GROQ_API_KEY found in .env' });
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: 'Say the word hello only.' }],
        max_tokens: 10
      })
    });

    const raw = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', raw);
    res.json({ status: response.status, body: raw });
  } catch (err) {
    console.error('Error:', err.message);
    res.json({ ok: false, error: err.message });
  }
});

// Main route
app.post('/generate', async (req, res) => {
  const { topic, mode } = req.body;

  console.log('\n--- /generate ---');
  console.log('Topic:', topic ? topic.slice(0, 60) : 'EMPTY');
  console.log('Mode:', mode);

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Please provide a topic or study notes.' });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'API key not configured. Please add GROQ_API_KEY to your .env file.' });
  }

  const prompt = buildPrompt(topic.trim(), mode || 'simple');

  try {
    console.log('Calling Groq API...');
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    console.log('Groq status:', response.status);
    const rawBody = await response.text();
    console.log('Groq response (first 300):', rawBody.slice(0, 300));

    if (!response.ok) {
      if (response.status === 401) return res.status(401).json({ error: 'Invalid Groq API key. Please check your .env file.' });
      if (response.status === 429) return res.status(429).json({ error: 'Rate limit hit. Please wait a moment and try again.' });
      return res.status(500).json({ error: `API error ${response.status}: ${rawBody.slice(0, 200)}` });
    }

    const data = JSON.parse(rawBody);
    if (!data.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: 'Empty response from AI. Please try again.' });
    }

    console.log('Success! Generated', data.choices[0].message.content.length, 'chars');
    return res.json({ result: data.choices[0].message.content });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: 'Network error: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 AI Study Buddy running at http://localhost:${PORT}`);
  console.log(`🔑 Test your API key: http://localhost:${PORT}/test-key\n`);
});
