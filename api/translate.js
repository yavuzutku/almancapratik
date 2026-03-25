export default async function handler(req, res) {
  try {
    const { text, target } = req.body;

    if (!text || !target) {
      return res.status(400).json({ error: "Eksik parametre" });
    }

    const API_KEY = process.env.TRANSLATE_KEY;

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          target: target,
        }),
      }
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}