import { CalendarDay } from "./calendar-day";
import type { Trade } from "@/lib/actions/journal.actions";

interface CalendarMonthProps {
  year: number;
  month: number; 
  trades: Trade[];
}

function getMonthDays(year: number, month: number) {
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekDay = firstDay.getDay();
  for (let i = firstWeekDay - 1; i >= 0; i--) {
    const d = new Date(year, month, 1 - i - 1);
    days.push({ date: d, isCurrentMonth: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  while (days.length % 7 !== 0) {
    const d = new Date(year, month + 1, days.length - (firstWeekDay + lastDay.getDate()) + 1);
    days.push({ date: d, isCurrentMonth: false });
  }
  return days;
}

function groupTradesByDay(trades: Trade[]) {
  const map: Record<string, Trade[]> = {};
  for (const t of trades) {
    const key = t.trade_date.slice(0, 10); 
    if (!map[key]) map[key] = [];
    map[key].push(t);
  }
  return map;
}

function getUTCDateKey(date: Date) {
  const yyyy = date.getUTCFullYear();
  const mm = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = date.getUTCDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function CalendarMonth({ year, month, trades }: CalendarMonthProps) {
  const days = getMonthDays(year, month);
  const tradesByDay = groupTradesByDay(trades);

  return (
    <div className="grid grid-cols-7 gap-2 w-full max-w-3xl">
      {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((d) => (
        <div key={d} className="text-xs text-gray-400 text-center">{d}</div>
      ))}
      {days.map(({ date, isCurrentMonth }, idx) => {
        const dateKey = getUTCDateKey(date);
        return (
          <CalendarDay
            key={idx}
            date={date}
            trades={tradesByDay[dateKey] || []}
            isCurrentMonth={isCurrentMonth}
          />
        );
      })}
    </div>
  );
} 