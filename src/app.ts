import express from "express";
import vision from "@google-cloud/vision";
import multer from "multer";
import path from "path";

const app = express();
const PORT = 3000;

// Set path to your Google service account key
const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, "../key.json"),
});

app.use(express.json());

// Setup Multer for file uploads
const upload = multer({ dest: "uploads/" });

// POST endpoint to upload image and detect text
app.post("/upload", upload.single("image"), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  try {
    const imagePath = path.resolve(req.file.path);
    const [result] = await client.textDetection(imagePath);
    const fullText = result.fullTextAnnotation?.text || "";

    const nameMatch = fullText.match(/គោត្តនាមនិងនាម\s*([\u1780-\u17FF\s]+)/);
    const dobMatch = fullText.match(
      /ថ្ងៃខែឆ្នាំកំណើតៈ[\s\n]*([\d០១២៣៤៥៦៧៨៩\.\/\-]+)/
    );
    const idMatch = fullText.match(/ID([A-Z0-9]+)/i);
    const validityMatch = fullText.match(
      /សុពលភាព:\s*([\d០១២៣៤៥៦៧៨៩\.\/\-]+)\s*ដល់ថ្ងៃ\s*([\d០១២៣៤៥៦៧៨៩\.\/\-]+)/
    );

    res.json({
      fullText,
      idNumber: idMatch ? idMatch[1] : null,
      name: nameMatch ? nameMatch[1] : null,
      dob: dobMatch ? dobMatch[1] : null,
      validityMatch,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process image" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
