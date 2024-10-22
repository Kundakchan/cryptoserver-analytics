import { fetchMarkPriceKline } from "../../market";

interface Data extends Awaited<ReturnType<typeof fetchMarkPriceKline>> {}
interface GetMarkPriceStats {
  (params: Data): number;
}
const getMarkPriceStats: GetMarkPriceStats = (data) => {
  const differenceInMarkPrice = calculatePercentageChange(data.reverse());
  return calculateMedian(differenceInMarkPrice);
};

function calculatePercentageChange(data: Data) {
  // Проверяем, есть ли хотя бы два элемента в массиве
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error(
      "Входные данные должны быть массивом с как минимум двумя элементами."
    );
  }

  return data.slice(1).map((current, index) => {
    const previous = parseFloat(data[index].closePrice);
    const currentValue = parseFloat(current.closePrice);

    if (isNaN(previous) || isNaN(currentValue)) {
      throw new Error(
        "Некорректное значение openInterest. Должно быть числом."
      );
    }

    // Вычисляем процентное изменение
    const percentageChange = ((currentValue - previous) / previous) * 100;

    return parseFloat(percentageChange.toFixed(2));
  });
}

/**
 *
 * @param numbers Принимает массив чисел который отражают в процентах разницу изменения между ценами
 * @returns Возвращается средняя медиальное значение изменения цены в процентах
 */
function calculateMedian(numbers) {
  // Сортируем массив по возрастанию
  const sorted = numbers.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  // Если количество элементов нечётное, возвращаем средний элемент
  if (sorted.length % 2 !== 0) {
    return sorted[middle];
  } else {
    // Если чётное, возвращаем среднее значение двух центральных элементов
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
}

export { getMarkPriceStats };
