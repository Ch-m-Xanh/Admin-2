const { Router } = require("express");
const { CATEGORIES } = require("../utils/categories");

const router = Router();

// Tra ve mang phang [{ value, label }] khop Web Admin / Web User client.
router.get("/", (_req, res) => {
  res.json(CATEGORIES.map((c) => ({ value: c.slug, label: c.label })));
});

module.exports = router;
