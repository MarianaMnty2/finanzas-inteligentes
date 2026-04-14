import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import api from '../api/client'

const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

export default function TrendChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<any>(null)

  const { data: raw = {} } = useQuery({
    queryKey: ['weekly-trend'],
    queryFn: () => api.get('/me/weekly-trend').then(r => r.data),
    refetchInterval: 15000,
  })

  useEffect(() => {
    const days = getLast7Days()
    const labels = days.map(d => {
      const date = new Date(d + 'T00:00:00')
      return DAYS_ES[date.getDay()]
    })
    const incomeData = days.map(d => raw[d]?.income ?? 0)
    const expenseData = days.map(d => raw[d]?.expense ?? 0)

    if (!canvasRef.current) return

    // Destruir chart anterior si existe
    if (chartRef.current) {
      chartRef.current.destroy()
    }

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
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Gastos',
            data: expenseData,
            backgroundColor: 'rgba(248,113,113,0.75)',
            borderRadius: 4,
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
              label: (c: any) =>
                c.dataset.label + ': $' + Math.round(c.raw).toLocaleString('es-CO'),
            },
          },
        },
        scales: {
          x: {
            ticks: { color: 'rgba(128,128,128,0.6)', font: { size: 10 } },
            grid: { color: 'rgba(128,128,128,0.08)' },
            border: { display: false },
          },
          y: {
            ticks: {
              color: 'rgba(128,128,128,0.6)',
              font: { size: 10 },
              callback: (v: any) => '$' + Math.round(v).toLocaleString('es-CO'),
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
  }, [raw])

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="section-title">Tendencia — últimos 7 días</span>
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