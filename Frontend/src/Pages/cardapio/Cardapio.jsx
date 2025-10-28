import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cardapio.css';
import Header from '../../components/pastaheader/Header';




export const pizzasData = [
  {
    id: 1,
    nome: "Pizza de Queijo com Calabresa",
    descricao: "Molho de tomate fresco, mussarela derretida e calabresa fatiada.",
    preco: 42.00,
    imagem: "/imagens-pizza/Pizza-Queijo-Calabresa.png",
    tipo: "salgada"
  },
  {
    id: 2,
    nome: "Pizza de Queijo com Frango",
    descricao: "Deliciosa combinação de frango desfiado temperado com queijo cremoso.",
    preco: 40.00,
    imagem: "/imagens-pizza/Pizza-Queijo-Frango.png",
    tipo: "salgada"
  },
  {
    id: 3,
    nome: "Pizza de Queijo com Camarão",
    descricao: "Camarões selecionados salteados no alho e óleo com queijo mussarela.",
    preco: 55.00,
    imagem: "/imagens-pizza/Pizza-Queijo-Camarao.png",
    tipo: "salgada"
  },
  {
    id: 4,
    nome: "Pizza de Queijo com Tomate",
    descricao: "A clássica mussarela com rodelas de tomate fresco e um toque de orégano.",
    preco: 38.00,
    imagem: "/imagens-pizza/Pizza-Queijo-Tomate.png",
    tipo: "salgada"
  },
  {
    id: 5,
    nome: "Pizza de Cuscuz Paulista",
    descricao: "O sabor e a essemcia inigualável do cuscuz paulista em uma base de pizza crocante.",
    preco: 48.00,
    imagem: "/imagens-pizza/Pizza-Cuscus-Paulista.png",
    tipo: "salgada"
  },
  {
    id: 6,
    nome: "Pizza de Chocolate Branco com Morango",
    descricao: "Cobertura de chocolate branco cremoso com morangos frescos e suculentos.",
    preco: 45.00,
    imagem: "/imagens-pizza/Pizza-ChocolateBranco-Morango.png",
    tipo: "doce"
  },
  {
    id: 7,
    nome: "Pizza de Chocolate Preto com Morango e Banana",
    descricao: "A combinação perfeita de chocolate preto, morangos e bananas fatiadas.",
    preco: 47.00,
    imagem: "/imagens-pizza/Pizza-ChocolatePreto-Morango-banana.png",
    tipo: "doce"
  },
  {
    id: 8,
    nome: "Pizza de Queijo com Morango",
    descricao: "Uma sobremesa surpreendente com queijo doce e morangos frescos.",
    preco: 43.00,
    imagem: "/imagens-pizza/Pizza-Queijo-Morango.png",
    tipo: "doce"
  },
  {
    id: 9,
    nome: "Promoção de Frango",
    descricao: "A queridinha de frango com queijo por um preço especial.",
    preco: 40.00,
    precoPromo: 35.90,
    imagem: "/imagens-pizza/Pizza-Queijo-Frango.png",
    tipo: "salgada",
    promocao: true
  },
  {
    id: 10,
    nome: "Promoção de Calabresa",
    descricao: "Aproveite a nossa pizza de queijo com calabresa com um super desconto.",
    preco: 42.00,
    precoPromo: 37.90,
    imagem: "/imagens-pizza/Pizza-Queijo-Calabresa.png",
    tipo: "salgada",
    promocao: true
  }
];

function Cardapio({ adicionarAoCarrinho }) {
  const navigate = useNavigate();
  const [pizzasAdicionadas, setPizzasAdicionadas] = useState([]);
  const [filtro, setFiltro] = useState("todas");

  const pizzasFiltradas = pizzasData.filter(pizza => {
    if (filtro === "todas") return !pizza.promocao; // Mostra todas, exceto as que são SÓ de promoção
    if (filtro === "salgada") return pizza.tipo === "salgada" && !pizza.promocao;
    if (filtro === "doce") return pizza.tipo === "doce" && !pizza.promocao;
    if (filtro === "promocao") return pizza.promocao === true;
    return true;
  });

  const handleAdicionarAoCarrinho = (pizza) => {
    adicionarAoCarrinho(pizza);
    setPizzasAdicionadas(prev => [...prev, pizza.id]);

    setTimeout(() => {
      setPizzasAdicionadas(prev => prev.filter(id => id !== pizza.id));
    }, 2000);
  };

  return (
    <div className="pagina-cardapio">
      <Header />
      <main className="container-cardapio">
        
        {/* Cabeçalho e Controles */}
        <div className="cardapio-controles">
          <h1 className="cardapio-titulo">Nosso Cardápio</h1>
          <div className="filtros">
            <button className={filtro === 'todas' ? 'ativo' : ''} onClick={() => setFiltro("todas")}>Todas</button>
            <button className={filtro === 'salgada' ? 'ativo' : ''} onClick={() => setFiltro("salgada")}>Salgadas</button>
            <button className={filtro === 'doce' ? 'ativo' : ''} onClick={() => setFiltro("doce")}>Doces</button>
            <button className={filtro === 'promocao' ? 'ativo' : ''} onClick={() => setFiltro("promocao")}>Promoções</button>
          </div>
        </div>

        <section className="cardapio-acoes-secundarias">
            <h2>Não encontrou o que queria?</h2>
            <p>Sinta-se livre para montar uma pizza do seu jeito!</p>
            <div className="botoes-container">
                <button className="btn-acao-principal" onClick={() => navigate("/crie_pizza")}>
                    Crie sua própria pizza
                </button>
                <button className="btn-acao-secundario" onClick={() => navigate("/historico_pedidos")}>
                    Ver histórico de pedidos
                </button>
            </div>
        </section>

        {/* Lista de Pizzas */}
        <div className="lista-pizzas">
          {pizzasFiltradas.map((pizza) => {
            const foiAdicionada = pizzasAdicionadas.includes(pizza.id);
            return (
              <div key={pizza.id} className="card-pizza">
                {pizza.promocao && <div className="tag-promocao">PROMO</div>}
                
                <div className="card-pizza-imagem-container">
                    <img src={pizza.imagem} alt={pizza.nome} className="pizza-img" />
                </div>

                <div className="card-pizza-body">
                    <h3>{pizza.nome}</h3>
                    <p className="descricao">{pizza.descricao}</p>
                    
                    <div className="card-pizza-preco">
                        {pizza.promocao ? (
                            <>
                                <span className="preco-antigo">R$ {pizza.preco.toFixed(2)}</span>
                                <span className="preco-novo">R$ {pizza.precoPromo.toFixed(2)}</span>
                            </>
                        ) : (
                            <span className="preco-normal">R$ {pizza.preco.toFixed(2)}</span>
                        )}
                    </div>

                    <button 
                      className={`btn-adicionar ${foiAdicionada ? 'adicionado' : ''}`}
                      onClick={() => handleAdicionarAoCarrinho(pizza)}
                      disabled={foiAdicionada}
                    >
                      {foiAdicionada ? 'Adicionado ✓' : 'Adicionar ao Carrinho'}
                    </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ações Secundárias */}
        <section className="cardapio-acoes-secundarias">
            <h2>Não encontrou o que queria?</h2>
            <p>Sinta-se livre para montar uma pizza do seu jeito!</p>
            <div className="botoes-container">
                <button className="btn-acao-principal" onClick={() => navigate("/crie_pizza")}>
                    Crie sua própria pizza
                </button>
                <button className="btn-acao-secundario" onClick={() => navigate("/historico_pedidos")}>
                    Ver histórico de pedidos
                </button>
            </div>
        </section>

      </main>
    </div>
  );
}

export default Cardapio;