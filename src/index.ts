import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import users from "./routes/users";

const app: Express = express();
const port = 3000;

app.use(express.json());
app.use("/users", users);

app.listen(port, () => {
  console.log("Server is running on port 3000");
});
