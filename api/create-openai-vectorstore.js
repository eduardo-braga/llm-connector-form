export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { file_ids, name } = req.body;

  if (!Array.isArray(file_ids) || file_ids.length === 0) {
    return res.status(400).json({ error: "Missing or invalid 'file_ids'" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/vector_stores", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file_ids,
        name: name || "LLMConnector Vector Store"
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to create vector store:", result);
      return res.status(response.status).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("🔥 Vector store creation error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
