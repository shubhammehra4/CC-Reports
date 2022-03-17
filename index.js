const main = require("./app");

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
