import Boom from "@hapi/boom";
import dotent from "dotenv";
import express from "express";

//routes
import auth from "./routes/auth";
import webhooks from "./routes/webhooks";

dotent.config(); 
const app = express();

app.use(express.json());
app.use("/auth", auth);
app.use("/webhooks", webhooks);

app.use((req, res, next) => {
  return next(Boom.notFound("Not Found"));
});

app.use((err, req, res, next) => {
  if (err) {
    if (err.output) {
      return res.status(err.output.statusCode || 500).json(err.output.payload);
    }
  }
  return res.status(500).json(err);
});

const port = 4000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});
