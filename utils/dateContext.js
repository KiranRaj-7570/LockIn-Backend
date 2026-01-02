export const getMonthYear = (inputMonth, inputYear) => {
  const now = new Date();

  const month = Number(inputMonth) || now.getMonth() + 1;
  const year = Number(inputYear) || now.getFullYear();

  return { month, year };
};