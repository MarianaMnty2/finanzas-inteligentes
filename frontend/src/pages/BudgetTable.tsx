import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const INCOME_CATS = ['Salario','Freelance','Inversiones','Arriendo','Bonos','Otros ingresos']

const VITAL_CATS = ['Transporte','Servicios públicos','Arriendo','Salud','Educación','Deudas']

const LEISURE_CATS = ['Entretenimiento','Ropa','Comer afuera','Regalos','Otros gastos']

const fmt = (n: number) => n > 0 ? '$' + Math.round(n).toLocaleString('es-CO') : ''

export default function BudgetTable() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const [theme, setTheme] = useState<'dark'|'light'>(
    document.documentElement.getAttribute('data-theme') as 'dark'|'light' || 'dark'
  )

  const { data: raw = {}, isLoading } = useQuery({
    queryKey: ['budget-table'],
    queryFn: () => api.get('/me/budget-table').then(r => r.data),
    refetchInterval: 15000,
  })

  // Construir mapa: category -> month -> total
  const getTotal = (category: string, monthIndex: number): number => {
    const monthData = raw[monthIndex + 1] || []
    const found = monthData.find((r: any) => r.category === category)
    return found ? found.total : 0
  }

  const getRowTotal = (category: string): number => {
    return MONTHS.reduce((acc, _, i) => acc + getTotal(category, i), 0)
  }

  const getSectionTotal = (cats: string[], monthIndex: number): number => {
    return cats.reduce((acc, cat) => acc + getTotal(cat, monthIndex), 0)
  }

  const getSectionGrandTotal = (cats: string[]): number => {
    return cats.reduce((acc, cat) => acc + getRowTotal(cat), 0)
  }

  const getSavings = (monthIndex: number): number => {
    const inc = getSectionTotal(INCOME_CATS, monthIndex)
    const vital = getSectionTotal(VITAL_CATS, monthIndex)
    const leisure = getSectionTotal(LEISURE_CATS, monthIndex)
    return inc - vital - leisure
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  if (isLoading) return <div className="loading">Cargando tabla...</div>

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="logo">Finanzas Inteligentes</div>
        <div className="topbar-right">
          <button className="btn-logout" onClick={() => navigate('/dashboard')}>
            ← Dashboard
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
        <div className="table-wrapper">
          <table className="budget-table">
            <thead>
              <tr>
                <th className="col-cat">Categoría</th>
                {MONTHS.map(m => <th key={m}>{m}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>

              {/* ── INGRESOS ── */}
              <tr className="section-header income-header">
                <td colSpan={14}>INGRESOS</td>
              </tr>
              {INCOME_CATS.map(cat => (
                <tr key={cat} className="data-row">
                  <td className="col-cat">{cat}</td>
                  {MONTHS.map((_, i) => (
                    <td key={i} className="amount income-amount">
                      {fmt(getTotal(cat, i))}
                    </td>
                  ))}
                  <td className="amount income-amount total-col">
                    {fmt(getRowTotal(cat))}
                  </td>
                </tr>
              ))}
              <tr className="section-total income-total">
                <td>Total Ingresos</td>
                {MONTHS.map((_, i) => (
                  <td key={i} className="amount">
                    {fmt(getSectionTotal(INCOME_CATS, i))}
                  </td>
                ))}
                <td className="amount">{fmt(getSectionGrandTotal(INCOME_CATS))}</td>
              </tr>

              {/* ── GASTOS VITALES ── */}
              <tr className="section-header vital-header">
                <td colSpan={14}>GASTOS VITALES</td>
              </tr>
              {VITAL_CATS.map(cat => (
                <tr key={cat} className="data-row">
                  <td className="col-cat">{cat}</td>
                  {MONTHS.map((_, i) => (
                    <td key={i} className="amount expense-amount">
                      {fmt(getTotal(cat, i))}
                    </td>
                  ))}
                  <td className="amount expense-amount total-col">
                    {fmt(getRowTotal(cat))}
                  </td>
                </tr>
              ))}
              <tr className="section-total vital-total">
                <td>Total gastos vitales</td>
                {MONTHS.map((_, i) => (
                  <td key={i} className="amount">
                    {fmt(getSectionTotal(VITAL_CATS, i))}
                  </td>
                ))}
                <td className="amount">{fmt(getSectionGrandTotal(VITAL_CATS))}</td>
              </tr>

              {/* ── GASTOS DE OCIO ── */}
              <tr className="section-header leisure-header">
                <td colSpan={14}>GASTOS EXTRAORDINARIOS Y OCIO</td>
              </tr>
              {LEISURE_CATS.map(cat => (
                <tr key={cat} className="data-row">
                  <td className="col-cat">{cat}</td>
                  {MONTHS.map((_, i) => (
                    <td key={i} className="amount leisure-amount">
                      {fmt(getTotal(cat, i))}
                    </td>
                  ))}
                  <td className="amount leisure-amount total-col">
                    {fmt(getRowTotal(cat))}
                  </td>
                </tr>
              ))}
              <tr className="section-total leisure-total">
                <td>Total gastos ocio</td>
                {MONTHS.map((_, i) => (
                  <td key={i} className="amount">
                    {fmt(getSectionTotal(LEISURE_CATS, i))}
                  </td>
                ))}
                <td className="amount">{fmt(getSectionGrandTotal(LEISURE_CATS))}</td>
              </tr>

              {/* ── AHORRO ── */}
              <tr className="savings-row">
                <td>Ahorro</td>
                {MONTHS.map((_, i) => (
                  <td key={i} className={`amount ${getSavings(i) < 0 ? 'negative' : 'savings-amount'}`}>
                    {fmt(Math.abs(getSavings(i))) ? (getSavings(i) < 0 ? '-' : '') + fmt(Math.abs(getSavings(i))) : ''}
                  </td>
                ))}
                <td className="amount savings-amount">
                  {fmt(getSectionGrandTotal(INCOME_CATS) - getSectionGrandTotal(VITAL_CATS) - getSectionGrandTotal(LEISURE_CATS))}
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}