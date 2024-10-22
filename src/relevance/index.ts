import {
  fetchMarkPriceKline,
  fetchOpenInterest,
  getCoinsSymbol,
} from "../market";
import type { Symbol } from "../market/symbols";
import { getHistoryCoinAsCandles } from "../ticker";
import { calculatePercentage } from "../utils";
import { getMarkPriceStats } from "./stats/markPrice";
import { getOpenInterestStats } from "./stats/openInterest";

interface Coin {
  markPrice?: number;
  markPriceSide?: "Sell" | "Buy";
  openInterest?: number;
  ticker?: number;
}
type Coins = Partial<Record<Symbol, Coin>>;
const coins: Coins = {};

interface SetCoinStats {
  <K extends keyof Coin>(params: {
    symbol: Symbol;
    field: K;
    value: Coin[K];
  }): void;
}
const setCoinStats: SetCoinStats = ({ symbol, field, value }) => {
  coins[symbol] = { ...coins[symbol], [field]: value };
};

const addOpenPositions = async () => {
  for (const symbol of getCoinsSymbol()) {
    try {
      const data = await fetchOpenInterest({
        symbol: symbol,
        interval: "5min",
        limit: 12,
      });

      console.log(`openInterest: ${symbol}`);

      setCoinStats({
        symbol: symbol,
        field: "openInterest",
        value: getOpenInterestStats(data),
      });
    } catch (error) {
      console.error(
        `Не удаётся получить историю открытых позиций: ${symbol}`,
        error
      );
    }
  }
};

const addMarkPrice = async () => {
  for (const symbol of getCoinsSymbol()) {
    try {
      const data = await fetchMarkPriceKline({
        symbol: symbol,
        interval: "5",
        limit: 12,
      });

      console.log(`markPrice: ${symbol}`);

      const markPrice = getMarkPriceStats(data);

      setCoinStats({
        symbol: symbol,
        field: "markPrice",
        value: Math.abs(markPrice),
      });

      setCoinStats({
        symbol: symbol,
        field: "markPriceSide",
        value: markPrice >= 0 ? "Buy" : "Sell",
      });
    } catch (error) {
      console.error(`Не удаётся получить историю mark price: ${symbol}`, error);
    }
  }
};

const addTicker = () => {
  for (const symbol of getCoinsSymbol()) {
    const data = getHistoryCoinAsCandles({ symbol: symbol, interval: 1 });
    console.log("ticker", symbol);
    setCoinStats({
      symbol: symbol,
      field: "ticker",
      value: data[0].markPrice?.quantity,
    });
  }
};

const getNormalizedStatistics = () => {
  const localCoins: Coins = {};
  const markPrice: number[] = [];
  const openInterest: number[] = [];
  const ticker: number[] = [];

  Object.values(coins).forEach((coin) => {
    markPrice.push(coin.markPrice ?? 0);
    openInterest.push(coin.openInterest ?? 0);
    ticker.push(coin.ticker ?? 0);
  });

  const maxMarkPrice = Math.max(...markPrice);
  const maxOpenInterest = Math.max(...openInterest);
  const maxTicker = Math.max(...ticker);

  Object.keys(coins).forEach((key) => {
    const symbol = key as Symbol;
    localCoins[symbol] = {
      ...coins[symbol],
      markPrice: calculatePercentage({
        part: coins[symbol]?.markPrice ?? 0,
        total: maxMarkPrice,
      }),
      openInterest: calculatePercentage({
        part: coins[symbol]?.openInterest ?? 0,
        total: maxOpenInterest,
      }),
      ticker: calculatePercentage({
        part: coins[symbol]?.ticker ?? 0,
        total: maxTicker,
      }),
    };
  });

  return transformData(localCoins as InputData).slice(0, 10);
};

interface SymbolData {
  openInterest: number;
  markPrice: number;
  ticker: number;
  markPriceSide: "Buy" | "Sell"; // Убедимся, что side может быть только 'Buy' или 'Sell'
}

interface InputData {
  [symbol: string]: SymbolData;
}

interface ResultData {
  symbol: string;
  value: number;
  side: "Buy" | "Sell";
}

function transformData(data: InputData): ResultData[] {
  return Object.entries(data)
    .map(([symbol, { openInterest, markPrice, ticker, markPriceSide }]) => ({
      symbol,
      value: openInterest + markPrice + ticker,
      side: markPriceSide,
    }))
    .sort((a, b) => b.value - a.value);
}

export {
  addOpenPositions,
  addMarkPrice,
  coins,
  getNormalizedStatistics,
  addTicker,
};
