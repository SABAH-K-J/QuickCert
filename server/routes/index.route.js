import express from "express";
const router = express.Router();

// Homepage Route
router.get("/", (req, res) => {
  res.render("index", { title: "E-certificate Generator" });
});

export default router;
