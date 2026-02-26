const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve o frontend
app.use(express.static(path.join(__dirname, "public")));

// Health check (Railway gosta disso)
app.get("/health", (_req, res) => res.status(200).send("ok"));

// SPA fallback (se um dia você usar rotas)
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("MyRePlayTV running on port", PORT);
});