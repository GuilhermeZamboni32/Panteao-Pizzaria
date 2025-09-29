/*import React, { useState } from 'react'
import './Contato.css'
import Header from '../../components/pastaheader/Header'

const membros = [
  { nome: "Guilherme Zamboni", foto: "public/carrossel/gui.jpg" },
  { nome: "Jonathan Stülp", foto: "public/carrossel/jojo.jpg" },
  { nome: "Théo Pereira", foto: "public/carrossel/theo.jpg" },
  { nome: "Thiago Quadra", foto: "public/carrossel/th.png" },
  { nome: "Vitor Danielli", foto: "public/carrossel/cafe.jpg" }
]

function Contato() {
  const [index, setIndex] = useState(0)

  const proximo = () => setIndex((prev) => (prev + 1) % membros.length)
  const anterior = () => setIndex((prev) => (prev - 1 + membros.length) % membros.length)

  const membroAtual = membros[index]
  const membroAnterior = membros[(index - 1 + membros.length) % membros.length]
  const membroProximo = membros[(index + 1) % membros.length]

  return (
    <div className='pagina-contato'>
      <Header />

      <h1 className="titulo-contato">Sobre nós</h1>

      <div className="carrossel">
        <button className="seta" onClick={anterior}>◀</button>

        <img src={membroAnterior.foto} alt={membroAnterior.nome} className="foto-lateral" />

        <div className="membro">
          <img src={membroAtual.foto} alt={membroAtual.nome} className="foto-membro" />
          <h2>{membroAtual.nome}</h2>

          <div className="redes-sociais">
            <img src="public/icons/github.png" alt="GitHub" />
            <img src="public/icons/linkedin.png" alt="LinkedIn" />
            <img src="public/icons/insta.png" alt="Instagram" />
          </div>
        </div>

        <img src={membroProximo.foto} alt={membroProximo.nome} className="foto-lateral" />

        <button className="seta" onClick={proximo}>▶</button>
      </div>
    </div>
  )
}

export default Contato*/
