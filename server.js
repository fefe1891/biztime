/** Server startup for BizTime. */
require('dotenv').config();
const app = require("./app");
const port = process.env.PORT || 3000;


app.listen(port, function () {
  console.log(`Listening on ${port}`);
});