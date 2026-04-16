import { useState } from 'react'
import api from '../api/client'
import { useQueryClient } from '@tanstack/react-query'

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
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await api.delete(`/me/transactions/${id}`)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-trend'] })
      queryClient.invalidateQueries({ queryKey: ['budget-table'] })
    } catch {
      console.error('Error al eliminar')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

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
              <div className="tx-cat">{tx.category} · {tx.date}</div>
            </div>
          </div>

          <div className="tx-right">
            <div className={`tx-amount ${tx.type === 'income' ? 'tx-income' : 'tx-expense'}`}>
              {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
            </div>

            {confirmId === tx.id ? (
              <div className="tx-confirm">
                <span className="tx-confirm-text">¿Eliminar?</span>
                <button
                  className="btn-confirm-yes"
                  onClick={() => handleDelete(tx.id)}
                  disabled={deletingId === tx.id}
                >
                  {deletingId === tx.id ? '...' : 'Sí'}
                </button>
                <button
                  className="btn-confirm-no"
                  onClick={() => setConfirmId(null)}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                className="btn-delete"
                onClick={() => setConfirmId(tx.id)}
                title="Eliminar"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}