const express = require("express");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const port = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, "config.json");

app.use(express.static("public"));
app.use(express.json());

// ── 기본 설정값 ──────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  api: {
    app_key: "",
    app_secret: "",
    cano: "",
    acnt_prdt_cd: "01",
    url_base: "https://openapivts.koreainvestment.com:9443",
  },
  discord: {
    use_discord: false,
    webhook_url: "",
  },
  trading: {
    buy_amount: 100000,
    sell_profit_percent: 5.0,
    stop_loss_percent: -3.0,
    max_buy_count: 5,
    trading_start_time: "09:00",
    trading_end_time: "15:20",
  },
  stocks: [],
};

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch (_) {}
  return structuredClone(DEFAULT_CONFIG);
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

// ── 설정 API ─────────────────────────────────────────────────────────────────
app.get("/api/config", (_req, res) => {
  res.json(readConfig());
});

app.post("/api/config", (req, res) => {
  try {
    writeConfig(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 서버 관리 API ─────────────────────────────────────────────────────────────
let autostockProcess = null;
const serverLogs = [];

function pushLog(type, msg) {
  serverLogs.push({ time: new Date().toISOString(), type, msg: msg.toString() });
  if (serverLogs.length > 500) serverLogs.shift();
}

app.get("/api/server/status", (_req, res) => {
  const running =
    autostockProcess !== null && autostockProcess.exitCode === null;
  res.json({ running, pid: running ? autostockProcess.pid : null, logs: serverLogs.slice(-100) });
});

app.post("/api/server/start", (req, res) => {
  if (autostockProcess && autostockProcess.exitCode === null) {
    return res.json({ success: false, message: "이미 실행 중입니다." });
  }

  const scriptPath = path.join(__dirname, "autostock.py");
  if (!fs.existsSync(scriptPath)) {
    return res
      .status(404)
      .json({ error: "autostock.py 파일을 찾을 수 없습니다." });
  }

  serverLogs.length = 0;
  autostockProcess = spawn("python", [scriptPath], { cwd: __dirname });

  autostockProcess.stdout.on("data", (d) => pushLog("stdout", d));
  autostockProcess.stderr.on("data", (d) => pushLog("stderr", d));
  autostockProcess.on("close", (code) =>
    pushLog("system", `프로세스 종료 (코드: ${code})`)
  );

  res.json({ success: true, pid: autostockProcess.pid });
});

app.post("/api/server/stop", (_req, res) => {
  if (!autostockProcess || autostockProcess.exitCode !== null) {
    return res.json({ success: false, message: "실행 중인 서버가 없습니다." });
  }
  autostockProcess.kill("SIGTERM");
  res.json({ success: true });
});

// ── 주식 조회 API ─────────────────────────────────────────────────────────────
app.get("/api/stock/:symbol", async (req, res) => {
  const symbol = req.params.symbol?.trim().toUpperCase();

  if (!symbol) {
    return res.status(400).json({ error: "심볼을 입력해 주세요." });
  }

  try {
    const quote = await yahooFinance.quote(symbol);
    return res.json({
      symbol: quote.symbol,
      shortName: quote.shortName || quote.longName || "",
      marketState: quote.marketState || "",
      regularMarketPrice: quote.regularMarketPrice ?? null,
      regularMarketChange: quote.regularMarketChange ?? null,
      regularMarketChangePercent: quote.regularMarketChangePercent ?? null,
      regularMarketVolume: quote.regularMarketVolume ?? null,
      regularMarketDayHigh: quote.regularMarketDayHigh ?? null,
      regularMarketDayLow: quote.regularMarketDayLow ?? null,
      regularMarketPreviousClose: quote.regularMarketPreviousClose ?? null,
      currency: quote.currency || "",
      exchange: quote.fullExchangeName || quote.exchange || "",
    });
  } catch (error) {
    return res.status(500).json({
      error: "주식 정보를 가져오지 못했습니다.",
      detail: error?.message || "unknown error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
