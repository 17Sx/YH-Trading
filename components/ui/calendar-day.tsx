import type { Trade } from "@/lib/actions/journal.actions";
import clsx from "clsx";

interface CalendarDayProps {
  date: Date;
  trades: Trade[];
  isCurrentMonth: boolean;
}

export function CalendarDay({ date, trades, isCurrentMonth }: CalendarDayProps) {
  const pnl = trades.reduce((sum, t) => sum + t.profit_loss_amount, 0);
  const color =
    pnl > 0 ? "bg-green-500/80 text-black"
    : pnl < 0 ? "bg-red-500/80 text-white"
    : "bg-gray-800/80 text-gray-300";

  return (
    <div
      className={clsx(
        "rounded-lg min-h-[60px] flex flex-col items-center justify-center p-1 transition-all outline-none",
        isCurrentMonth ? color : "opacity-40",
        "focus:ring-2 focus:ring-purple-500 focus:z-10 cursor-pointer"
      )}
      tabIndex={0}
      aria-label={`Jour ${date.getDate()}, ${trades.length} trade${trades.length > 1 ? "s" : ""}, PnL ${pnl}`}
    >
      <span className="text-xs font-bold">{date.getDate()}</span>
      {trades.length > 0 && (
        <>
          <span className="text-sm font-semibold">{pnl > 0 ? "+" : ""}{pnl}%</span>
          <span className="text-xs">{trades.length} trade{trades.length > 1 ? "s" : ""}</span>
        </>
      )}
    </div>
  );
} 