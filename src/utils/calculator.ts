const sum = (numbers: number[]) => {
  return numbers.reduce((accumulator, currentValue) => {
    return accumulator + currentValue;
  }, 0);
};

interface CalculatePercentage {
  (params: { part: number; total: number }): number;
}
const calculatePercentage: CalculatePercentage = ({ part, total }) =>
  (part / total) * 100;

export { sum, calculatePercentage };
