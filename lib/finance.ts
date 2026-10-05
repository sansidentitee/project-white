type TradeLike = {
  status: "open" | "closed";
  entry: number;
  exit?: number | null;
  quantity: number;
  direction: "long" | "short";
  closedAt?: string | null;
  openedAt: string;
  asset: string;
};
export function pnl(trade: TradeLike) {
  return trade.status === "closed" && trade.exit != null
    ? (trade.exit - trade.entry) *
        trade.quantity *
        (trade.direction === "long" ? 1 : -1)
    : 0;
}
export function tradingSummary(trades: TradeLike[]) {
  const closed = trades
    .filter((t) => t.status === "closed")
    .sort((a, b) =>
      (a.closedAt || a.openedAt).localeCompare(b.closedAt || b.openedAt),
    );
  const wins = closed.filter((t) => pnl(t) > 0),
    losses = closed.filter((t) => pnl(t) < 0);
  const gains = wins.reduce((s, t) => s + pnl(t), 0),
    loss = Math.abs(losses.reduce((s, t) => s + pnl(t), 0));
  let balance = 0,
    peak = 0,
    drawdown = 0;
  const curve = closed.map((t) => {
    balance += pnl(t);
    peak = Math.max(peak, balance);
    drawdown = Math.max(drawdown, peak - balance);
    return { day: (t.closedAt || t.openedAt).slice(0, 10), balance };
  });
  return {
    closed,
    wins: wins.length,
    losses: losses.length,
    breakeven: closed.length - wins.length - losses.length,
    total: gains - loss,
    winRate: closed.length ? (wins.length / closed.length) * 100 : null,
    expectancy: closed.length ? (gains - loss) / closed.length : null,
    profitFactor: loss > 0 ? gains / loss : null,
    drawdown,
    curve,
  };
}
export function positionSize(
  capital: number,
  riskPercent: number,
  entry: number,
  stop: number,
) {
  if (
    ![capital, riskPercent, entry, stop].every(Number.isFinite) ||
    capital <= 0 ||
    riskPercent <= 0 ||
    riskPercent > 100 ||
    entry <= 0 ||
    stop <= 0 ||
    entry === stop
  )
    return null;
  const riskAmount = (capital / 100) * riskPercent;
  if (!Number.isFinite(riskAmount / Math.abs(entry - stop))) return null;
  return {
    riskAmount,
    quantity: riskAmount / Math.abs(entry - stop),
    distance: Math.abs(entry - stop),
  };
}
