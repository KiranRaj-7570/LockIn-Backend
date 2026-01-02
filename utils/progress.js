export const calculateProgress = (days = {}, month, year) => {
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  const completedDays = Object.values(days).filter(Boolean).length;

  const percentage =
    totalDaysInMonth === 0
      ? 0
      : Math.round((completedDays / totalDaysInMonth) * 100);

  return {
    completedDays,
    totalDaysInMonth,
    percentage,
  };
};
