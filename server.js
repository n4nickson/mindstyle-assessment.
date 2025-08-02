const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Log directory contents for debugging
const publicPath = path.join(__dirname, 'public');
fs.readdir(publicPath, (err, files) => {
  if (err) {
    console.error('Error reading public directory:', err);
  } else {
    console.log('Contents of public directory:', files);
  }
});

// Serve static files from the public directory
app.use(express.static(publicPath));

// Serve index.html for the root route
app.get('/', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  console.log('Attempting to serve:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Server Error: Could not find index.html');
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});