export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: req.body.input }),
    });

    const data = await response.json();

    // Round scores to 5 decimal places if they exist
    if (
      data?.results &&
      Array.isArray(data.results) &&
      data.results[0]?.category_scores
    ) {
      const scores = data.results[0].category_scores;
      const roundedScores = {};

      for (const key in scores) {
        const value = scores[key];
        roundedScores[key] =
          typeof value === 'number' ? parseFloat(value.toFixed(5)) : value;
      }

      data.results[0].category_scores = roundedScores;
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Moderation API error:', err);
    res.status(500).json({ error: 'Failed to run moderation check' });
  }
}

