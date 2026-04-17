interface Props {
  selectedMonth: number | null
  selectedYear: number
  onChange: (month: number | null, year: number) => void
}

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

export default function MonthFilter({ selectedMonth, selectedYear, onChange }: Props) {
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="month-filter">
      <button
        className={`month-btn ${selectedMonth === null ? 'active' : ''}`}
        onClick={() => onChange(null, selectedYear)}
      >
        Todo el año
      </button>

      {MONTHS.map((name, i) => (
        <button
          key={i}
          className={`month-btn ${selectedMonth === i + 1 ? 'active' : ''}`}
          onClick={() => onChange(i + 1, selectedYear)}
        >
          {name.slice(0, 3)}
        </button>
      ))}

      <select
        className="year-select"
        value={selectedYear}
        onChange={(e) => onChange(selectedMonth, parseInt(e.target.value))}
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  )
}