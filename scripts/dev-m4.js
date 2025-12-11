#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

const HOST_DOMAIN = "m4.localhost.com";
const HOSTS_PATH = "/etc/hosts";

function checkHostsMapping() {
  try {
    const hostsContent = fs.readFileSync(HOSTS_PATH, "utf8");
    const hasMapping = hostsContent.includes(`127.0.0.1   ${HOST_DOMAIN}`);

    if (!hasMapping) {
      console.error(`
[ERROR] Host mapping for ${HOST_DOMAIN} not found.

Please add this line to /etc/hosts:

  127.0.0.1   ${HOST_DOMAIN}

Then run again: npm run dev-m4
`);
      process.exit(1);
    }
  } catch (err) {
    console.error("[ERROR] Cannot read /etc/hosts", err);
    process.exit(1);
  }
}

function startVite() {
  console.log(`
🚀 Starting Vite dev server at:
   http://${HOST_DOMAIN}:5173

If browser origin shows anything else, Google Sign-In will fail.
`);

  const vite = spawn("npm", ["run", "dev", "--", "--host", HOST_DOMAIN, "--port", "5173"], {
    stdio: "inherit",
    shell: true,
  });

  vite.on("close", (code) => {
    process.exit(code);
  });
}


// Run checks
checkHostsMapping();
startVite();
