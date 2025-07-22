import express from "express";
import cors from "cors";
import fetch from "node-fetch";

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
        version: "a9758cbf3b4c4e378d0fdfae4e3d9db0b13c7a095fdd3b0f013c0b4fd383f9a4",
        input: {
          person_image: userImage,
          cloth_image: productImageUrl
        }
      })
    });

    const prediction = await replicateRes.json();

    let result = null;
    while (!result && prediction.status !== "failed") {
      const check = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Token ${replicateToken}` }
      });
      const data = await check.json();
      if (data.output) result = data.output[0];
      else await new Promise(r => setTimeout(r, 2000));
    }

    if (!result) return res.status(500).json({ error: "Try-on failed" });

    res.json({ processedImageUrl: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
