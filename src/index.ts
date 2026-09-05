import express from "express";
import users from "./routes/users";
import files from "./routes/files";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/users", users);
app.use("/files", files);

app.listen(port, () => {
  console.log("Server is running on port 3000");
});
