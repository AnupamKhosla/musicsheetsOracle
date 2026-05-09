// DO NOT DELETE COMMENTS
//WHole is being converted from commonJS to ESM
"use strict";
//var express = require('express');
//import express
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

import cors from "cors";
import "./loadEnvironment.mjs";
import "express-async-errors";
import posts from "./routes/posts.mjs";
//import db from "./db/conn.mjs"; //Uncomment-debug if db connection doesn't work


const PORT = process.env.PORT || 5050;
const app = express();


app.use(cors());
app.use(express.json());
//important above code for json to work


const productionDir = path.join(path.resolve(),'frontend/build');
const devDir = path.join(path.resolve(),'frontend/public');

// --- Maintenance mode ---
// Covers all domains: musicsheets.site, tunnel, workers.dev, pages.dev
const MAINT_FLAG = '/tmp/musicsheets-maintenance';
const LOGS_FILE = '/tmp/musicsheets-logs.html';

app.use((req, res, next) => {
  if (req.path === '/api/webhook' || req.path === '/api/health') return next();
  if (fs.existsSync(MAINT_FLAG)) {
    if (fs.existsSync(LOGS_FILE)) return res.sendFile(LOGS_FILE);
    return res.type('html').send('<pre>Pipeline starting...</pre>');
  }
  next();
});

app.use(cors());
app.use(express.static(productionDir)); // for live server use build folder of react frontend
//app.use(express.static(devDir)); // for dev server use public folder of react frontend
//no need for devdir, as devdir is served by create react app's own server

app.get('/', function(req, res) {
  res.send('Hello World');
});


app.use("/api/posts", posts);


// --- Webhook endpoint ---
app.post('/api/webhook', express.raw({ type: '*/*' }), (req, res) => {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return res.status(500).send('Webhook secret not configured');

  const signature = req.headers['x-hub-signature-256'];
  const hmac = crypto.createHmac('sha256', secret);
  const rawBody = Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
  const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

  try {
    if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest)))
      return res.status(401).send('Invalid signature');
  } catch {
    return res.status(401).send('Invalid signature');
  }

  //const payload = JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString() : req.body);
  // if we wanan check branch name, we can do it here by looking at payload.ref
  // GitHub ping — acknowledge only, don't deploy
  if (req.headers['x-github-event'] === 'ping') return res.send('pong');

  res.status(202).send('Deploy started');

  const deployScript = path.join(path.resolve(), 'ops/scripts/deploy.sh');
  spawn('bash', [deployScript, path.resolve()], { detached: true, stdio: 'ignore' });
});

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', maintenance: fs.existsSync(MAINT_FLAG) });
});



// app.use("/archive", posts);
// app.use("/posts/:id", posts);
// app.use("/create", posts);



// Global error handling
app.use((err, _req, res, next) => {
  res.status(500).send("Uh oh! An unexpected error occured.")
});


//Handles any requests that don't match the ones above
app.get('*', (req,res) => {
    res.sendFile(path.join(path.resolve(),'frontend/build/index.html'));
    //no need for frontend/public folder, that is served by CRA own 3000_port server
});


// start the Express server
app.listen(PORT, () => {
  console.log(`Success! backend server is running on port: ${PORT} \n frontend is working at 3000. Use localhost:3000 for developement work`);
  //get server url by making curl request
});

export default app;
//export PORT
export { PORT };