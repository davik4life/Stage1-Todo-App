const serverless = require('serverless-http');
const { createApp } = require('../../server/app');
exports.handler = serverless(createApp({ serveStatic: false }));
