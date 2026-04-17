import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import SummaryCards from '../components/SummaryCards'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import TrendChart from '../components/TrendChart'
import MonthFilter from '../components/MonthFilter'

export default function Dashboard() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  const filterParams = {
    ...(selectedMonth && { month: selectedMonth }),
    year: selectedYear,
  }

  const { data: summary } = useQuery({
    queryKey: ['summary', selectedMonth, selectedYear],
    queryFn: () => api.get('/me/summary', { params: filterParams }).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', selectedMonth, selectedYear],
    queryFn: () => api.get('/me/transactions', { params: filterParams }).then(r => r.data),
  })

  const handleFilterChange = (month: number | null, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['summary'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    queryClient.invalidateQueries({ queryKey: ['weekly-trend'] })
    queryClient.invalidateQueries({ queryKey: ['budget-table'] })
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="logo">◈ FLUJO</div>
        <div className="topbar-right">
          <button className="btn-logout" onClick={() => navigate('/budget')}>
            Ver tabla anual
          </button>
          <button className="theme-btn" onClick={toggleTheme}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="main-content">
        <MonthFilter
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onChange={handleFilterChange}
        />

        <SummaryCards
          balance={summary?.balance ?? 0}
          totalIncome={summary?.total_income ?? 0}
          totalExpenses={summary?.total_expenses ?? 0}
        />

        <TrendChart month={selectedMonth} year={selectedYear} />
        
        <div className="content-grid">
          <div className="left-col">
            <h3 className="section-title">
              Transacciones
              {selectedMonth && ` — ${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][selectedMonth - 1]}`}
            </h3>
            <TransactionList transactions={transactions} />
          </div>
          <div className="right-col">
            <TransactionForm onSuccess={invalidateAll} />
          </div>
        </div>
      </main>
    </div>
  )
}