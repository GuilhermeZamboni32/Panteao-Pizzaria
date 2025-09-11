// Carrinho.jsx
import { useLocation } from "react-router-dom";

const Carrinho = () => {
  const location = useLocation();
  const carrinho = location.state?.carrinho || []; // garante array

  const frete = 5;

  const precos = {
    Broto: 20,
    Média: 30,
    Grande: 45,
  };

  const calcularTotal = () => {
    let totalProdutos = carrinho.reduce(
      (soma, pizza) => soma + (precos[pizza.tamanho] || 0),
      0
    );
    return totalProdutos + frete;
  };

  return (
    <div className="carrinho-container">
      <h2>Resumo da Compra</h2>

      {carrinho.length === 0 ? (
        <p>Seu carrinho está vazio.</p>
      ) : (
        <>
          {carrinho.map((pizza, index) => (
            <div key={index} className="pizza-item">
              <p>
                <strong>Pizza {pizza.tamanho}</strong> - {pizza.molho}
              </p>
              <p>
                Ingredientes:{" "}
                {pizza.ingredientes?.length > 0
                  ? pizza.ingredientes.join(", ")
                  : "Nenhum"}
              </p>
              <p className="preco">R${precos[pizza.tamanho]},00</p>
            </div>
          ))}

          <div className="resumo-precos">
            <div className="linha">
              <span>Produto</span>
              <span>
                R$
                {carrinho.reduce(
                  (soma, pizza) => soma + (precos[pizza.tamanho] || 0),
                  0
                )}
                ,00
              </span>
            </div>
            <div className="linha">
              <span>Frete</span>
              <span>R${frete},00</span>
            </div>
            <div className="linha total">
              <span>Total a Pagar</span>
              <span>R${calcularTotal()},00</span>
            </div>
          </div>

          <button
            className="btn-comprar"
            onClick={() => alert("Compra concluída com sucesso!")}
          >
            Concluir Compra
          </button>
        </>
      )}
    </div>
  );
};

export default Carrinho;
