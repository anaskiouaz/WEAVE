import { Router } from 'express';

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    time: new Date(),
  });
});

export default router;
