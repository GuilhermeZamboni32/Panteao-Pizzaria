import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cardapio.css';
import Header from '../../components/pastaheader/Header';
 // 1. Importando os dados do arquivo separado


// A lista de pizzas agora vive em seu próprio arquivo.
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

  // 2. Estado para dar feedback visual de "Adicionado"
  const [pizzasAdicionadas, setPizzasAdicionadas] = useState([]);

  // Estado do filtro
  const [filtro, setFiltro] = useState("todas");

  // Função que aplica o filtro (sem alteração na lógica)
  const pizzasFiltradas = pizzasData.filter(pizza => {
    if (filtro === "todas") return true;
    if (filtro === "salgada") return pizza.tipo === "salgada";
    if (filtro === "doce") return pizza.tipo === "doce";
    if (filtro === "promocao") return pizza.promocao === true;
    return true;
  });

  // 3. Nova função para lidar com a adição ao carrinho
  const handleAdicionarAoCarrinho = (pizza) => {
    adicionarAoCarrinho(pizza); // Chama a função original que veio via props
    setPizzasAdicionadas([...pizzasAdicionadas, pizza.id]); // Adiciona o ID da pizza à lista de adicionadas

    // Remove o feedback visual após 2 segundos
    setTimeout(() => {
      setPizzasAdicionadas(prev => prev.filter(id => id !== pizza.id));
    }, 2000);
  };

  return (
  <div className="pagina-cardapio">
    <Header />
    <main className="container-cardapio">
       
      {/* Botões de filtro com estilo de "ativo" */}
      <div className="filtros">
        <button className={filtro === 'todas' ? 'ativo' : ''} onClick={() => setFiltro("todas")}>Todas</button>
        <button className={filtro === 'salgada' ? 'ativo' : ''} onClick={() => setFiltro("salgada")}>Salgadas</button>
        <button className={filtro === 'doce' ? 'ativo' : ''} onClick={() => setFiltro("doce")}>Doces</button>
        <button className={filtro === 'promocao' ? 'ativo' : ''} onClick={() => setFiltro("promocao")}>Promoções</button>
      </div>

      {/* Botão de "Crie sua pizza" com mais destaque */}
      <div className="cta-crie-pizza">
          <button onClick={() => navigate("/crie_pizza")}>
              Não encontrou o que queria? <strong>Crie sua própria pizza!</strong>
          </button>
      </div>

      {/* Botão de "Histórico de Pedidos" */}
      <div className="cta-historico">
        <button onClick={() => navigate("/historico_pedidos")}>
          📜 Ver histórico de pedidos
        </button>
      </div>

      {/* Lista de pizzas */}
      <div className="lista-pizzas">
        {pizzasFiltradas.map((pizza) => {
          const foiAdicionada = pizzasAdicionadas.includes(pizza.id);
          return (
            <div key={pizza.id} className="card-pizza">
              {pizza.promocao && <div className="tag-promocao">PROMO</div>}
              <img src={pizza.imagem} alt={pizza.nome} className="pizza-img" />
              <div className="card-pizza-body">
                  <h3>{pizza.nome}</h3>
                  <p className="descricao">{pizza.descricao}</p>
                  {pizza.promocao ? (
                    <p className="preco">
                      <span className="preco-antigo">R$ {pizza.preco.toFixed(2)}</span>
                      <span className="preco-novo">R$ {pizza.precoPromo.toFixed(2)}</span>
                    </p>
                  ) : (
                    <p className="preco">R$ {pizza.preco.toFixed(2)}</p>
                  )}
                  <button 
                    className={`btn-adicionar ${foiAdicionada ? 'adicionado' : ''}`}
                    onClick={() => handleAdicionarAoCarrinho(pizza)}
                    disabled={foiAdicionada}
                  >
                    {foiAdicionada ? 'Adicionado ✓' : 'Adicionar'}
                  </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  </div>
);
}

export default Cardapio;