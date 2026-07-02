const express = require("express");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));

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
