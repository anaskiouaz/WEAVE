import pkg from "../package.json" assert { type: "json" };

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    env: process.env.NODE_ENV,
    version: pkg.version,
    commit: process.env.GIT_COMMIT_HASH,  // 👈 new
    build: process.env.BUILD_ID,          // 👈 new
    time: new Date(),
  });
});

export default router;
