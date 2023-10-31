require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dns = require("dns");
const validUrl = require("valid-url");
const perma = require("perma"); // in testing

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Middleware
/*
app.post("/api/shorturl", (req, res, next) => {
  const { url } = req.body;

  if (!validUrl.isWebUri(url)) {
    return res.json({ error: "invalid url" });
  }

  const urlObject = new URL(url);
  const host = urlObject.hostname;

  dns.lookup(host, (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    } else {
      next();
    }
  });
});
*/

// Endpoints
app.get("/api/hello", function (req, res) {
  res.json({ message: "Hello API" });
});

app.post("/api/shorturl", (req, res) => {
  const { url } = req.body;

  if (!validUrl.isWebUri(url)) {
    return res.json({ error: "invalid url" });
  }

  const urlObject = new URL(url);
  const host = urlObject.hostname;

  dns.lookup(host, (err) => {
    if (err) return res.json({ error: "invalid url" });
  });

  const shortUrl = perma(url, 5);
  res.json({ original_url: url, short_url: shortUrl });
});

app.get("/api/shorturl/:short_url", (req, res) => {
  res.json({ message: "In progess" });
});

// Listener
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
