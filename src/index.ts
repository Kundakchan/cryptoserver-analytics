import {
  fetchKline,
  fetchLongShortRatio,
  fetchOpenInterest,
  fetchCoins,
} from "./market";
import { watchTicker } from "./ticker";

export const SETTING = {
  TIME_UPDATE_HISTORY_INDEX: 1, // (сек)
};

const app = async () => {
  try {
    await fetchCoins();
    watchTicker();

    await fetchOpenInterest({ symbol: "BTCUSDT", interval: "5min" });
    await fetchLongShortRatio({ symbol: "BTCUSDT", interval: "5min" });
    await fetchKline({ symbol: "BTCUSDT", interval: "5" });
  } catch (error) {
    console.error("Ошибка при запуске приложения:");
    throw error;
  }
};

app();
