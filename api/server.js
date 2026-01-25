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

/**
 * STEP 1 – Generate wallet
 */
const sendError = (res, statusCode, message, code = "ERROR") => {
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

/**
 * STEP 1 – Generate wallet
 */
app.post("/api/start", (req, res) => {
    exec(
        "bash ../packages/contract/script/generate_wallet.sh",
        { cwd: __dirname },
        (err, stdout, stderr) => {
            if (err) {
                console.error("Generate Wallet Error:", stderr || err.message);
                return sendError(res, 500, "Failed to generate wallet", "WALLET_GEN_FAILED");
            }

            try {
                const wallet = JSON.parse(stdout);
                const sessionId = crypto.randomUUID();

                fs.writeFileSync(
                    `${SESSIONS_DIR}/${sessionId}.json`,
                    JSON.stringify(wallet, null, 2)
                );

                sendSuccess(res, { sessionId, ...wallet });
            } catch (parseError) {
                console.error("JSON Parse Error:", stdout);
                sendError(res, 500, "Invalid output from wallet script", "PARSE_ERROR");
            }
        }
    );
});

/**
 * STEP 2 – Deploy contract
 */
app.post("/api/deploy", (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return sendError(res, 400, "Session ID is required", "MISSING_SESSION_ID");
    }

    const path = `${SESSIONS_DIR}/${sessionId}.json`;

    if (!fs.existsSync(path)) {
        return sendError(res, 404, "Session not found", "SESSION_NOT_FOUND");
    }

    let session;
    try {
        session = JSON.parse(fs.readFileSync(path));
    } catch (e) {
        return sendError(res, 500, "Corrupted session file", "SESSION_READ_ERROR");
    }

    exec(
        `bash ../packages/contract/script/deploy.sh ${session.privateKey}`,
        { cwd: __dirname },
        (err, stdout, stderr) => {
            if (err) {
                console.error("Deploy Error:", stderr || err.message);
                // Try to extract a clean error message if possible
                return sendError(res, 500, "Deployment failed. Check server logs.", "DEPLOY_FAILED");
            }

            try {
                const deploy = JSON.parse(stdout);
                sendSuccess(res, {
                    walletAddress: session.walletAddress,
                    ...deploy
                });
            } catch (parseError) {
                console.error("JSON Parse Error:", stdout);
                sendError(res, 500, "Invalid output from deploy script", "PARSE_ERROR");
            }
        }
    );
});

app.listen(3000, "0.0.0.0", () => {
    console.log("API running on http://0.0.0.0:3000");
});

