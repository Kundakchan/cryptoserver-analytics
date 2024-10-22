import {
  fetchKline,
  fetchLongShortRatio,
  fetchOpenInterest,
  fetchCoins,
  getCoinsSymbol,
} from "./market";
import {
  addMarkPrice,
  addOpenPositions,
  addTicker,
  coins,
  getNormalizedStatistics,
} from "./relevance";
import { getOpenInterestStats } from "./relevance/stats/openInterest";
import { getHistoryCoinAsCandles, watchTicker } from "./ticker";

export const SETTING = {
  TIME_UPDATE_HISTORY_INDEX: 5 * 60, // (сек)
  TIME_CHECK_COIN: 5, // Время проверки актуальности монеты (мин)
};

const app = async () => {
  try {
    await fetchCoins();
    watchTicker();
    checkCoin();
  } catch (error) {
    console.error("Ошибка при запуске приложения:");
    throw error;
  }
};

const checkCoin = async () => {
  setTimeout(() => {
    checkCoin();
  }, SETTING.TIME_CHECK_COIN * (60 * 1000));
  await addOpenPositions();
  await addMarkPrice();
  addTicker();
  getNormalizedStatistics().forEach((coin) => {
    console.log({
      ...coin,
      url: `https://www.bybit.com/trade/usdt/${coin.symbol}`,
    });
  });
};

app();
