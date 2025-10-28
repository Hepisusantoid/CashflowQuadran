// api/deleteData.js
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

    const { id } = req.body || {};
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Missing id"
        });
    }

    try {
        const latestUrl = `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`;
        const putUrl = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

        // Ambil data sekarang
        const rGet = await fetch(latestUrl, {
            headers: {
                "X-Master-Key": JSONBIN_API_KEY
            }
        });
        const jGet = await rGet.json();
        let arr = Array.isArray(jGet.record) ? jGet.record : [];

        // Hapus item yg match id
        arr = arr.filter(item => item.id !== id);

        // Simpan balik
        await fetch(putUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": JSONBIN_API_KEY
            },
            body: JSON.stringify(arr)
        });

        return res.status(200).json({
            success: true,
            data: arr
        });

    } catch (err) {
        console.error("deleteData error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to delete data"
        });
    }
};
