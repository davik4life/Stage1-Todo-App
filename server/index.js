const { createApp } = require('./app');
const app = createApp();
if (require.main === module) {
  const port = process.env.PORT || 5001;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}
module.exports = app;
