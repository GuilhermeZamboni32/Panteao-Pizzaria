import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './Crie_Pizza.css';
import Header from '../../components/pastaheader/Header';

// --- ESTRUTURAS DE DADOS (Sem alterações) ---
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
    Complementos: ["SN=Milho", "CA=Orégano", "BA=M&M", "ES=Coco ralado"]
};

const ingredienteParaCategoriaMap = Object.entries(ingredientesPorCategoria)
    .reduce((acc, [categoria, ingredientes]) => {
        ingredientes.forEach(ingrediente => {
            acc[ingrediente] = categoria;
        });
        return acc;
    }, {});

// --- COMPONENTE PRINCIPAL ---
function Crie_Pizza() {
    const navigate = useNavigate();
    const location = useLocation();
    const carrinhoExistente = location.state?.carrinho || [];

    const [tamanho, setTamanho] = useState({ nome: "Média", limite: 6 });
    const [molho, setMolho] = useState("Molho de Tomate");
    const [categoriaSelecionada, setCategoriaSelecionada] = useState("Carnes");
    const [ingredientes, setIngredientes] = useState({});

    const totalIngredientes = Object.values(ingredientes).reduce((soma, contagem) => soma + contagem, 0);

    const selecionarTamanho = (nome, limiteIngredientes) => {
        setTamanho({ nome: nome, limite: limiteIngredientes });
        setIngredientes({});
    };

    const adicionarIngrediente = (ingrediente) => {
        if (totalIngredientes >= tamanho.limite) {
            // Usar um feedback visual melhor que alert no futuro
            alert(`Limite de ${tamanho.limite} ingredientes atingido para a pizza ${tamanho.nome}.`);
            return;
        }
        setIngredientes(prev => ({
            ...prev,
            [ingrediente]: (prev[ingrediente] || 0) + 1
        }));
    };

    const removerIngrediente = (ingrediente) => {
        const novosIngredientes = { ...ingredientes };
        if (novosIngredientes[ingrediente]) {
            novosIngredientes[ingrediente] -= 1;
            if (novosIngredientes[ingrediente] === 0) {
                delete novosIngredientes[ingrediente];
            }
        }
        setIngredientes(novosIngredientes);
    };

    const handleIrParaCarrinho = () => {
        // --- MUDANÇA PRINCIPAL AQUI ---
        // Em vez de formatar os ingredientes como texto, criamos um array de objetos.
        // Isso mantém os dados estruturados para serem usados no carrinho e no backend.
        const ingredientesEstruturados = Object.entries(ingredientes).map(([ing, count]) => {
            const [sigla, nome] = ing.split('=');
            return {
                sigla,
                nome,
                categoria: ingredienteParaCategoriaMap[ing],
                quantidade: count
            };
        });

        // O objeto da pizza agora contém os ingredientes de forma estruturada.
        const pizzaAtual = {
            id: Date.now(), // Adiciona um ID único para cada pizza criada
            tamanho: tamanho.nome,
            molho: molho,
            ingredientes: ingredientesEstruturados,
        };

        const carrinhoAtualizado = [...carrinhoExistente, pizzaAtual];

        navigate("/carrinho", {
            state: { carrinho: carrinhoAtualizado }
        });
    };

    return (
        <div className="pagina-cria-pizza">
            <Header />
            <main className="container-cria-pizza">
                {/* O restante do seu JSX continua aqui, sem alterações */}
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
                            {ingredientesPorCategoria[categoriaSelecionada].map((ingrediente, index) => {
                                    const nomeIngrediente = ingrediente.split('=')[1];
                                    return (
                                        <button 
                                            key={`${categoriaSelecionada}-${nomeIngrediente}-${index}`} 
                                            className={`card-ingrediente ${ingredientes[ingrediente] > 0 ? 'selecionado' : ''}`} 
                                            onClick={() => adicionarIngrediente(ingrediente)}
                                        >
                                            {nomeIngrediente}
                                            {ingredientes[ingrediente] > 0 && (
                                                <span className="contador-ingrediente">{ingredientes[ingrediente]}</span>
                                            )}
                                        </button>
                                    )
                                })}
                        </div>
                    </div>
                </div>

                <div className="container-cria-pizza-baixo">
                    <div className="resumo-pizza">
                        <h3>Sua Pizza</h3>
                        <p><strong>Tamanho:</strong> {tamanho.nome}</p>
                        <p><strong>Tipo de Molho:</strong> {molho}</p>
                        <p><strong>Ingredientes:</strong> ({totalIngredientes}/{tamanho.limite})</p>
                        <div className="lista-ingredientes">
                            <ul>
                                {Object.keys(ingredientes).map((ing, index) => {
                                    const contagem = ingredientes[ing];
                                    const categoriaDoIngrediente = ingredienteParaCategoriaMap[ing];
                                    const nomeDoIngrediente = ing.split('=')[1];
                                    return (
                                        <li key={index} className="item-ingrediente-resumo">
                                            <span>
                                                <strong>{categoriaDoIngrediente}:</strong> {nomeDoIngrediente} <strong>(x{contagem})</strong>
                                            </span>
                                            <button className="botao-remover-ingrediente" onClick={() => removerIngrediente(ing)}>-</button>
                                        </li>
                                    )
                                })}
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
