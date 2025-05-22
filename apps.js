const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("./db");
const app = express();
const cors = require("cors");
const fs = require("fs");
const session = require("express-session");
const { checkAuth } = require("./middleware/auth");
const adminRoutes = require("./adminRoutes");
const sessionStore = require("./sessionStore");
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

// Public routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Protected routes and pages
app.get("/admin.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/dashboard.html", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.use("/admin", checkAuth, adminRoutes);

// Protect product modification routes but keep GET public
app.use("/api/products", (req, res, next) => {
  if (req.method !== "GET") {
    // Only check authentication for non-GET requests
    return checkAuth(req, res, next);
  }
  next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// File upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure uploads directory exists
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Dummy login
const adminUser = {
  username: "GauriS",
  password: "Mahakal@220501",
};

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Check if someone is already logged in
  const activeSession = sessionStore.getActiveSession();
  if (activeSession && activeSession !== req.sessionID) {
    return res.json({
      success: false,
      message: "Another user is already logged in. Please try again later.",
    });
  }

  if (username === adminUser.username && password === adminUser.password) {
    req.session.isAuthenticated = true;
    req.session.user = { username };
    sessionStore.setActiveSession(req.sessionID);
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});

// Add logout endpoint
app.post("/api/logout", (req, res) => {
  if (req.session) {
    sessionStore.clearActiveSession();
    req.session.destroy((err) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  } else {
    res.json({ success: true, message: "Already logged out" });
  }
});

// API to add product
app.post("/api/products", upload.single("image"), (req, res) => {
  console.log("Received request to add product");
  console.log("Form body:", req.body);
  console.log("Uploaded file:", req.file);

  const { title, discount, price, description, view_link } = req.body;

  // Validate file upload
  if (!req.file) {
    console.log("❌ No image uploaded");
    return res.status(400).json({ error: "Image file is required" });
  }

  // Validate required fields
  if (!title || !discount || !price || !description || !view_link) {
    console.log("❌ Missing required fields");
    return res.status(400).json({
      error: "All fields are required",
      received: { title, discount, price, description, view_link },
    });
  }

  const image_url = `/uploads/${req.file.filename}`;

  // Convert price to number and validate
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) {
    console.log("❌ Invalid price value:", price);
    return res.status(400).json({ error: "Invalid price value" });
  }

  const sql = `INSERT INTO products (title, image_url, discount, price, description, view_link) 
               VALUES (?, ?, ?, ?, ?, ?)`;

  console.log("Executing SQL:", sql);
  console.log("Values:", [
    title,
    image_url,
    discount,
    numericPrice,
    description,
    view_link,
  ]);

  db.query(
    sql,
    [title, image_url, discount, numericPrice, description, view_link],
    (err, result) => {
      if (err) {
        console.error("❌ Database Error:", err);
        return res.status(500).json({
          error: "Failed to save product to database",
          details: err.message,
        });
      }

      console.log("✅ Product added successfully:", result);

      // If successful, send back the created product's data
      res.status(201).json({
        success: true,
        message: "✅ Product added successfully!",
        productId: result.insertId,
        product: {
          id: result.insertId,
          title,
          image_url,
          discount,
          price: numericPrice,
          description,
          view_link,
        },
      });
    }
  );
});

app.get("/admin/product-links", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM product_links ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all products
app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get product by ID
app.get("/api/products/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(404).json({ error: "Product not found" });
    res.json(results[0]);
  });
});

// Delete product
app.delete("/api/products/:id", (req, res) => {
  const productId = req.params.id;

  db.query(
    "SELECT image_url FROM products WHERE id = ?",
    [productId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(404).json({ error: "Product not found" });

      const imagePath = path.join(__dirname, results[0].image_url);

      db.query("DELETE FROM products WHERE id = ?", [productId], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        fs.unlink(imagePath, (err3) => {
          if (err3) console.error("Failed to delete image:", err3);
          res.json({ message: "✅ Product deleted" });
        });
      });
    }
  );
});

// Update product - FIXED: Removed extra comma in SQL query
app.put("/api/products/:id", upload.single("image"), (req, res) => {
  const productId = req.params.id;
  const { title, discount, price, description, view_link } = req.body;

  db.query(
    "SELECT image_url FROM products WHERE id = ?",
    [productId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(404).json({ error: "Product not found" });

      let image_url = results[0].image_url;

      if (req.file) {
        const newImageUrl = `/uploads/${req.file.filename}`;
        const oldImagePath = path.join(__dirname, image_url);

        fs.unlink(oldImagePath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting old image:", unlinkErr);
        });

        image_url = newImageUrl;
      }

      const sql = `
      UPDATE products 
      SET title = ?, image_url = ?, discount = ?, price = ?, description = ?, view_link = ? WHERE id = ?
    `;

      db.query(
        sql,
        [title, image_url, discount, price, description, view_link, productId],
        (updateErr) => {
          if (updateErr)
            return res.status(500).json({ error: updateErr.message });
          res.json({ message: "✅ Product updated" });
        }
      );
    }
  );
});

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
