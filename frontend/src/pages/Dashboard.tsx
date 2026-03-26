import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import SummaryCards from '../components/SummaryCards'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import { useState } from 'react'

export default function Dashboard() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const { data: summary } = useQuery({
    queryKey: ['summary'],
    queryFn: () => api.get('/me/summary').then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/me/transactions').then((r) => r.data),
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="logo">Finanzas Inteligentes</div>
        <div className="topbar-right">
          <button className="theme-btn" onClick={toggleTheme}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="main-content">
        <SummaryCards
          balance={summary?.balance ?? 0}
          totalIncome={summary?.total_income ?? 0}
          totalExpenses={summary?.total_expenses ?? 0}
        />

        <div className="content-grid">
          <div className="left-col">
            <h3 className="section-title">Transacciones recientes</h3>
            <TransactionList transactions={transactions} />
          </div>
          <div className="right-col">
            <TransactionForm
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['summary'] })
                queryClient.invalidateQueries({ queryKey: ['transactions'] })
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}