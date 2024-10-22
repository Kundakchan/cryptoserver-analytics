import {
  KlineIntervalV3,
  OpenInterestIntervalV5,
  LinearInverseInstrumentInfoV5,
} from "bybit-api";
import { client } from "../client";
import { Symbol } from "../market/symbols";

import chalk from "chalk";
import { convertTimestampToDate } from "../utils";

interface InstrumentInfo
  extends Partial<Record<Symbol, LinearInverseInstrumentInfoV5>> {}

const instrumentsInfo: InstrumentInfo = {};
const fetchCoins = async () => {
  try {
    console.log(chalk.blue("Получения списка монет..."));
    const { result } = await client.getInstrumentsInfo({
      category: "linear",
      status: "Trading",
    });

    result.list.forEach((coin) => {
      if (coin.quoteCoin === "USDT") {
        instrumentsInfo[coin.symbol as Symbol] = coin;
      }
    });
    console.log(chalk.green("Монеты успешно получены!"));
    return instrumentsInfo;
  } catch (error) {
    console.log(chalk.red("Ошибка получения списка монет"));
    console.error(error);
    throw error;
  }
};

const fetchOpenInterest = async ({
  symbol,
  interval,
  limit = 50,
}: {
  symbol: Symbol;
  interval: OpenInterestIntervalV5;
  limit?: number;
}) => {
  try {
    const result = await client.getOpenInterest({
      category: "linear",
      symbol: symbol,
      intervalTime: interval,
      limit: limit,
    });

    return result.result.list.map((item) => ({
      ...item,
      timestamp: new Date(Number(item.timestamp)),
    }));
  } catch (error) {
    console.error(`Ошибка получения открытых позиций: ${symbol}`);
    throw error;
  }
};

const fetchLongShortRatio = async ({
  symbol,
  interval,
}: {
  symbol: Symbol;
  interval: OpenInterestIntervalV5;
}) => {
  try {
    const result = await client.getLongShortRatio({
      category: "linear",
      symbol: symbol,
      period: interval,
    });
    return result.result.list.map((item) => ({
      ...item,
      timestamp: new Date(Number(item.timestamp)),
    }));
  } catch (error) {
    console.error(`Ошибка получения long / short соотношение: ${symbol}`);
    throw error;
  }
};

const fetchKline = async ({
  symbol,
  interval,
}: {
  symbol: Symbol;
  interval: KlineIntervalV3;
}) => {
  try {
    const result = await client.getKline({
      category: "linear",
      symbol: symbol,
      interval: interval,
    });

    return result.result.list.map((item) => ({
      startTime: new Date(Number(item[0])),
      openPrice: item[1],
      highPrice: item[2],
      lowPrice: item[3],
      closePrice: item[4],
      volume: item[5],
      turnover: item[6],
    }));
  } catch (error) {
    console.error(`Ошибка получения истории формирование цены: ${symbol}`);
    throw error;
  }
};

const fetchMarkPriceKline = async ({
  symbol,
  interval,
  limit = 50,
}: {
  symbol: Symbol;
  interval: KlineIntervalV3;
  limit: number;
}) => {
  try {
    const result = await client.getMarkPriceKline({
      category: "linear",
      symbol: symbol,
      interval: interval,
      limit: limit,
    });

    return result.result.list.map((item) => ({
      startTime: new Date(Number(item[0])),
      openPrice: item[1],
      highPrice: item[2],
      lowPrice: item[3],
      closePrice: item[4],
    }));
  } catch (error) {
    console.error(
      `Ошибка получения истории формирование mark price: ${symbol}`
    );
    throw error;
  }
};

const getCoinsSymbol = () => Object.keys(instrumentsInfo) as Symbol[];

export {
  fetchOpenInterest,
  fetchLongShortRatio,
  fetchKline,
  fetchMarkPriceKline,
  fetchCoins,
  getCoinsSymbol,
};
