import React from 'react';
import './Home.css';
import { Link , NavLink} from 'react-router-dom';

/*
import pizzaCalabresa from './public/copia-pizzaCalabresa.png';
import pizzaAzeitona from './public/copia-pizzaAzeitona.png';
import pizzaMarguerita from './public/copia-pizzaMarguerita.png';


import pizzaCalabresa from '../../assets/copia-pizzaCalabresa.png';
import pizzaAzeitona from '../../assets/copia-pizzaAzeitona.png';
import pizzaMarguerita from '../../assets/copia-pizzaMarguerita.png';
*/

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

const Home = () => {
  return (
    <>
    
      <header className="main-header">
        <div className="logo"><img className='logo-img' src="public/Logo-Preto_1.png" alt="" /></div>
        <nav>
          <a href="#inicio" className="nav-link active">Início</a>
          <Link to="/Pedidos" className="nav-link">Cardápio</Link>
          <a href="#contato" className="nav-link">Contato</a>
        </nav>
        <button className="cta-button">Pedir Agora</button>
      </header>

      <main>
        
        <section className="hero-section">
          <div className="hero-content">
            <h1>Sabores Artesanal<br />Pedido Digital</h1>
            <button className="hero-button">Ver Cardápio</button>
          </div>
        </section>

       
        <section className="featured-pizzas">
          <h2>As mais Pedidas</h2>
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
  );
};

export default Home;