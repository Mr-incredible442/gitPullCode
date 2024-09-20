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
    const stdout = await runCommand('git -C "/home/userver/yussman-server" pull', { windowsHide: true });
    res.send(`Server Repo Pull Successful: ${stdout}`);
  } catch ({ error, stderr }) {
    console.error(`Error pulling server repo: ${error}`);
    res.status(500).send(`Error: ${stderr}`);
  }
});

// Endpoint to pull from the second repository
app.get('/pull-client-repo', async (req, res) => {
  try {
    const pullStdout = await runCommand('git -C "/home/userver/yussman-server/yussman-client" pull', { windowsHide: true });

    if (pullStdout.includes('Already up to date')) {
      return res.send('Client Repo is already up to date. Skipping further steps.');
    }

    await runCommand('npm install', { cwd: '/home/userver/yussman-server/yussman-client', windowsHide: true });
    const buildStdout = await runCommand('npm run build', { cwd: '/home/userver/yussman-server/yussman-client', windowsHide: true });

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

app.listen(process.env.PORT, process.env.IP || '0.0.0.0', () => {
  console.log(`Server running on ${process.env.IP || '0.0.0.0'}:${process.env.PORT}`);
});
