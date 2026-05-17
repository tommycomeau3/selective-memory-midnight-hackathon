const major = Number(process.versions.node.split('.')[0]);

if (major >= 24) {
  console.error(
    `Node ${process.version} is not supported for Midnight deploy (fast-check / Effect break on Node 24).\n\n` +
      `Use Node 22 LTS, then verify with: node -v\n\n` +
      `Homebrew (recommended on Mac):\n` +
      `  brew install node@22\n` +
      `  export PATH="/opt/homebrew/opt/node@22/bin:$PATH"\n\n` +
      `Or install a version manager:\n` +
      `  brew install fnm && fnm install 22 && fnm use 22\n\n` +
      `Then from this repo: npm run deploy:midnight -w server`
  );
  process.exit(1);
}

if (major < 22) {
  console.error(`Node ${process.version} is too old. Use Node 22+.`);
  process.exit(1);
}
