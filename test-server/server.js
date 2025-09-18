const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const port = 3000;

// CORSを有効化（どこからでもアクセス可能）
app.use(cors());

// 現在のディレクトリにある静的ファイル (index.htmlなど) を配信する設定
// console.log(__dirname);
app.use(express.static(__dirname));

// サーバーの状態確認
let players = [];

app.get("/status", (req, res) => {
  res.json({ status: "running", playerCount: players.length });
});

app.get("/join", (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: "名前を指定してください" });
  if (!players.includes(name)) players.push(name);
  res.json({ message: `${name} が参加しました！`, players });
});

app.get("/players", (req, res) => {
  res.json({ players });
});

app.get("/leave", (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: "名前を指定してください" });
  players = players.filter(p => p !== name);
  res.json({ message: `${name} が退出しました`, players });
});

// サーバー起動
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
