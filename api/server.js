const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const SESSIONS_DIR = __dirname + "/sessions";
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

/* ═══════════════════════════════════════════════════════════════════════════
   🎨 BEAUTIFUL LOGGING SYSTEM
   ═══════════════════════════════════════════════════════════════════════════ */

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",

    // Text colors
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",

    // Background colors
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m",
};

const getTimestamp = () => {
    const now = new Date();
    return `${colors.dim}${now.toLocaleTimeString('en-US', { hour12: false })}.${String(now.getMilliseconds()).padStart(3, '0')}${colors.reset}`;
};

const log = {
    info: (emoji, message, details = "") => {
        console.log(`${getTimestamp()} ${emoji}  ${colors.cyan}${message}${colors.reset} ${colors.dim}${details}${colors.reset}`);
    },
    success: (emoji, message, details = "") => {
        console.log(`${getTimestamp()} ${emoji}  ${colors.green}${colors.bright}${message}${colors.reset} ${colors.dim}${details}${colors.reset}`);
    },
    error: (emoji, message, details = "") => {
        console.log(`${getTimestamp()} ${emoji}  ${colors.red}${colors.bright}${message}${colors.reset} ${colors.dim}${details}${colors.reset}`);
    },
    warn: (emoji, message, details = "") => {
        console.log(`${getTimestamp()} ${emoji}  ${colors.yellow}${message}${colors.reset} ${colors.dim}${details}${colors.reset}`);
    },
    request: (method, path, sessionId = "") => {
        const methodColors = {
            GET: colors.green,
            POST: colors.blue,
            PUT: colors.yellow,
            DELETE: colors.red,
        };
        const methodColor = methodColors[method] || colors.white;
        const sessionInfo = sessionId ? `${colors.magenta}[${sessionId.slice(0, 8)}...]${colors.reset}` : "";
        console.log(`${getTimestamp()} 📨  ${methodColor}${colors.bright}${method}${colors.reset} ${colors.white}${path}${colors.reset} ${sessionInfo}`);
    },
    divider: () => {
        console.log(`${colors.dim}${"─".repeat(60)}${colors.reset}`);
    },
    box: (title, content) => {
        console.log(`\n${colors.cyan}╭${"─".repeat(58)}╮${colors.reset}`);
        console.log(`${colors.cyan}│${colors.reset} ${colors.bright}${title.padEnd(56)}${colors.reset} ${colors.cyan}│${colors.reset}`);
        console.log(`${colors.cyan}├${"─".repeat(58)}┤${colors.reset}`);
        content.forEach(line => {
            console.log(`${colors.cyan}│${colors.reset} ${line.padEnd(56)} ${colors.cyan}│${colors.reset}`);
        });
        console.log(`${colors.cyan}╰${"─".repeat(58)}╯${colors.reset}\n`);
    }
};

// Request counter
let requestCount = 0;
let deployCount = 0;
let sessionCount = 0;

// Request logging middleware
app.use((req, res, next) => {
    requestCount++;
    const sessionId = req.body?.sessionId || req.params?.sessionId || "";
    log.request(req.method, req.path, sessionId);
    next();
});

/* ═══════════════════════════════════════════════════════════════════════════
   📤 RESPONSE HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

const sendError = (res, statusCode, message, code = "ERROR") => {
    log.error("❌", `Error: ${code}`, message);
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message
        }
    });
};

const sendSuccess = (res, data) => {
    res.json({
        success: true,
        data
    });
};

/* ═══════════════════════════════════════════════════════════════════════════
   🚀 API ENDPOINTS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @api {post} /api/start 1. Start Session / Generate Wallet
 */
app.post("/api/start", (req, res) => {
    log.info("🔐", "Generating new wallet...");

    exec(
        "bash ../packages/contract/script/generate_wallet.sh",
        { cwd: __dirname },
        (err, stdout, stderr) => {
            if (err) {
                log.error("💥", "Wallet generation failed", stderr || err.message);
                return sendError(res, 500, "Failed to generate wallet", "WALLET_GEN_FAILED");
            }

            try {
                const wallet = JSON.parse(stdout);
                const sessionId = crypto.randomUUID();
                sessionCount++;

                fs.writeFileSync(
                    `${SESSIONS_DIR}/${sessionId}.json`,
                    JSON.stringify(wallet, null, 2)
                );

                log.success("✨", "New session created!", `Session: ${sessionId.slice(0, 8)}...`);
                log.info("👛", `Wallet: ${wallet.walletAddress.slice(0, 10)}...${wallet.walletAddress.slice(-8)}`);
                log.divider();

                sendSuccess(res, { sessionId, ...wallet });
            } catch (parseError) {
                log.error("💥", "JSON Parse Error", stdout);
                sendError(res, 500, "Invalid output from wallet script", "PARSE_ERROR");
            }
        }
    );
});

/**
 * @api {post} /api/deploy 2. Deploy Contract
 */
app.post("/api/deploy", (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return sendError(res, 400, "Session ID is required", "MISSING_SESSION_ID");
    }

    const path = `${SESSIONS_DIR}/${sessionId}.json`;

    if (!fs.existsSync(path)) {
        log.warn("⚠️", "Session not found", sessionId.slice(0, 8));
        return sendError(res, 404, "Session not found", "SESSION_NOT_FOUND");
    }

    let session;
    try {
        session = JSON.parse(fs.readFileSync(path));
    } catch (e) {
        return sendError(res, 500, "Corrupted session file", "SESSION_READ_ERROR");
    }

    log.info("🚀", "Starting deployment...", `Session: ${sessionId.slice(0, 8)}...`);
    const startTime = Date.now();

    exec(
        `bash ../packages/contract/script/deploy.sh ${session.privateKey}`,
        { cwd: __dirname },
        (err, stdout, stderr) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            if (err) {
                log.error("💥", `Deployment failed (${duration}s)`, stderr || err.message);
                return sendError(res, 500, "Deployment failed. Check server logs.", "DEPLOY_FAILED");
            }

            try {
                const deploy = JSON.parse(stdout);
                deployCount++;

                log.success("🎉", `Contract deployed! (${duration}s)`);
                log.info("📄", `Contract: ${deploy.contractAddress}`);
                log.info("📊", `Total deployments: ${deployCount}`);
                log.divider();

                sendSuccess(res, {
                    walletAddress: session.walletAddress,
                    ...deploy
                });
            } catch (parseError) {
                log.error("💥", "JSON Parse Error", stdout);
                sendError(res, 500, "Invalid output from deploy script", "PARSE_ERROR");
            }
        }
    );
});

/**
 * @api {get} /api/session/:sessionId 3. Get Session
 */
app.get("/api/session/:sessionId", (req, res) => {
    const { sessionId } = req.params;

    if (!sessionId) {
        return sendError(res, 400, "Session ID is required", "MISSING_SESSION_ID");
    }

    const path = `${SESSIONS_DIR}/${sessionId}.json`;

    if (!fs.existsSync(path)) {
        log.warn("⚠️", "Session lookup failed", sessionId.slice(0, 8));
        return sendError(res, 404, "Session not found", "SESSION_NOT_FOUND");
    }

    try {
        const session = JSON.parse(fs.readFileSync(path));
        log.success("🔍", "Session retrieved", sessionId.slice(0, 8));
        sendSuccess(res, { sessionId, ...session });
    } catch (e) {
        return sendError(res, 500, "Corrupted session file", "SESSION_READ_ERROR");
    }
});

/* ═══════════════════════════════════════════════════════════════════════════
   🎬 SERVER STARTUP
   ═══════════════════════════════════════════════════════════════════════════ */

const PORT = 3001;

app.listen(PORT, "0.0.0.0", () => {
    console.clear();
    console.log(`
${colors.cyan}${colors.bright}
   ███████╗███████╗██╗███████╗███╗   ███╗██╗ ██████╗
   ██╔════╝██╔════╝██║██╔════╝████╗ ████║██║██╔════╝
   ███████╗█████╗  ██║███████╗██╔████╔██║██║██║     
   ╚════██║██╔══╝  ██║╚════██║██║╚██╔╝██║██║██║     
   ███████║███████╗██║███████║██║ ╚═╝ ██║██║╚██████╗
   ╚══════╝╚══════╝╚═╝╚══════╝╚═╝     ╚═╝╚═╝ ╚═════╝
${colors.reset}
${colors.dim}   Devnet Deployment API${colors.reset}
`);

    log.box("🚀 SERVER STARTED", [
        `${colors.green}●${colors.reset} Status:    ${colors.green}Online${colors.reset}`,
        `${colors.cyan}◉${colors.reset} Port:      ${colors.bright}${PORT}${colors.reset}`,
        `${colors.yellow}◈${colors.reset} URL:       http://localhost:${PORT}`,
        `${colors.magenta}◇${colors.reset} Sessions:  ${SESSIONS_DIR}`,
        "",
        `${colors.dim}Endpoints:${colors.reset}`,
        `  POST /api/start    → Generate wallet`,
        `  POST /api/deploy   → Deploy contract`,
        `  GET  /api/session  → Get session info`,
    ]);

    log.info("👂", "Listening for requests...");
    log.divider();
});
