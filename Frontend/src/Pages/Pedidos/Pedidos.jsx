import React from 'react'
import {Link} from 'react-router-dom'
import './Pedidos.css'

const pizzas = [
  {
    id: 1,
    image: 'copia-pizzaCalabresa.png',
    title: 'Pizza de Calabresa',
    description: 'A combinação incrível de sabor e crocância',
  },
  {
    id: 2,
    image: 'copia-pizzaAzeitona.png',
    title: 'Pizza de Azeitona Preta',
    description: 'A combinação incrível de sabor e crocância',
  },
  {
    id: 3,
    image: 'copia-pizzaMarguerita.png',
    title: 'Pizza de Couve Flor',
    description: 'A combinação incrível de sabor e crocância',
  },
];

function Pedidos() {
  return (
    <>
        <header className="main-header">
        <div className="logo">PANTEÃO</div>
        <nav>
          <Link to="/" className="nav-link">inicio</Link>
          <a href="/Pedidos" className="nav-link-3 active">cardapio</a>
          <a href="#contato" className="nav-link">Contato</a>
        </nav>
        <button className="cta-button">Pedir Agora</button>
      </header>
      <div className='bottoes'>
      <button className='button-div'>salgadas</button>
      <button className=" button-div-2">doces</button>
      <button  className='button-div-3'>promoçoes</button>
      </div>
      <main>
        <section className="featured-pizzas">
          <div className="pizza-grid">
            {pizzas.map((pizza) => (
              <div className="pizza-card" key={pizza.id}>
                <img src={pizza.image} alt={pizza.title} className="pizza-image" />
                <div className="pizza-info">
                  <h3>{pizza.title}</h3>
                  <p>{pizza.description}</p>
                  <button className="add-button">Adicionar</button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
   </>
  )
}

export default Pedidos