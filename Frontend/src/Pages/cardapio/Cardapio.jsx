import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cardapio.css';
import Header from '../../components/header/Header';
 // 1. Importando os dados do arquivo separado


// A lista de pizzas agora vive em seu próprio arquivo.
export const pizzasData = [
    { id: 1, nome: "Pizza de Calabresa", 
      descricao: "Molho de tomate, mussarela, calabresa fatiada e cebola.",
      preco: 38.00, 
      imagem: "/imagens-pizza/Pizza-Calabresa.png",
      tipo: "salgada" },

      { id: 2, nome: "Pizza de Azeitona Preta",
        descricao: "Molho de tomate, mussarela e azeitonas pretas selecionadas.", 
        preco: 35.00, 
        imagem: "/imagens-pizza/Pizza-Azeitona-Preta.png", 
        tipo: "salgada" },

        { id: 3, nome: "Pizza Marguerita", 
          descricao: "Molho de tomate, mussarela, tomate fresco e manjericão.", 
          preco: 35.00, 
          imagem: "/imagens-pizza/Pizza-Marguerita.png", 
          tipo: "salgada" },

          { id: 4, nome: "Chocolate com Morango", 
            descricao: "Delicioso chocolate derretido com morangos frescos.", 
            preco: 42.00, 
            imagem: "/imagens-pizza/Pizza-Chocolate-Morango.jpeg", 
            tipo: "doce" },

            { id: 5, nome: "Chocolate", 
              descricao: "Aveludado chocolate ao leite coberto por granulado.",
              preco: 40.00, 
              imagem: "/imagens-pizza/Pizza-Chocolate.jpeg", 
              tipo: "doce" },

              { id: 6, nome: "Promoção da Casa", 
                descricao: "Calabresa especial com borda de catupiry.", 
                preco: 45.00, precoPromo: 39.90, 
                imagem: "/imagens-pizza/Pizza-Calabresa.png", 
                tipo: "salgada",
                promocao: true },

                { id: 7, nome: "Promoção de Azeitona", 
                  descricao: "Mussarela premium com azeitonas graúdas.", 
                  preco: 45.00, precoPromo: 39.90, 
                  imagem: "/imagens-pizza/Pizza-Azeitona-Preta.png", 
                  tipo: "salgada", 
                  promocao: true }
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
            <button onClick={() => navigate("/crie-pizza")}>
                Não encontrou o que queria? <strong>Crie sua própria pizza!</strong>
            </button>
        </div>

        {/* Lista de pizzas */}
        <div className="lista-pizzas">
          {pizzasFiltradas.map((pizza) => {
            // Verifica se a pizza atual foi adicionada recentemente
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