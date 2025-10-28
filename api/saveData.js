// api/saveData.js
module.exports = async (req, res) => {
    if (req.method !== "POST") {
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

    const { year, quadrant, sector, amount } = req.body || {};

    if (!year || !quadrant || !sector || !amount) {
        return res.status(400).json({
            success: false,
            message: "Missing fields"
        });
    }

    try {
        // 1. get existing
        const latestUrl = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;
        const putUrl = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

        const rGet = await fetch(latestUrl, {
            headers: {
                "X-Master-Key": JSONBIN_API_KEY
            }
        });
        const jGet = await rGet.json();
        const currentArr = Array.isArray(jGet.record) ? jGet.record : [];

        // 2. push new item
        const newItem = {
            id: Date.now().toString(),
            year: parseInt(year,10),
            quadrant: String(quadrant).toUpperCase(),
            sector: sector,
            amount: Number(amount)
        };
        currentArr.push(newItem);

        // 3. save back
        await fetch(putUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": JSONBIN_API_KEY
            },
            body: JSON.stringify(currentArr)
        });

        return res.status(200).json({
            success: true,
            data: currentArr
        });

    } catch (err) {
        console.error("saveData error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to save data"
        });
    }
};
