require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
app.use(cors());
const port = 3000;

// MongoDB connection URL from environment variable
const mongoUrl = process.env.MONGODB_URI; // Ensure this is correct in your .env file
console.log("MongoDB URL:", mongoUrl);

const client = new MongoClient(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000, // Set a 10-second connection timeout
});

let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await client.connect();
    db = client.db("Ekdant-Events");
    console.log("Connected to MongoDB");

    // After successful connection, start the server
    app.use(express.json());
    app.use(express.static(__dirname));

    // Configure multer for memory storage
    const storage = multer.memoryStorage();
    const upload = multer({
      storage: storage,
      fileFilter: function (req, file, cb) {
        if (file.fieldname === "eventImage") {
          // Match the field name from client
          cb(null, true);
        } else {
          cb(new Error("Unexpected field name"));
        }
      },
    });

    // POST endpoint to add an event
    app.post("/api/events", upload.single("eventImage"), async (req, res) => {
      try {
        console.log("Request body:", req.body);
        console.log("File info:", req.file);

        const { name, price, category, description } = req.body;

        // Create new event with image buffer (directly in MongoDB)
        const newEvent = {
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
          createdAt: new Date(),
        };

        // Insert new event into MongoDB
        const result = await db.collection("events").insertOne(newEvent);

        res.json({
          success: true,
          message: "Event added successfully",
          eventId: result.insertedId,
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
        const events = await db
          .collection("events")
          .find({})
          .project({
            name: 1,
            price: 1,
            category: 1,
            description: 1,
            createdAt: 1,
            "image.filename": 1,
          })
          .toArray();

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
        const event = await db
          .collection("events")
          .findOne(
            { _id: new ObjectId(req.params.id) },
            { projection: { image: 1 } }
          );

        if (!event || !event.image) {
          return res.status(404).send("Image not found");
        }

        res.set("Content-Type", event.image.contentType);
        res.send(event.image.data.buffer);
      } catch (error) {
        console.error("Error fetching image:", error);
        res.status(500).send("Error fetching image");
      }
    });

    // POST endpoint for login
    app.post("/api/login", (req, res) => {
      const { password } = req.body;

      console.log(password);
      console.log(typeof password);
      console.log(process.env.ADMIN_PASSWORD);
      console.log(typeof process.env.ADMIN_PASSWORD);
      

      if (password == process.env.ADMIN_PASSWORD) {
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    });

    // GET single event
    app.get("/api/events/:id", async (req, res) => {
      try {
        const event = await db
          .collection("events")
          .findOne({ _id: new ObjectId(req.params.id) });

        if (!event) {
          return res
            .status(404)
            .json({ success: false, message: "Event not found" });
        }

        res.json(event);
      } catch (error) {
        console.error("Error fetching event:", error);
        res
          .status(500)
          .json({ success: false, message: "Error fetching event" });
      }
    });

    // PUT endpoint to update an event
    app.put(
      "/api/events/:id",
      upload.single("eventImage"),
      async (req, res) => {
        try {
          const { name, price, category, description } = req.body;

          const updateData = {
            name,
            price: price.startsWith("Rs. ") ? price : `Rs. ${price}`,
            category,
            description,
            updatedAt: new Date(),
          };

          // Only update image if a new one is provided
          if (req.file) {
            updateData.image = {
              data: req.file.buffer,
              contentType: req.file.mimetype,
              filename: req.file.originalname,
            };
          }

          const result = await db
            .collection("events")
            .updateOne(
              { _id: new ObjectId(req.params.id) },
              { $set: updateData }
            );

          if (result.matchedCount === 0) {
            return res
              .status(404)
              .json({ success: false, message: "Event not found" });
          }

          res.json({ success: true, message: "Event updated successfully" });
        } catch (error) {
          console.error("Error updating event:", error);
          res
            .status(500)
            .json({
              success: false,
              message: error.message || "Error updating event",
            });
        }
      }
    );

    // DELETE endpoint to remove an event
    app.delete("/api/events/:id", async (req, res) => {
      try {
        const result = await db
          .collection("events")
          .deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Event not found" });
        }

        res.json({ success: true, message: "Event deleted successfully" });
      } catch (error) {
        console.error("Error deleting event:", error);
        res
          .status(500)
          .json({ success: false, message: "Error deleting event" });
      }
    });

    // Start the server after MongoDB connection
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit if connection fails
  }
}

// Call the function to connect to MongoDB and start the server
connectToMongoDB();
