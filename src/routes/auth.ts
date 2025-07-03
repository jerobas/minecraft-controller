import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "minecraft_secret";

router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === "admin" && password === process.env.PASSWORD) {
    const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
    res.json({ token });
    return;
  }
  res.status(401).json({ error: "Invalid credentials" });
  return;
});

export default router;
