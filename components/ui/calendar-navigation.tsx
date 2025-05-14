interface CalendarNavigationProps {
  year: number;
  month: number;
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
}

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export function CalendarNavigation({ year, month, setYear, setMonth }: CalendarNavigationProps) {
  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }
  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={prevMonth}
        aria-label="Mois précédent"
        className="px-2 py-1 rounded bg-gray-800 hover:bg-purple-700/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        {"<"}
      </button>
      <span className="font-bold text-lg min-w-[120px] text-center">
        {monthNames[month]} {year}
      </span>
      <button
        onClick={nextMonth}
        aria-label="Mois suivant"
        className="px-2 py-1 rounded bg-gray-800 hover:bg-purple-700/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        {">"}
      </button>
    </div>
  );
} 