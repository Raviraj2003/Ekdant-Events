require("dotenv").config();
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");
const Event = require("./models/Event");

const app = express();
app.use(cors());
const port = 3000;

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.fieldname === "eventImage") {
      cb(null, true);
    } else {
      cb(new Error("Unexpected field name"));
    }
  },
});

// Connect to MongoDB with Mongoose
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

app.use(express.json());
app.use(express.static(__dirname));

// POST endpoint to add an event
app.post("/api/events", upload.single("eventImage"), async (req, res) => {
  try {
    const { name, price, category, description } = req.body;

    const newEvent = new Event({
      name,
      price: price.startsWith("Rs. ") ? price : `Rs. ${price}`,
      category,
      description,
      image: req.file
        ? {
            data: req.file.buffer,
            contentType: req.file.mimetype,
            filename: req.file.originalname,
          }
        : null,
    });

    const savedEvent = await newEvent.save();
    res.json({
      success: true,
      message: "Event added successfully",
      eventId: savedEvent._id,
    });
  } catch (error) {
    console.error("Error in /api/events:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error adding event",
    });
  }
});

// GET endpoint to retrieve events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find(
      {},
      {
        name: 1,
        price: 1,
        category: 1,
        description: 1,
        createdAt: 1,
        "image.filename": 1,
      }
    );
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching events",
    });
  }
});

// GET endpoint to retrieve image by event ID
app.get("/api/events/:id/image", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id, { image: 1 });
    if (!event || !event.image) {
      return res.status(404).send("Image not found");
    }
    res.set("Content-Type", event.image.contentType);
    res.send(event.image.data);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).send("Error fetching image");
  }
});

// POST endpoint for login
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password == process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// GET single event
app.get("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching event",
    });
  }
});

// PUT endpoint to update an event
app.put("/api/events/:id", upload.single("eventImage"), async (req, res) => {
  try {
    const { name, price, category, description } = req.body;

    const updateData = {
      name,
      price: price.startsWith("Rs. ") ? price : `Rs. ${price}`,
      category,
      description,
      updatedAt: new Date(),
    };

    if (req.file) {
      updateData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      };
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({ success: true, message: "Event updated successfully" });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating event",
    });
  }
});

// DELETE endpoint to remove an event
app.delete("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting event",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
