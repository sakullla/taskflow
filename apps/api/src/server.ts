import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/lists", (_req, res) => {
  res.json([
    { id: "default", name: "Tasks", color: "blue" }
  ]);
});

app.get("/tasks", (_req, res) => {
  res.json([
    {
      id: "task-1",
      listId: "default",
      title: "Ship MVP scaffold",
      isCompleted: false,
      isImportant: true
    }
  ]);
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
