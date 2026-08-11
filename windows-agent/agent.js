  const axios = require("axios");
const os = require("os");
const activeWin = require("active-win");

const employeeId = "EMP100";
const API_BASE = "http://localhost:5000/api/agent";

let currentApp = null;
let currentTitle = null;
let sessionStart = null;

async function checkApplication() {
try {
const win = await activeWin();


const app = win ? win.owner.name : "Unknown";
const title = win ? win.title : "Unknown";

// First launch
if (currentApp === null) {
  currentApp = app;
  currentTitle = title;
  sessionStart = new Date();
  console.log(`Started: ${app}`);
  return;
}

// Application or window changed
if (app !== currentApp || title !== currentTitle) {
  const sessionEnd = new Date();

  await axios.post(`${API_BASE}/session`, {
    employeeId,
    pcName: os.hostname(),
    application: currentApp,
    windowTitle: currentTitle,
    startTime: sessionStart,
    endTime: sessionEnd,
  });

  const duration = Math.floor((sessionEnd - sessionStart) / 1000);

  console.log(`Saved: ${currentApp} | ${duration}s`);

  // Start new session
  currentApp = app;
  currentTitle = title;
  sessionStart = sessionEnd;

  console.log(`Started: ${app}`);
}


} catch (error) {
console.error("Agent error:", error.response?.data || error.message);
}
}

// Check every 5 seconds
checkApplication();
setInterval(checkApplication, 5000);

// Save current session when agent exits
async function flushCurrentSession() {
if (!currentApp || !sessionStart) return;

try {
const sessionEnd = new Date();


await axios.post(`${API_BASE}/session`, {
  employeeId,
  pcName: os.hostname(),
  application: currentApp,
  windowTitle: currentTitle,
  startTime: sessionStart,
  endTime: sessionEnd,
});

const duration = Math.floor((sessionEnd - sessionStart) / 1000);

console.log(`Final save: ${currentApp} | ${duration}s`);


} catch (error) {
console.error("Flush error:", error.response?.data || error.message);
}
}

process.on("SIGINT", async () => {
await flushCurrentSession();
process.exit();
});

process.on("SIGTERM", async () => {
await flushCurrentSession();
process.exit();
});
