const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// サーバー情報を格納
let servers = [
  // 例: { name: "サーバーA", ip: "127.0.0.1", port: 3000, players: [] }
];

// サーバー追加
app.post("/servers", (req, res) => {
  const { name, ip, port } = req.body;
  if (!name || !ip || !port) return res.status(400).json({ error: "情報不足" });

  // 既存サーバーに同じポートがあれば追加不可
  if (servers.find(s => s.port === port))
    return res.status(400).json({ error: "このポートはすでに使用されています" });

  servers.push({ name, ip, port, players: [] });
  res.json({ message: "サーバー追加成功", servers });
});

// サーバー一覧
app.get("/servers", (req, res) => {
  res.json(servers);
});

// サーバー参加
app.get("/servers/:port/join", (req, res) => {
  const portNum = parseInt(req.params.port);
  const name = req.query.name;
  const server = servers.find(s => s.port === portNum);
  if (!server) return res.status(404).json({ error: "サーバー未登録" });
  if (!server.players.includes(name)) server.players.push(name);
  res.json({ server });
});

// サーバー退出
app.get("/servers/:port/leave", (req, res) => {
  const portNum = parseInt(req.params.port);
  const name = req.query.name;
  const server = servers.find(s => s.port === portNum);
  if (!server) return res.status(404).json({ error: "サーバー未登録" });
  server.players = server.players.filter(p => p !== name);
  res.json({ server });
});

// サーバー起動
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
