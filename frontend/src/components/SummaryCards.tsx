interface Props {
  balance: number
  totalIncome: number
  totalExpenses: number
}

const fmt = (n: number) =>
  '$' + Math.round(n).toLocaleString('es-CO')

export default function SummaryCards({ balance, totalIncome, totalExpenses }: Props) {
  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
    : 0

  return (
    <div className="summary-grid">
      <div className={`summary-card balance ${balance < 0 ? 'negative' : ''}`}>
        <span className="card-label">Saldo general</span>
        <span className="card-amount">{fmt(balance)}</span>
        <span className="card-sub">calculado en servidor</span>
      </div>
      <div className="summary-card income">
        <span className="card-label">Ingresos del mes</span>
        <span className="card-amount">{fmt(totalIncome)}</span>
      </div>
      <div className="summary-card expense">
        <span className="card-label">Gastos del mes</span>
        <span className="card-amount">{fmt(totalExpenses)}</span>
        <div className="ratio-bar">
          <div
            className="ratio-fill"
            style={{
              width: `${Math.min(savingsRate < 0 ? 100 : 100 - savingsRate, 100)}%`,
              background: savingsRate < 20 ? '#ef4444' : savingsRate < 50 ? '#f59e0b' : '#22c55e'
            }}
          />
        </div>
      </div>
    </div>
  )
}