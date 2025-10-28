// api/getData.js
module.exports = async (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const BIN_ID = process.env.BIN_ID;
    const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

    if (!BIN_ID || !JSONBIN_API_KEY) {
        return res.status(500).json({
            success: false,
            message: "Server env not configured"
        });
    }

    try {
        const latestUrl = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;

        const r = await fetch(latestUrl, {
            headers: {
                "X-Master-Key": JSONBIN_API_KEY
            }
        });

        const j = await r.json();
        const dataArray = Array.isArray(j.record) ? j.record : [];

        return res.status(200).json({
            success: true,
            data: dataArray
        });
    } catch (err) {
        console.error("getData error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch from JSONBin"
        });
    }
};
