export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const resp = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    const json = await resp.json();
    if (!resp.ok) return res.status(resp.status).json(json);

    const modelIds = json.data
      .map(m => m.id)
      .filter(id => id.startsWith('gpt-') || id.startsWith('o')) // keeps GPT-4, GPT-4o, etc.
      .sort();

    res.status(200).json({ models: modelIds });
  } catch (err) {
    console.error('⚠️ Error listing models:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}