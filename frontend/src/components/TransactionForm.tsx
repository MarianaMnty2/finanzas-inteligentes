import { useState } from 'react'
import api from '../api/client'

const incomeCategories = ['Salario','Freelance','Inversiones','Arriendo','Bonos','Otros ingresos']
const expenseCategories = ['Alimentación','Transporte','Servicios','Arriendo','Salud','Educación','Entretenimiento','Otros gastos']

interface Props {
  onSuccess: () => void
}

export default function TransactionForm({ onSuccess }: Props) {
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = type === 'income' ? incomeCategories : expenseCategories

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !category) { setError('Completa todos los campos'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/me/transactions', {
        type,
        amount: parseFloat(amount),
        category,
        description: description || category,
        date,
      })
      setAmount('')
      setCategory('')
      setDescription('')
      onSuccess()
    } catch {
      setError('Error al registrar la transacción')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="tx-form">
      <div className="form-tabs">
        <button
          className={`tab ${type === 'income' ? 'tab-income active' : ''}`}
          onClick={() => { setType('income'); setCategory('') }}
          type="button"
        >+ Ingreso</button>
        <button
          className={`tab ${type === 'expense' ? 'tab-expense active' : ''}`}
          onClick={() => { setType('expense'); setCategory('') }}
          type="button"
        >− Gasto</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Monto (COP)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            step="1000"
            required
          />
        </div>
        <div className="field">
          <label>Categoría</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Selecciona...</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Pago nómina"
          />
        </div>
        <div className="field">
          <label>Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button
          type="submit"
          className={`btn-submit ${type === 'income' ? 'btn-income' : 'btn-expense'}`}
          disabled={loading}
        >
          {loading ? 'Registrando...' : type === 'income' ? 'Registrar ingreso' : 'Registrar gasto'}
        </button>
      </form>
    </div>
  )
}