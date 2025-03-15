#!/usr/bin/env node

const express = require("express");
const axios = require("axios");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2));

const cache = new Map();

if (args["clear-cache"]) {
  cache.clear();
  console.log("✅ Cache cleared!");
  process.exit(0);
}

const port = args.port || 3000;
const origin = args.origin;

if (!origin) {
  console.error("❌ Please provide an origin URL using --origin");
  process.exit(1);
}

const app = express();

app.use(async (req, res) => {
  const cacheKey = req.originalUrl;

  // Check if the response is already cached
  if (cache.has(cacheKey)) {
    console.log(`🚀 Cache hit: ${cacheKey}`);
    res.set("X-Cache", "HIT");
    return res.send(cache.get(cacheKey));
  }

  try {
    // Forward the request to the origin server
    const response = await axios.get(`${origin}${req.originalUrl}`);
    const data = response.data;

    // Cache the response
    cache.set(cacheKey, data);

    console.log(`🌐 Cache miss: ${cacheKey}`);
    res.set("X-Cache", "MISS");
    res.send(data);
  } catch (error) {
    console.error("❌ Error forwarding request:", error.message);
    res.status(500).send("Error while forwarding the request.");
  }
});

app.listen(port, () => {
  console.log(`🚀 Caching proxy server running on port ${port}`);
  console.log(`🌐 Forwarding requests to ${origin}`);
});
