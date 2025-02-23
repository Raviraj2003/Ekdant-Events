const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const category = req.body.category.toLowerCase();
    const dir = `img/${category}`;
    try {
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post("/api/events", upload.single("image"), async (req, res) => {
  try {

    const { name, price, category, description } = req.body;
    const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : "";

    const newEvent = {
      name,
      price: price.startsWith("Rs. ") ? price : `Rs. ${price}`,
      image: imagePath,
      category,
      description,
    };

    // Read existing data
    const dataPath = path.join(__dirname, "Data", "data.json");
    const jsonData = await fs.readFile(dataPath, "utf8");
    const existingData = JSON.parse(jsonData);

    // Add new event
    existingData.push(newEvent);

    // Write updated data
    await fs.writeFile(dataPath, JSON.stringify(existingData, null, 2));

    res.json({ success: true, message: "Event added successfully" });
  } catch (error) {
    console.error("Error in /api/events:", error); // Log the error
    res.status(500).json({ success: false, message: "Error adding event" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
