import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import api from '../api/client'

interface Props {
  month: number | null
  year: number
}

export default function TrendChart({ month, year }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  const { data: response } = useQuery({
    queryKey: ['weekly-trend', month, year],
    queryFn: () => api.get('/me/weekly-trend', {
      params: { month: month || new Date().getMonth() + 1, year }
    }).then(r => r.data),
    refetchInterval: 15000,
  })

  useEffect(() => {
    const raw = response?.data || {}
    const m = response?.month || new Date().getMonth() + 1
    const y = response?.year || new Date().getFullYear()

    // Generar todos los días del mes
    const daysInMonth = new Date(y, m, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    })

    const labels = days.map(d => String(parseInt(d.split('-')[2])))
    const incomeData = days.map(d => raw[d]?.income ?? 0)
    const expenseData = days.map(d => raw[d]?.expense ?? 0)

    if (!canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()

    const Chart = (window as any).Chart
    if (!Chart) return

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: incomeData,
            backgroundColor: 'rgba(74,222,128,0.75)',
            borderRadius: 3,
            borderSkipped: false,
          },
          {
            label: 'Gastos',
            data: expenseData,
            backgroundColor: 'rgba(248,113,113,0.75)',
            borderRadius: 3,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items: any) => `Día ${items[0].label}`,
              label: (c: any) =>
                c.dataset.label + ': $' + Math.round(c.raw).toLocaleString('es-CO'),
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: 'rgba(128,128,128,0.6)',
              font: { size: 9 },
              maxTicksLimit: 10,
            },
            grid: { color: 'rgba(128,128,128,0.08)' },
            border: { display: false },
          },
          y: {
            ticks: {
              color: 'rgba(128,128,128,0.6)',
              font: { size: 9 },
              callback: (v: any) =>
                v === 0 ? '$0' : '$' + Math.round(v).toLocaleString('es-CO'),
            },
            grid: { color: 'rgba(128,128,128,0.08)' },
            border: { display: false },
          },
        },
      },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [response])

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="section-title">
          Movimientos — {MONTHS_ES[(response?.month ?? new Date().getMonth() + 1) - 1]} {response?.year ?? new Date().getFullYear()}
        </span>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot income-dot"></span>Ingresos
          </span>
          <span className="legend-item">
            <span className="legend-dot expense-dot"></span>Gastos
          </span>
        </div>
      </div>
      <div style={{ position: 'relative', height: '200px' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  )
}