import { CalendarDay } from "./calendar-day";
import type { Trade } from "@/lib/actions/journal.actions";

interface CalendarMonthProps {
  year: number;
  month: number; // 0 = janvier
  trades: Trade[];
}

function getMonthDays(year: number, month: number) {
  // Renvoie un tableau d'objets { date: Date, isCurrentMonth: boolean }
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekDay = firstDay.getDay(); // 0 = dimanche
  // Jours du mois précédent pour compléter la première semaine
  for (let i = firstWeekDay - 1; i >= 0; i--) {
    const d = new Date(year, month, 1 - i - 1);
    days.push({ date: d, isCurrentMonth: false });
  }
  // Jours du mois courant
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  // Jours du mois suivant pour compléter la grille (jusqu'à 35 ou 42 cases)
  while (days.length % 7 !== 0) {
    const d = new Date(year, month + 1, days.length - (firstWeekDay + lastDay.getDate()) + 1);
    days.push({ date: d, isCurrentMonth: false });
  }
  return days;
}

function groupTradesByDay(trades: Trade[]) {
  const map: Record<string, Trade[]> = {};
  for (const t of trades) {
    const key = t.trade_date.slice(0, 10); // YYYY-MM-DD
    if (!map[key]) map[key] = [];
    map[key].push(t);
  }
  return map;
}

export function CalendarMonth({ year, month, trades }: CalendarMonthProps) {
  const days = getMonthDays(year, month);
  const tradesByDay = groupTradesByDay(trades);

  return (
    <div className="grid grid-cols-7 gap-2 w-full max-w-3xl">
      {/* En-têtes jours de la semaine */}
      {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((d) => (
        <div key={d} className="text-xs text-gray-400 text-center">{d}</div>
      ))}
      {/* Jours du mois */}
      {days.map(({ date, isCurrentMonth }, idx) => (
        <CalendarDay
          key={idx}
          date={date}
          trades={tradesByDay[date.toISOString().slice(0, 10)] || []}
          isCurrentMonth={isCurrentMonth}
        />
      ))}
    </div>
  );
} 