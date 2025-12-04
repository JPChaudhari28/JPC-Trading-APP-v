// routes/watchlist.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

// get watchlist
router.get("/", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ watchlist: user.watchlist || [] });
});

// add stock
router.post("/add", requireAuth, async (req, res) => {
  const { symbol, exchange } = req.body;
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { watchlist: { symbol, exchange } },
  });
  res.json({ message: "Added" });
});

// remove stock
router.post("/remove", requireAuth, async (req, res) => {
  const { symbol, exchange } = req.body;
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { watchlist: { symbol, exchange } },
  });
  res.json({ message: "Removed" });
});

export default router;
