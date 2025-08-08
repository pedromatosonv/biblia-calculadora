import React from 'react'
import PlannerForm from './components/PlannerForm'

export default function App() {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">Calculadora de Término da Leitura da Bíblia</h1>
        <p className="text-slate-400">Planeje quando você termina a leitura com base no ponto atual e quantos capítulos por dia pretende ler.</p>
      </header>
      <PlannerForm />
      <footer className="text-slate-500 text-sm pt-4">
        Cânon protestante (66 livros). Offline-first. Exporta CSV/ICS. © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
