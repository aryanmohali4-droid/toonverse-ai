export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'Server not configured. Missing API token.' });
  }

  try {
    const startResponse = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: '1:1',
          output_format: 'png'
        }
      })
    });

    const prediction = await startResponse.json();

    if (!startResponse.ok) {
      return res.status(500).json({ error: prediction.detail || 'Failed to start generation' });
    }

    let output = prediction.output;
    let statusUrl = prediction.urls && prediction.urls.get;
    let tries = 0;
    while ((!output || output.length === 0) && statusUrl && tries < 30) {
      await new Promise(r => setTimeout(r, 1000));
      const pollResponse = await fetch(statusUrl, {
        headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
      });
      const pollData = await pollResponse.json();
      if (pollData.status === 'succeeded') {
        output = pollData.output;
        break;
      }
      if (pollData.status === 'failed') {
        return res.status(500).json({ error: 'Generation failed' });
      }
      tries++;
    }

    if (!output || output.length === 0) {
      return res.status(500).json({ error: 'Generation timed out, try again' });
    }

    const imageUrl = Array.isArray(output) ? output[0] : output;

    return res.status(200).json({ imageUrl });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error, please try again' });
  }
                                   }
