import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Crie_Pizza.css';

// Importando ícones para as categorias
import { 
  FaBacon, FaCheese, FaLeaf, FaAppleAlt, FaCookieBite, FaPlusSquare, FaShoppingCart 
} from "react-icons/fa";

// Mapeamento de categorias para ícones
const iconesCategoria = {
  Carnes: <FaBacon />,
  Queijos: <FaCheese />,
  Saladas: <FaLeaf />,
  Frutas: <FaAppleAlt />,
  Chocolates: <FaCookieBite />,
  Complementos: <FaPlusSquare />,
};

// Ingredientes organizados por categoria
const ingredientesPorCategoria = {
  Carnes: ["Bacon", "Frango", "Calabresa", "Camarão"],
  Queijos: ["Mussarela", "Cheddar", "Parmesão", "Gorgonzola"],
  Saladas: ["Tomate", "Brócolis", "Rúcula", "Cebola"],
  Frutas: ["Abacaxi", "Morango", "Banana", "Maçã"],
  Chocolates: ["Chocolate Preto", "Chocolate Branco", "Nutella", "Ovomaltine"],
  Complementos: ["Milho", "Azeitona", "Orégano", "Catupiry"]
};

function Crie_Pizza() {
  const navigate = useNavigate();

  const [tamanho, setTamanho] = useState("Média"); // Estado inicial como na imagem
  const [limite, setLimite] = useState(3); // Limite inicial para Média
  const [molho, setMolho] = useState("Molho de Tomate"); // Estado inicial como na imagem
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Carnes"); // Estado inicial como na imagem
  const [ingredientes, setIngredientes] = useState([
    "Cheddar", "Calabresa", "Tomate", "Brócolis", "Bacon"
  ]); // Ingredientes de exemplo da imagem

  const irParaPagamento = () => {
    // A lógica original enviava para /carrinho, pode ser ajustada conforme necessário
    navigate("/pagamento", { state: { pizza: { tamanho, molho, ingredientes } } });
  };

  const selecionarTamanho = (nome, limiteIngredientes) => {
    setTamanho(nome);
    setLimite(limiteIngredientes);
    setIngredientes([]); // Resetar ingredientes ao mudar tamanho
  };

  const adicionarIngrediente = (ing) => {
    if (ingredientes.includes(ing)) {
      setIngredientes(ingredientes.filter((i) => i !== ing));
    } else {
      // A imagem indica um limite de 3 para todos, mas o código base tinha limites diferentes.
      // Vou manter a lógica do código base (limite dinâmico).
      if (ingredientes.length < limite) {
        setIngredientes([...ingredientes, ing]);
      } else {
        alert(`Limite de ${limite} ingredientes atingido para a pizza ${tamanho}.`);
      }
    }
  };

  return (
    <div className="crie-pizza-container">
      <div className="coluna-esquerda">
        {/* Seção Tamanho da Pizza */}
        <div className="secao-container">
          <h3 className="secao-titulo">Tamanho da Pizza</h3>
          <div className="opcoes-container">
            <div
              className={`card-opcao tamanho ${tamanho === 'Broto' ? 'selecionado' : ''}`}
              onClick={() => selecionarTamanho("Broto", 3)}
            >
              <p>Broto</p>
              <div className="circulo-tamanho">20cm</div>
              <span>Você pode escolher de 0 a 3 ingredientes</span>
            </div>
            <div
              className={`card-opcao tamanho ${tamanho === 'Média' ? 'selecionado' : ''}`}
              onClick={() => selecionarTamanho("Média", 6)}
            >
              <p>Média</p>
              <div className="circulo-tamanho">30cm</div>
              <span>Você pode escolher de 0 a 6 ingredientes</span>
            </div>
            <div
              className={`card-opcao tamanho ${tamanho === 'Grande' ? 'selecionado' : ''}`}
              onClick={() => selecionarTamanho("Grande", 9)}
            >
              <p>Grande</p>
              <div className="circulo-tamanho">45cm</div>
              <span>Você pode escolher de 0 a 9 ingredientes</span>
            </div>
          </div>
        </div>

        {/* Seção Ingredientes */}
        <div className="secao-container">
          <h3 className="secao-titulo">Ingredientes</h3>
          <div className="opcoes-container categorias">
            {Object.keys(ingredientesPorCategoria).map((cat) => (
              <div
                key={cat}
                className={`card-opcao categoria ${categoriaSelecionada === cat ? 'selecionado' : ''}`}
                onClick={() => setCategoriaSelecionada(cat)}
              >
                {iconesCategoria[cat]}
                <span>{cat}</span>
              </div>
            ))}
          </div>
          
          {categoriaSelecionada && (
            <div className="opcoes-container ingredientes">
              {ingredientesPorCategoria[categoriaSelecionada].map((ing) => (
                <div
                  key={ing}
                  className={`card-opcao ingrediente ${ingredientes.includes(ing) ? 'selecionado' : ''}`}
                  onClick={() => adicionarIngrediente(ing)}
                >
                  {ing}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="coluna-direita">
        {/* Seção Tipo de Molho */}
        <div className="secao-container">
          <h3 className="secao-titulo">Tipo de molho</h3>
          <div className="opcoes-container molhos">
             <div
              className={`card-opcao molho ${molho === 'Molho de Tomate' ? 'selecionado' : ''}`}
              onClick={() => setMolho("Molho de Tomate")}
            >
              <p>Molho De Tomate</p>
              <span>(Para pizzas salgadas)</span>
            </div>
            <div
              className={`card-opcao molho ${molho === 'Molho Doce' ? 'selecionado' : ''}`}
              onClick={() => setMolho("Molho Doce")}
            >
              <p>Molho Doce</p>
              <span>(Para pizzas doces)</span>
            </div>
          </div>
        </div>

        {/* Seção Resumo e Pagamento */}
        <div className="resumo-e-pagamento-container">
            <div className="resumo-container">
                <h3 className="secao-titulo">Sua Pizza</h3>
                <div className="resumo-detalhes">
                    <p><strong>Tamanho:</strong> {tamanho}</p>
                    <p><strong>Tipo de Molho:</strong> {molho}</p>
                    <p><strong>Ingredientes:</strong></p>
                    <ul>
                        {/* A imagem mostra uma lista de ingredientes que não condiz com as seleções, 
                        então o código vai listar os ingredientes atualmente selecionados. */}
                        {ingredientes.map(ing => <li key={ing}>{ing}</li>)}
                    </ul>
                </div>
            </div>
            <div className="pagamento-container" onClick={irParaPagamento}>
                <p>Ir para a área de pagamento</p>
                <FaShoppingCart className="pagamento-icone" />
            </div>
        </div>
      </div>
    </div>
  );
}

export default Crie_Pizza;