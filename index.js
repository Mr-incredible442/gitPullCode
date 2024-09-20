const express = require('express');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// Helper function to run commands and return a promise
const runCommand = (command, options) => {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
};

// Endpoint to pull from the first repository
app.get('/pull-server-repo', async (req, res) => {
  try {
    const stdout = await runCommand('git -C "C:\\Users\\THE GAME\\OneDrive\\Desktop\\yussman-server" pull', { windowsHide: true });
    res.send(`Server Repo Pull Successful: ${stdout}`);
  } catch ({ error, stderr }) {
    console.error(`Error pulling server repo: ${error}`);
    res.status(500).send(`Error: ${stderr}`);
  }
});

// Endpoint to pull from the second repository
app.get('/pull-client-repo', async (req, res) => {
  try {
    // Pull the latest changes from the client repository
    const pullStdout = await runCommand('git -C "C:\\Users\\THE GAME\\OneDrive\\Desktop\\yussman-server\\yussman-client" pull', { windowsHide: true });

    // Check if the pull output indicates "Already up to date"
    if (pullStdout.includes('Already up to date')) {
      return res.send('Client Repo is already up to date. Skipping further steps.');
    }

    // Install dependencies and build the client if changes were pulled
    await runCommand('npm install', { cwd: 'C:\\Users\\THE GAME\\OneDrive\\Desktop\\yussman-server\\yussman-client', windowsHide: true });
    const buildStdout = await runCommand('npm run build', { cwd: 'C:\\Users\\THE GAME\\OneDrive\\Desktop\\yussman-server\\yussman-client', windowsHide: true });

    // Restart PM2 process for the client
    await runCommand('pm2 restart Yussman', { windowsHide: true });

    res.send(`Client Repo Pull and Build Successful:\n${pullStdout}\n${buildStdout}`);
  } catch ({ error, stderr }) {
    console.error(`Error during pull, install or build: ${error}`);
    res.status(500).send(`Error: ${stderr}`);
  }
});

// Serve the HTML page with buttons
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(process.env.PORT, process.env.IP || '0.0.0.0', () => {});
