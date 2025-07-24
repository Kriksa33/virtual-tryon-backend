import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const replicateToken = process.env.REPLICATE_API_TOKEN;

app.post("/tryon", async (req, res) => {
  console.log("✅ Received POST /tryon request");

  const { userImage, productImageUrl } = req.body;

  console.log("📦 Input data:", {
    userImageLength: userImage?.length,
    productImageUrl,
  });

  try {
    const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${replicateToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "a9758bcf3b44ce378d0df4e4e3d90bb13c7a095fd3b0f013c0b4fd383f9a4", // your model version
        input: {
          person_image: userImage,
          cloth_image: productImageUrl,
        },
      }),
    });

    const prediction = await replicateRes.json();
    console.log("📤 Replicate prediction response:", prediction);

    let result = null;
let status = prediction.status;
let tries = 0;

while (!result && status !== "failed" && tries < 15) {
  console.log(`⏳ Try ${tries + 1}: status = ${status}`);

  const check = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
    headers: { Authorization: `Token ${replicateToken}` }
  });

  const data = await check.json();
  status = data.status;

  if (data.output) {
    result = data.output[0]; // <- if it's an array
    console.log("✅ Final output:", result);
  } else {
    console.log("🕒 Still waiting...");
    await new Promise(r => setTimeout(r, 2000));
  }

  tries++;
}

      const data = await check.json();
      if (data.output) {
        result = data.output[0];
        console.log("✅ Final output:", result);
      } else {
        console.log("⏳ Waiting for output...");
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!result) {
      console.error("❌ Try-on failed");
      return res.status(500).json({ error: "Try-on failed" });
    }

    res.json({ processedImageUrl: result });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.listen(3000, () => console.log("Server running on port 3000"));
