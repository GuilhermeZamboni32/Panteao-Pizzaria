import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cardapio.css';
import Header from '../../components/header/Header';

function Cardapio({ adicionarAoCarrinho }) {
  const navigate = useNavigate();

  // Lista de pizzas
  const pizzas = [
    { id: 1, nome: "Pizza de Calabresa", descricao: "A combinação incrível de sabor e crocância", preco: 35, imagem: "/Pizzas-Calabresa.png", tipo: "salgada" },
    { id: 2, nome: "Pizza de Azeitona Preta", descricao: "A combinação incrível de sabor e crocância", preco: 35, imagem: "/Pizzas-Azeitona-Preta.png", tipo: "salgada" },
    { id: 3, nome: "Pizza de Marguerita", descricao: "A combinação incrível de sabor e crocância", preco: 35, imagem: "/Pizzas-Marguerita.png", tipo: "salgada" },
    { id: 4, nome: "Chocolate com Moranggo", descricao: "A combinação incrível de sabor e crocância", preco: 35, imagem: "/Pizzas-Chocolate-Morango.png", tipo: "doce" },
    { id: 5, nome: "Chocolate", descricao: "A combinação incrível de sabor e crocância", preco: 35, imagem: "/Pizzas-Chocolate.png", tipo: "doce" },
    { id: 6, nome: "Pizza Promo Calabresa", descricao: "Promoção imperdível de Calabresa", preco: 45, precoPromo: 35, imagem: "/Pizzas-Calabresa.png", tipo: "salgada", promocao: true },
    { id: 7, nome: "Pizza Promo Azeitona", descricao: "Promoção imperdível de Azeitona", preco: 45, precoPromo: 35, imagem: "/Pizzas-Azeitona-Preta.png", tipo: "salgada", promocao: true }
  ];

  // Estado do filtro
  const [filtro, setFiltro] = useState("todas");

  // Função que aplica o filtro
  const pizzasFiltradas = pizzas.filter(pizza => {
    if (filtro === "todas") return true;
    if (filtro === "salgada") return pizza.tipo === "salgada";
    if (filtro === "doce") return pizza.tipo === "doce";
    if (filtro === "promocao") return pizza.promocao === true;
    return true;
  });

  return (
    <div className="container-cardapio">
      <Header />
      {/* Botões de filtro */}
      <div className="filtros">
        <button onClick={() => setFiltro("salgada")}>Salgadas</button>
        <button onClick={() => setFiltro("doce")}>Doces</button>
        <button onClick={() => setFiltro("promocao")}>Promoções</button>
        <button onClick={() => navigate("/crie_pizza")}>Crie a sua pizza</button>
      </div>

      {/* Lista de pizzas */}
      <div className="lista-pizzas">
        {pizzasFiltradas.map((pizza) => (
          <div key={pizza.id} className="card-pizza">
            <img src={pizza.imagem} alt={pizza.nome} className="pizza-img" />
            <h3>{pizza.nome}</h3>
            <p>{pizza.descricao}</p>

            {pizza.promocao ? (
              <p className="preco">
                <span className="preco-antigo">R$ {pizza.preco},00</span>{" "}
                <span className="preco-novo">R$ {pizza.precoPromo},00</span>
              </p>
            ) : (
              <p className="preco">R$ {pizza.preco},00</p>
            )}

            <button onClick={() => adicionarAoCarrinho(pizza)}>Adicionar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Cardapio;
