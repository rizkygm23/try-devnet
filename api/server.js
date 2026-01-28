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
 * @api {post} /api/start 1. Start Session / Generate Wallet
 * @apiDescription Generates a new temporary developer wallet and creates a session.
 * @apiGroup Workflow
 * 
 * @apiSuccess {Boolean} success True if successful
 * @apiSuccess {Object} data Wallet and session details
 * @apiSuccess {String} data.sessionId Unique session identifier
 * @apiSuccess {String} data.walletAddress Generated wallet address
 * @apiSuccess {String} data.privateKey Generated private key (for dev use only)
 * @apiSuccess {String} data.faucet Faucet URL for funding
 * 
 * @apiError (500) {Object} error
 * @apiError {String} error.code Error code (e.g., WALLET_GEN_FAILED)
 * @apiError {String} error.message Error description
 */
app.post("/api/start", (req, res) => {
    // ... existing implementation ...
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
 * @api {post} /api/deploy 2. Deploy Contract
 * @apiDescription Deploys the contract using the wallet generated in the start session step.
 * @apiGroup Workflow
 * 
 * @apiParam {String} sessionId The session ID returned from /api/start
 * 
 * @apiSuccess {Boolean} success True if successful
 * @apiSuccess {Object} data Deployment details
 * @apiSuccess {String} data.walletAddress The wallet address used for deployment
 * @apiSuccess {String} data.contractAddress The deployed contract address
 * @apiSuccess {String} data.contractLink Explorer link to the contract
 * 
 * @apiError (400) MISSING_SESSION_ID Session ID not provided
 * @apiError (404) SESSION_NOT_FOUND Session file does not exist
 * @apiError (500) DEPLOY_FAILED Contract deployment failed
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

app.get("/api/session/:sessionId", (req, res) => {
    const { sessionId } = req.params;

    if (!sessionId) {
        return sendError(res, 400, "Session ID is required", "MISSING_SESSION_ID");
    }

    const path = `${SESSIONS_DIR}/${sessionId}.json`;

    if (!fs.existsSync(path)) {
        return sendError(res, 404, "Session not found", "SESSION_NOT_FOUND");
    }

    try {
        const session = JSON.parse(fs.readFileSync(path));
        // Ensure consistent response format with /start
        sendSuccess(res, { sessionId, ...session });
    } catch (e) {
        return sendError(res, 500, "Corrupted session file", "SESSION_READ_ERROR");
    }
});

app.listen(3001, "0.0.0.0", () => {
    console.log("API running on http://0.0.0.0:3001");
});

