require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dns = require("dns");
const validUrl = require("valid-url");
const perma = require("perma");
const mongoose = require("mongoose");

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

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Model
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const urlModel = mongoose.model("urlModel", urlSchema);

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

  urlModel
    .findOne({ original_url: url })
    .then((urlFound) => {
      if (urlFound) {
        console.log("URL already added to db");
        res.json({
          original_url: urlFound.original_url,
          short_url: urlFound.short_url,
        });
      } else {
        const shortUrl = perma(url, 5);

        const new_url = new urlModel({
          original_url: url,
          short_url: shortUrl,
        });

        new_url
          .save()
          .then((doc) => {
            console.log(doc);
          })
          .catch((err) => {
            console.error(err);
          });

        res.json({ original_url: url, short_url: shortUrl });
      }
    })
    .catch((err) => {
      res.json({ error: "Failed database connection" });
    });
});

app.get("/api/shorturl/:short_url", (req, res) => {
  const short_url = req.params.short_url;
  let original_url;

  urlModel
    .findOne({
      short_url: short_url,
    })
    .then((doc) => {
      if (doc) {
        res.redirect(doc.original_url);
      } else {
        res.json({ error: "URL does not exist" });
      }
    })
    .catch((err) => {
      res.json({ error: "Failed database connection" });
    });
});

// Listener
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
