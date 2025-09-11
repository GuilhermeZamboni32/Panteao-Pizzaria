import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import './Crie_Pizza.css'

// ingredientes organizados por categoria
const ingredientesPorCategoria = {
  Carnes: ["Bacon", "Frango", "Calabresa", "Camarão"],
  Queijos: ["Mussarela", "Cheddar", "Parmesão", "Gorgonzola"],
  Saladas: ["Tomate", "Brócolis", "Rúcula", "Cebola"],
  Frutas: ["Abacaxi", "Morango", "Banana", "Maçã"],
  Chocolates: ["Chocolate Preto", "Chocolate Branco", "Nutella", "Ovomaltine"],
  Complementos: ["Milho", "Azeitona", "Orégano", "Catupiry"]
};

function Crie_Pizza () {
  const navigate = useNavigate();

  const [tamanho, setTamanho] = useState(null);
  const [limite, setLimite] = useState(0);
  const [molho, setMolho] = useState(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const [ingredientes, setIngredientes] = useState([]);

  const irParaCarrinho = () => {
    navigate("/carrinho", { state: { carrinho: [{ tamanho, molho, ingredientes }] } });
  };
  
  const selecionarTamanho = (nome, limiteIngredientes) => {
    setTamanho(nome);
    setLimite(limiteIngredientes);
    setIngredientes([]); // resetar ingredientes ao mudar tamanho
  };

  const selecionarMolho = (tipo) => {
    setMolho(tipo);
  };

  const adicionarIngrediente = (ing) => {
    if (ingredientes.includes(ing)) {
      setIngredientes(ingredientes.filter((i) => i !== ing));
    } else {
      if (ingredientes.length < limite) {
        setIngredientes([...ingredientes, ing]);
      } else {
        alert(`Limite de ${limite} ingredientes para pizza ${tamanho}`);
      }
    }
  };

  return (
    <div className="pizza-builder">
      <h2>Crie sua pizza</h2>

      {/* Tamanho */}
      <div className="section">
        <h3>Tamanho da Pizza</h3>
        <div className="options">
          <button onClick={() => selecionarTamanho("Broto", 3)}>Broto (20cm)</button>
          <button onClick={() => selecionarTamanho("Média", 6)}>Média (30cm)</button>
          <button onClick={() => selecionarTamanho("Grande", 9)}>Grande (45cm)</button>
        </div>
      </div>

      {/* Molho */}
      <div className="section">
        <h3>Tipo de Molho</h3>
        <div className="options">
          <button onClick={() => selecionarMolho("Molho de Tomate")}>Molho de Tomate</button>
          <button onClick={() => selecionarMolho("Molho Doce")}>Molho Doce</button>
        </div>
      </div>

      {/* Ingredientes */}
      <div className="section">
        <h3>Ingredientes</h3>
        <div className="options">
          {Object.keys(ingredientesPorCategoria).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaSelecionada(cat)}
              className={categoriaSelecionada === cat ? "active" : ""}
            >
              {cat}
            </button>
          ))}
        </div>

        {categoriaSelecionada && (
          <div className="sub-options">
            {ingredientesPorCategoria[categoriaSelecionada].map((ing) => (
              <button
                key={ing}
                className={ingredientes.includes(ing) ? "selected" : ""}
                onClick={() => adicionarIngrediente(ing)}
              >
                {ing}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="resumo">
        <h3>Sua Pizza</h3>
        <p><strong>Tamanho:</strong> {tamanho || "Não selecionado"}</p>
        <p><strong>Molho:</strong> {molho || "Não selecionado"}</p>
        <p><strong>Ingredientes:</strong> {ingredientes.length > 0 ? ingredientes.join(", ") : "Nenhum"}</p>
      </div>

      {/* Botão para carrinho */}
      <div className="carrinho">
        <button className="btn-carrinho" onClick={irParaCarrinho}>
          Ir para a área de pagamento 🛒
        </button>
      </div>
    </div>
  );
};

export default Crie_Pizza;
