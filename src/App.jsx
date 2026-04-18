import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import PropTypes from 'prop-types'
import './App.css'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

const CATEGORIAS = ['Aluguel', 'Alimentação', 'Lazer', 'Salário', 'Transporte', 'Outros']

function TransactionCard({ descricao, valor, tipo, categoria, onDelete }) {
  const estiloValor = {
    color: tipo === 'Entrada' ? '#2ecc71' : '#e74c3c',
    fontWeight: 'bold'
  }

  return (
    <div className="transaction-card">
      <div className="transaction-info">
        <span className="transaction-desc">{descricao}</span>
        <span className="transaction-cat">{categoria}</span>
      </div>
      <div className="transaction-actions">
        <span style={estiloValor}>
          {tipo === 'Entrada' ? '+ ' : '- '} R$ {valor}
        </span>
        <button className="delete-btn" onClick={onDelete}>×</button>
      </div>
    </div>
  )
}

TransactionCard.propTypes = {
  descricao: PropTypes.string.isRequired,
  valor: PropTypes.number.isRequired,
  tipo: PropTypes.string.isRequired,
  categoria: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired
}

function App() {
  const [transacoes, setTransacoes] = useState(() => {
    const saved = localStorage.getItem('financevision_transacoes')
    return saved ? JSON.parse(saved) : []
  })
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState('Entrada')
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [filtro, setFiltro] = useState('Todos')
  const [erro, setErro] = useState('')

  useEffect(() => {
    localStorage.setItem('financevision_transacoes', JSON.stringify(transacoes))
  }, [transacoes])

  const totalEntradas = transacoes
    .filter(t => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + Number(t.valor), 0)

  const totalSaidas = transacoes
    .filter(t => t.tipo === 'Saída')
    .reduce((acc, t) => acc + Number(t.valor), 0)

  const saldo = totalEntradas - totalSaidas

  const despesasPorCategoria = transacoes
    .filter(t => t.tipo === 'Saída')
    .reduce((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + Number(t.valor)
      return acc
    }, {})

  const labelsDespesas = Object.keys(despesasPorCategoria)
  const dadosDespesas = Object.values(despesasPorCategoria)

  const cores = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']

  const dataDoughnut = {
    labels: labelsDespesas,
    datasets: [{
      data: dadosDespesas,
      backgroundColor: cores.slice(0, labelsDespesas.length),
      borderWidth: 0
    }]
  }

  const dataBarras = {
    labels: ['Entradas', 'Saídas'],
    datasets: [{
      label: 'Fluxo de Caixa',
      data: [totalEntradas, totalSaidas],
      backgroundColor: ['#2ecc71', '#e74c3c']
    }]
  }

  const transacoesFiltradas = transacoes.filter(t => {
    if (filtro === 'Todos') return true
    return t.tipo === filtro
  })

  const adicionarTransacao = (e) => {
    e.preventDefault()
    setErro('')

    if (!descricao.trim()) {
      setErro('Descrição obrigatória')
      return
    }
    if (!valor || Number(valor) <= 0) {
      setErro('Valor deve ser positivo')
      return
    }

    const novaTransacao = {
      id: Date.now(),
      descricao,
      valor: Number(valor),
      tipo,
      categoria
    }

    setTransacoes([...transacoes, novaTransacao])
    setDescricao('')
    setValor('')
  }

  const removerTransacao = (id) => {
    setTransacoes(transacoes.filter(t => t.id !== id))
  }

  return (
    <div className="app">
      <header>
        <h1>FinanceVision</h1>
      </header>

      <div className="resumo">
        <div className="card saldo">
          <span>Saldo Atual</span>
          <strong>R$ {saldo.toFixed(2)}</strong>
        </div>
        <div className="card entradas">
          <span>Entradas</span>
          <strong>R$ {totalEntradas.toFixed(2)}</strong>
        </div>
        <div className="card saidas">
          <span>Saídas</span>
          <strong>R$ {totalSaidas.toFixed(2)}</strong>
        </div>
      </div>

      <div className="graficos">
        <div className="grafico">
          <h3>Entradas vs Saídas</h3>
          <Bar data={dataBarras} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="grafico">
          <h3>Despesas por Categoria</h3>
          {labelsDespesas.length > 0 ? (
            <Doughnut data={dataDoughnut} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          ) : (
            <p className="sem-dados">Nenhuma despesa registrada</p>
          )}
        </div>
      </div>

      <form className="form-transacao" onSubmit={adicionarTransacao}>
        <h3>Nova Transação</h3>
        {erro && <p className="erro">{erro}</p>}
        <input
          type="text"
          placeholder="Descrição"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
        />
        <input
          type="number"
          placeholder="Valor"
          value={valor}
          onChange={e => setValor(e.target.value)}
          min="0"
          step="0.01"
        />
        <select value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="Entrada">Entrada</option>
          <option value="Saída">Saída</option>
        </select>
        <select value={categoria} onChange={e => setCategoria(e.target.value)}>
          {CATEGORIAS.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button type="submit">Adicionar</button>
      </form>

      <div className="filtros">
        <button
          className={filtro === 'Todos' ? 'active' : ''}
          onClick={() => setFiltro('Todos')}
        >
          Todos
        </button>
        <button
          className={filtro === 'Entrada' ? 'active' : ''}
          onClick={() => setFiltro('Entrada')}
        >
          Receitas
        </button>
        <button
          className={filtro === 'Saída' ? 'active' : ''}
          onClick={() => setFiltro('Saída')}
        >
          Despesas
        </button>
      </div>

      <div className="lista-transacoes">
        {transacoesFiltradas.map(item => (
          <TransactionCard
            key={item.id}
            descricao={item.descricao}
            valor={item.valor}
            tipo={item.tipo}
            categoria={item.categoria}
            onDelete={() => removerTransacao(item.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default App