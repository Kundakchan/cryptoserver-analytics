import { fetchOpenInterest } from "../../market";
import { sum } from "../../utils";
interface Data extends Awaited<ReturnType<typeof fetchOpenInterest>> {}

interface GetOpenInterestStats {
  (params: Data): number;
}
const getOpenInterestStats: GetOpenInterestStats = (data) => {
  const differenceInAmounts = calculatePercentageChange(data);
  return sum(differenceInAmounts);
};

function calculatePercentageChange(data: Data) {
  // Проверяем, есть ли хотя бы два элемента в массиве
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error(
      "Входные данные должны быть массивом с как минимум двумя элементами."
    );
  }

  return data.slice(1).map((current, index) => {
    const previous = parseFloat(data[index].openInterest);
    const currentValue = parseFloat(current.openInterest);

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

export { getOpenInterestStats };
