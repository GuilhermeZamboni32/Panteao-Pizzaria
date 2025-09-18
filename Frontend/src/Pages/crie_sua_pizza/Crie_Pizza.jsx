// Adicione 'useLocation' na importação
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './Crie_Pizza.css';
import Header from '../../components/pastaheader/Header';

// O resto das suas constantes (iconesCategoria, ingredientesPorCategoria) continua igual...
const iconesCategoria = {
    Carnes: <img src="/icons/carne-preto.png" alt="Carnes" className="icone-categoria" />,
    Queijos: <img src="/icons/queijo-preto.png" alt="Queijos" className="icone-categoria" />,
    Saladas: <img src="/icons/alface-preto.png" alt="Saladas" className="icone-categoria" />,
    Frutas: <img src="/icons/frutas-preto.png" alt="Frutas" className="icone-categoria" />,
    Chocolates: <img src="/icons/barra-chocolate-preto.png" alt="Chocolates" className="icone-categoria" />,
    Complementos: <img src="/icons/amendoim-preto.png" alt="Complementos" className="icone-categoria" />,
};

const ingredientesPorCategoria = {
    Carnes: ["SN=Bacon", "CA=Frango", "BA=Calabresa", "ES=Camarão"],
    Queijos: ["SN=Mussarela", "CA=Cheddar", "BA=Parmesão", "ES=Gorgonzola"],
    Saladas: ["SN=Tomate", "CA=Brócolis", "BA=Rúcula", "ES=Cebola"],
    Frutas: ["SN=Abacaxi", "CA=Morango", "BA=Banana", "ES=Maçã"],
    Chocolates: ["SN=Chocolate Preto", "CA=Chocolate Branco", "BA=Nutella", "ES=Ovomaltine"],
    Complementos: ["SN=Milho", "CA=Orégano","BA=M&M", "ES=Coco ralado"]
};


function Crie_Pizza() {
    const navigate = useNavigate();
    const location = useLocation(); // <-- 1. Obtenha a localização

    // 2. Pegue o carrinho existente que foi enviado da página do carrinho
    const carrinhoExistente = location.state?.carrinho || [];

    // O resto dos seus 'useState' continua igual
    const [tamanho, setTamanho] = useState({ nome: "Média", limite: 6 });
    const [molho, setMolho] = useState("Molho de Tomate");
    const [categoriaSelecionada, setCategoriaSelecionada] = useState("Carnes");
    const [ingredientes, setIngredientes] = useState([]);

    const selecionarTamanho = (nome, limiteIngredientes) => {
        setTamanho({ nome: nome, limite: limiteIngredientes });
        setIngredientes([]); 
    };

    const adicionarIngrediente = (ingrediente) => {
        if (ingredientes.includes(ingrediente)) {
            setIngredientes(ingredientes.filter((i) => i !== ingrediente));
        } else {
            if (ingredientes.length < tamanho.limite) {
                setIngredientes([...ingredientes, ingrediente]);
            } else {
                alert(`Limite de ${tamanho.limite} ingredientes atingido para a pizza ${tamanho.nome}.`);
            }
        }
    };

    const handleIrParaCarrinho = () => {
        const pizzaAtual = {
            tamanho: tamanho.nome,
            molho: molho,
            ingredientes: ingredientes,
        };

        // 3. Crie a nova lista combinando o carrinho existente com a pizza nova
        const carrinhoAtualizado = [...carrinhoExistente, pizzaAtual];

        // 4. Navegue para o carrinho enviando a lista COMPLETA
        navigate("/carrinho", {
            state: {
                carrinho: carrinhoAtualizado
            }
        });
    };
    
    // O seu JSX (return) continua exatamente o mesmo, apenas o botão já chama a função correta
    return (
        <div className="pagina-cria-pizza">
            <Header />
            <main className="container-cria-pizza">
                {/* TOPO */}
                <div className="container-cria-pizza-topo">
                    <div className="secao-tamanho">
                        <h3>Tamanho da Pizza</h3>
                        <div className="opcoes">
                            <button className={`card-tamanho ${tamanho.nome === 'Broto' ? 'selecionado' : ''}`} onClick={() => selecionarTamanho('Broto', 3)}>
                                <span className="tamanho-cm">20cm</span>
                                <span className="tamanho-nome">Broto</span>
                                <span className="tamanho-limite">Você pode escolher de 0 a 3 ingredientes</span>
                            </button>
                            <button className={`card-tamanho ${tamanho.nome === 'Média' ? 'selecionado' : ''}`} onClick={() => selecionarTamanho('Média', 6)}>
                                <span className="tamanho-cm">30cm</span>
                                <span className="tamanho-nome">Média</span>
                                <span className="tamanho-limite">Você pode escolher de 0 a 6 ingredientes</span>
                            </button>
                            <button className={`card-tamanho ${tamanho.nome === 'Grande' ? 'selecionado' : ''}`} onClick={() => selecionarTamanho('Grande', 9)}>
                                <span className="tamanho-cm">45cm</span>
                                <span className="tamanho-nome">Grande</span>
                                <span className="tamanho-limite">Você pode escolher de 0 a 9 ingredientes</span>
                            </button>
                        </div>
                    </div>
                    <div className="secao-molho">
                        <h3>Tipo de molho</h3>
                        <div className="opcoes">
                            <button className={`card-molho ${molho === 'Molho de Tomate' ? 'selecionado' : ''}`} onClick={() => setMolho('Molho de Tomate')}>
                                Molho De Tomate <span className="tipo-molho">(Para pizzas salgadas)</span>
                            </button>
                            <button className={`card-molho ${molho === 'Molho Doce' ? 'selecionado' : ''}`} onClick={() => setMolho('Molho Doce')}>
                                Molho Doce <span className="tipo-molho">(Para pizzas doces)</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* MEIO */}
                <div className="container-cria-pizza-meio">
                    <div className="secao-categorias">
                        <h3>Categorias De Ingredientes</h3>
                        <div className="opcoes-categorias">
                            {Object.keys(ingredientesPorCategoria).map((categoria) => (
                                <button key={categoria} className={`card-categoria ${categoriaSelecionada === categoria ? 'selecionado' : ''}`} onClick={() => setCategoriaSelecionada(categoria)}>
                                    {iconesCategoria[categoria]}
                                    <span>{categoria}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="secao-ingredientes-especificos">
                        <h3>Ingredientes</h3>
                        <div className="opcoes-ingredientes">
                            {ingredientesPorCategoria[categoriaSelecionada].map((ingrediente) => (
                                <button key={ingrediente} className={`card-ingrediente ${ingredientes.includes(ingrediente) ? 'selecionado' : ''}`} onClick={() => adicionarIngrediente(ingrediente)}>
                                    {ingrediente}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* BAIXO */}
                <div className="container-cria-pizza-baixo">
                    <div className="resumo-pizza">
                        <h3>Sua Pizza</h3>
                        <p><strong>Tamanho:</strong> {tamanho.nome}</p>
                        <p><strong>Tipo de Molho:</strong> {molho}</p>
                        <p><strong>Ingredientes:</strong></p>
                          <div className="lista-ingredientes">
                            <ul>
                                {ingredientes.map((ing, index) => (
                                  <li key={index}> {ing}</li>
                                ))}
                            </ul>
                          </div>
                    </div>
                    <button className="botao-pagamento" onClick={handleIrParaCarrinho}>
                        <span>Ir para a área de pagamento</span>
                        <img src="/icons/carrinho-compras-preto.png" alt="Carrinho" className="pagamento-icone" />
                    </button>
                </div>
            </main>
        </div>
    );
}
   
export default Crie_Pizza;