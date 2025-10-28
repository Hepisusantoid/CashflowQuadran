// api/login.js
module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const { username, password } = req.body || {};

    const ADMIN_USER = process.env.ADMIN_USER;
    const ADMIN_PASS = process.env.ADMIN_PASS;

    const ok = (username === ADMIN_USER && password === ADMIN_PASS);

    return res.status(200).json({
        success: ok
    });
};
