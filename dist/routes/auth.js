"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
const SECRET = process.env.JWT_SECRET || "minecraft_secret";
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === process.env.PASSWORD) {
        const token = jsonwebtoken_1.default.sign({ username }, SECRET);
        res.json({ token });
        return;
    }
    res.status(401).json({ error: "Invalid credentials" });
    return;
});
exports.default = router;
