import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './Crie_Pizza.css'; // O CSS precisa ser atualizado (ver notas abaixo)
import Header from '../../components/pastaheader/Header';


// Centraliza os ícones das categorias
export const iconesCategoria = {
  Carnes: <img src="/icons/carne-preto.png" alt="Carnes" className="icone-categoria" />,
  Queijos: <img src="/icons/queijo-preto.png" alt="Queijos" className="icone-categoria" />,
  Saladas: <img src="/icons/alface-preto.png" alt="Saladas" className="icone-categoria" />,
  Frutas: <img src="/icons/frutas-preto.png" alt="Frutas" className="icone-categoria" />,
  Chocolates: <img src="/icons/barra-chocolate-preto.png" alt="Chocolates" className="icone-categoria" />,
  Complementos: <img src="/icons/amendoim-preto.png" alt="Complementos" className="icone-categoria" />,
};

// Nova estrutura de dados para ingredientes
// Agora, cada ingrediente é um objeto, o que remove a necessidade de "SN=Bacon"
export const ingredientesPorCategoria = {
  Carnes: [
    { id: "CAR_BAC", sigla: "SN", nome: "Bacon", icone: "/icons/bacon-preto.png" },
    { id: "CAR_FRA", sigla: "CA", nome: "Frango", icone: "/icons/frango-preto.png" },
    { id: "CAR_CAL", sigla: "BA", nome: "Calabresa", icone: "/icons/calabresa-preto.png" },
    { id: "CAR_CAM", sigla: "ES", nome: "Camarão", icone: "/icons/camarao-preto.png" },
  ],
  Queijos: [
    { id: "QUE_MUS", sigla: "SN", nome: "Mussarela", icone: "/icons/mussarela-preto.png" },
    { id: "QUE_CHE", sigla: "CA", nome: "Cheddar", icone: "/icons/cheddar-preto.png" },
    { id: "QUE_PAR", sigla: "BA", nome: "Parmesão", icone: "/icons/parmesao-preto.png" },
    { id: "QUE_GOR", sigla: "ES", nome: "Gorgonzola", icone: "/icons/gorgonzola-preto.png" },
  ],
  Saladas: [
    { id: "SAL_TOM", sigla: "SN", nome: "Tomate", icone: "/icons/tomate-preto.png" },
    { id: "SAL_BRO", sigla: "CA", nome: "Brócolis", icone: "/icons/brocolis-preto.png" },
    { id: "SAL_RUC", sigla: "BA", nome: "Rúcula", icone: "/icons/rucula-preto.png" },
    { id: "SAL_CEB", sigla: "ES", nome: "Cebola", icone: "/icons/cebola-preto.png" },
  ],
  Frutas: [
    { id: "FRU_UVA", sigla: "SN", nome: "Uva", icone: "/icons/uva-preto.png" },
    { id: "FRU_MOR", sigla: "CA", nome: "Morango", icone: "/icons/morango-preto.png" },
    { id: "FRU_BAN", sigla: "BA", nome: "Banana", icone: "/icons/banana-preto.png" },
    { id: "FRU_CER", sigla: "ES", nome: "Cereja", icone: "/icons/cereja-preto.png" },
  ],
  Chocolates: [
    { id: "CHO_PRE", sigla: "SN", nome: "Chocolate Preto", icone: "/icons/chocolate-preto.png" },
    { id: "CHO_BRA", sigla: "CA", nome: "Chocolate Branco", icone: "/icons/chocolate-branco-preto.png" },
    { id: "CHO_NUT", sigla: "BA", nome: "Nutella", icone: "/icons/nutella-preto.png" },
    { id: "CHO_OVO", sigla: "ES", nome: "Ovomaltine", icone: "/icons/ovomaltine-preto.png" },
  ],
  Complementos: [
    { id: "COM_MIL", sigla: "SN", nome: "Milho", icone: "/icons/milho-preto.png" },
    { id: "COM_ORE", sigla: "CA", nome: "Orégano", icone: "/icons/oregano-preto.png" },
    { id: "COM_MMM", sigla: "BA", nome: "M&M", icone: "/icons/mm-preto.png" },
    { id: "COM_COC", sigla: "ES", nome: "Coco ralado", icone: "/icons/coco-ralado-preto.png" },
  ]
};

// ---- Dados Derivados (calculados uma vez e exportados) ----

// Lista de nomes de categorias
export const categorias = Object.keys(ingredientesPorCategoria);

// Mapa de ID para objeto de ingrediente (para consulta rápida no resumo)
// Ex: { "CAR_BAC": { id: "CAR_BAC", nome: "Bacon", ... } }
export const ingredientesMap = Object.values(ingredientesPorCategoria)
  .flat() // Transforma o array de arrays em um único array
  .reduce((acc, ing) => {
    acc[ing.id] = ing;
    return acc;
  }, {});

// Mapa de ID de ingrediente para nome da categoria (para consulta rápida no resumo)
// Ex: { "CAR_BAC": "Carnes" }
export const ingredienteParaCategoriaMap = Object.entries(ingredientesPorCategoria)
  .reduce((acc, [categoria, ingredientes]) => {
    ingredientes.forEach(ing => {
      acc[ing.id] = categoria;
    });
    return acc;
  }, {}); 

function Crie_Pizza() {
  const navigate = useNavigate();
  const location = useLocation();
  const carrinhoExistente = location.state?.carrinho || [];

  // Estados
  const [tamanho, setTamanho] = useState({ nome: "Média", limite: 6 });
  const [molho, setMolho] = useState("Molho de Tomate");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(categorias[0]); // Começa com a primeira categoria
  const [ingredientes, setIngredientes] = useState({}); // Estado armazena por ID: { "CAR_BAC": 2 }
  const [etapa, setEtapa] = useState(1);

  // Calcula o total de ingredientes usando useMemo para performance
  const totalIngredientes = useMemo(() => {
    return Object.values(ingredientes).reduce((soma, contagem) => soma + contagem, 0);
  }, [ingredientes]);

  const selecionarTamanho = (nome, limiteIngredientes) => {
    setTamanho({ nome: nome, limite: limiteIngredientes });
    setIngredientes({}); // Reseta ingredientes ao mudar o tamanho
  };

  // Adiciona o ingrediente (objeto)
  const adicionarIngrediente = (ingrediente) => {
    if (totalIngredientes >= tamanho.limite) {
      alert(`Limite de ${tamanho.limite} ingredientes atingido para a pizza ${tamanho.nome}.`);
      return;
    }
    // Usa o ID do ingrediente como chave
    setIngredientes(prev => ({
      ...prev,
      [ingrediente.id]: (prev[ingrediente.id] || 0) + 1
    }));
  };

  // Remove o ingrediente (objeto)
  const removerIngrediente = (ingrediente) => {
    // Não faz nada se o ingrediente não estiver no estado
    if (!ingredientes[ingrediente.id]) return;

    const novosIngredientes = { ...ingredientes };
    novosIngredientes[ingrediente.id] -= 1;

    // Remove a chave do objeto se a contagem for 0
    if (novosIngredientes[ingrediente.id] === 0) {
      delete novosIngredientes[ingrediente.id];
    }
    setIngredientes(novosIngredientes);
  };

  const handleIrParaCarrinho = () => {
    // A lógica de estruturação fica muito mais simples
    const ingredientesEstruturados = Object.entries(ingredientes).map(([id, count]) => {
      const ing = ingredientesMap[id]; // Busca o objeto completo pelo ID
      const categoria = ingredienteParaCategoriaMap[id]; // Busca a categoria pelo ID
      return {
        sigla: ing.sigla,
        nome: ing.nome,
        categoria: categoria,
        quantidade: count
      };
    });

    const pizzaAtual = {
      id: Date.now(),
      tamanho: tamanho.nome,
      molho: molho,
      ingredientes: ingredientesEstruturados,
    };

    const carrinhoAtualizado = [...carrinhoExistente, pizzaAtual];
    navigate("/carrinho", { state: { carrinho: carrinhoAtualizado } });
  };

  // Renderização
  return (
    <div className="pagina-cria-pizza">
      <Header />
      <main className="container-cria-pizza">

        {/* Barra de progresso (Agora com 4 etapas) */}
        <div className="barra-progresso">
          <div className="barra-progresso-preenchida" style={{ width: `${(etapa / 4) * 100}%` }}></div>
        </div>

        {/* Etapa 1 - Tamanho */}
        {etapa === 1 && (
          <div className="secao secao-tamanho">
            <h3>Escolha o Tamanho da Pizza</h3>
            <div className="opcoes">
              <button className={`card-tamanho ${tamanho.nome === 'Broto' ? 'selecionado' : ''}`} onClick={() => selecionarTamanho('Broto', 3)}>
                <span>Broto - 20cm</span>
                <p>Até 3 ingredientes</p>
              </button>
              <button className={`card-tamanho ${tamanho.nome === 'Média' ? 'selecionado' : ''}`} onClick={() => selecionarTamanho('Média', 6)}>
                <span>Média - 30cm</span>
                <p>Até 6 ingredientes</p>
              </button>
              <button className={`card-tamanho ${tamanho.nome === 'Grande' ? 'selecionado' : ''}`} onClick={() => selecionarTamanho('Grande', 9)}>
                <span>Grande - 45cm</span>
                <p>Até 9 ingredientes</p>
              </button>
            </div>
          </div>
        )}

        {/* Etapa 2 - Molho */}
        {etapa === 2 && (
          <div className="secao secao-molho">
            <h3>Escolha o Tipo de Molho</h3>
            <div className="opcoes">
              <button className={`card-molho ${molho === 'Molho de Tomate' ? 'selecionado' : ''}`} onClick={() => setMolho('Molho de Tomate')}>
                Molho De Tomate <span>(Salgadas)</span>
              </button>
              <button className={`card-molho ${molho === 'Molho Doce' ? 'selecionado' : ''}`} onClick={() => setMolho('Molho Doce')}>
                Molho Doce <span>(Doces)</span>
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3 - Ingredientes (LOGICA CORRIGIDA) */}
        {etapa === 3 && (
          <div className="secao secao-ingredientes">
            <h2>Escolha os ingredientes ({totalIngredientes}/{tamanho.limite})</h2>

            <div className="opcoes-categorias">
              {categorias.map((cat) => (
                <button // Trocado div por button para acessibilidade
                  key={cat}
                  type="button"
                  className={`card-categoria ${categoriaSelecionada === cat ? "selecionado" : ""}`}
                  onClick={() => setCategoriaSelecionada(cat)}
                >
                  {iconesCategoria[cat]} {/* Mostra o ícone da categoria */}
                  <span>{cat}</span>
                </button>
              ))}
            </div>

            {categoriaSelecionada && (
              <div className="opcoes-ingredientes">
                {ingredientesPorCategoria[categoriaSelecionada].map(
                  (ingrediente) => {
                    const contagem = ingredientes[ingrediente.id] || 0;
                    return (
                      <div
                        key={ingrediente.id}
                        // Adiciona classe 'selecionado' se a contagem for > 0
                        className={`card-ingrediente ${contagem > 0 ? "selecionado" : ""}`}
                      >
                        <div className="info-ingrediente">
                          <img src={ingrediente.icone} alt={ingrediente.nome} className="icone-ingrediente" />
                          <span>{ingrediente.nome}</span>
                        </div>
                        <div className="controles-ingrediente">
                          <button
                            onClick={() => removerIngrediente(ingrediente)}
                            disabled={contagem === 0} // Desabilita se for 0
                            className="botao-controle"
                            aria-label={`Remover ${ingrediente.nome}`}
                          >
                            -
                          </button>
                          <span className="contagem-ingrediente">{contagem}</span>
                          <button
                            onClick={() => adicionarIngrediente(ingrediente)}
                            disabled={totalIngredientes >= tamanho.limite} // Desabilita se atingir o limite
                            className="botao-controle"
                            aria-label={`Adicionar ${ingrediente.nome}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            )}
          </div>
        )}

        {/* Etapa 4 - Resumo (Era 5) */}
        {etapa === 4 && (
          <div className="secao resumo-pizza">
            <h3>Resumo da Sua Pizza</h3>
            <p><strong>Tamanho:</strong> {tamanho.nome}</p>
            <p><strong>Molho:</strong> {molho}</p>
            <p><strong>Ingredientes:</strong> ({totalIngredientes}/{tamanho.limite})</p>
            <ul>
              {/* Lógica de resumo agora é muito mais limpa */}
              {Object.entries(ingredientes).map(([id, qtd]) => {
                const ing = ingredientesMap[id]; // Busca o objeto
                const categoria = ingredienteParaCategoriaMap[id]; // Busca a categoria
                return (
                  <li key={id}>
                    <img src={ing.icone} alt={ing.nome} className="icone-ingrediente-resumo" />
                    <strong>{categoria}:</strong> {ing.nome} (x{qtd})
                  </li>
                );
              })}
            </ul>
            <button className="botao-pagamento" onClick={handleIrParaCarrinho}>
              Ir para pagamento
              <img src="/icons/carrinho-compras-preto.png" alt="Carrinho" className="pagamento-icone" />
            </button>
          </div>
        )}

        {/* Navegação entre etapas (Agora com 4 etapas) */}
        <div className="navegacao-etapas">
          {etapa > 1 && <button onClick={() => setEtapa(etapa - 1)} className="botao-voltar">Voltar</button>}
          {etapa < 4 && <button onClick={() => setEtapa(etapa + 1)} className="botao-proximo">Próximo</button>}
        </div>
      </main>
    </div>
  );
}

export default Crie_Pizza;