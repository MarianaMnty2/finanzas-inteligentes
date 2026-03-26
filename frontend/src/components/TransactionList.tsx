interface Transaction {
  id: number
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

interface Props {
  transactions: Transaction[]
}

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-CO')

export default function TransactionList({ transactions }: Props) {
  if (transactions.length === 0) {
    return <div className="tx-empty">Aún no hay transacciones</div>
  }

  return (
    <div className="tx-list">
      {transactions.map((tx) => (
        <div key={tx.id} className="tx-item">
          <div className="tx-left">
            <div className={`tx-icon ${tx.type === 'income' ? 'tx-icon-income' : 'tx-icon-expense'}`}>
              {tx.type === 'income' ? '↑' : '↓'}
            </div>
            <div>
              <div className="tx-desc">{tx.description}</div>
              <div className="tx-cat">{tx.category}</div>
            </div>
          </div>
          <div className="tx-right">
            <div className={`tx-amount ${tx.type === 'income' ? 'tx-income' : 'tx-expense'}`}>
              {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
            </div>
            <div className="tx-date">{tx.date}</div>
          </div>
        </div>
      ))}
    </div>
  )
}