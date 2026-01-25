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
app.post("/api/start", (req, res) => {
    exec(
        "bash ../packages/contract/script/generate_wallet.sh",
        { cwd: __dirname },
        (err, stdout) => {
            if (err) return res.status(500).json({ error: err.message });

            const wallet = JSON.parse(stdout);
            const sessionId = crypto.randomUUID();

            fs.writeFileSync(
                `${SESSIONS_DIR}/${sessionId}.json`,
                JSON.stringify(wallet, null, 2)
            );

            res.json({ sessionId, ...wallet });
        }
    );
});

/**
 * STEP 2 – Deploy contract
 */
app.post("/api/deploy", (req, res) => {
    const { sessionId } = req.body;
    const path = `${SESSIONS_DIR}/${sessionId}.json`;

    if (!fs.existsSync(path)) {
        return res.status(404).json({ error: "Session not found" });
    }

    const session = JSON.parse(fs.readFileSync(path));

    exec(
        `bash ../packages/contract/script/deploy.sh ${session.privateKey}`,
        { cwd: __dirname },
        (err, stdout) => {
            if (err) return res.status(500).json({ error: err.message });

            const deploy = JSON.parse(stdout);

            res.json({
                walletAddress: session.walletAddress,
                ...deploy
            });
        }
    );
});

app.listen(3000, () => {
    console.log("API running on http://localhost:3000");
});
