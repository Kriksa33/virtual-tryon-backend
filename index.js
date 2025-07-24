import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const replicateToken = process.env.REPLICATE_API_TOKEN;

app.post("/tryon", async (req, res) => {
  const { userImage, productImageUrl } = req.body;

  try {
    const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${replicateToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "a9758cfb3b4cae378d0dfa4e3d90bb13c7a095fdd3b0f013c0b4fd383f9a4", // ← Replicate model version
        input: {
          person_image: userImage,
          cloth_image: productImageUrl
        }
      })
    });

    const prediction = await replicateRes.json();

    let result = null;
    let status = prediction.status;
    let tries = 0;

    while (!result && status !== "failed" && tries < 15) {
      const check = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Token ${replicateToken}` }
      });

      const data = await check.json();
      status = data.status;

      if (data.output) {
        result = data.output[0];
        console.log("✅ Final output:", result);
      } else {
        console.log("⏳ Waiting for output...");
        await new Promise(r => setTimeout(r, 2000));
      }

      tries++;
    }

    if (!result) return res.status(500).json({ error: "Try-on failed" });

    res.json({ processedImageUrl: result });

  } catch (error) {
    console.error("🔥 Try-on error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => {
  console.log("👟 Virtual try-on backend running on port 3000");
});
