// traduzirPizzaParaCaixinha.js
/**
 * Recebe uma pizza estruturada do frontend e retorna o objeto "caixinha"
 * no formato esperado, preenchendo os blocos de forma sequencial.
 * @param {Object} pizza - A pizza do carrinho.
 * @returns {Object} - O objeto traduzido para o formato "caixinha".
 */
function traduzirPizzaParaCaixinha(pizza) {
    // --- MAPAS DE TRADUÇÃO (Dicionários) ---
    const tamanhoMap = {
        Broto: 1,
        Média: 2,
        Grande: 3
    };
     const corBlocoMap = {
        "Molho de Tomate": 2,
        "Molho Doce": 3
    };

    const categoriaMap = {
        Carnes: 1,
        Frutas: 2,
        Queijos: 3,
        Saladas: 4,
        Complementos: 5,
        Chocolates: 6
    };

    const padraoMap = {
        Carnes: { "Bacon": "0", "Frango": "1", "Calabresa": "2", "Camarão": "3" },
        Frutas: { "Uva": "0", "Morango": "1", "Banana": "2", "Cereja": "3" },
        Queijos: { "Mussarela": "0", "Cheddar": "1", "Parmesão": "2", "Gorgonzola": "3" },
        Saladas: { "Tomate": "0", "Brócolis": "1", "Rúcula": "2", "Cebola": "3" },
        Complementos: { "Milho": "0", "Orégano": "1", "M&M": "2", "CocoRalado": "3" },
        Chocolates: { "Chocolate Preto": "0", "Chocolate Branco": "1", "Nutella": "2", "Ovomaltine": "3" }
    };

    // --- INICIALIZAÇÃO DA CAIXA ---
    // Começa com todos os blocos vazios (padrão 0).
    let blocos = {
        bloco1: { cor: 0, lamina1: 0, lamina2: 0, lamina3: 0, padrao1: "0", padrao2: "0", padrao3: "0" },
        bloco2: { cor: 0, lamina1: 0, lamina2: 0, lamina3: 0, padrao1: "0", padrao2: "0", padrao3: "0" },
        bloco3: { cor: 0, lamina1: 0, lamina2: 0, lamina3: 0, padrao1: "0", padrao2: "0", padrao3: "0" },
    };

    // --- LÓGICA DE PREENCHIMENTO SEQUENCIAL ---

    // 1. Define a cor dos blocos com base na quantidade de ingredientes.
    blocos.bloco1.cor = corBlocoMap[pizza.molho] || 0;
    if (pizza.ingredientes.length > 3) {
        blocos.bloco2.cor = 1; // Cor padrão para blocos subsequentes
    }
    if (pizza.ingredientes.length > 6) {
        blocos.bloco3.cor = 1; // Cor padrão para blocos subsequentes
    }

    // 2. Itera sobre os ingredientes e os distribui nos blocos.
    pizza.ingredientes.forEach((ing, idx) => {
        // Limita a 9 ingredientes, pois só existem 9 "slots" (3 por bloco).
        if (idx >= 9) {
            return;
        }

        // Determina em qual bloco e "slot" o ingrediente atual se encaixa.
        const blocoNum = Math.floor(idx / 3) + 1; // Bloco 1, 2 ou 3
        const slotNum = (idx % 3) + 1;          // Slot 1, 2 ou 3

        const blocoAtual = blocos[`bloco${blocoNum}`];

        // Busca os códigos da categoria e do padrão de forma segura.
        const categoriaId = categoriaMap[ing.categoria] || 0;
        const padroesDaCategoria = padraoMap[ing.categoria];
        let padraoId = "0";

        if (padroesDaCategoria && ing.nome) {
            padraoId = padroesDaCategoria[ing.nome] || "0";
        }

        // Atribui os valores ao slot correto dentro do bloco correto.
        blocoAtual[`lamina${slotNum}`] = categoriaId;
        blocoAtual[`padrao${slotNum}`] = padraoId;
    });

    return {
        payload: {
            orderId: `ORDER-${Date.now()}`, // Usando um ID dinâmico temporário
            caixa: {
                codigoProduto: tamanhoMap[pizza.tamanho] || 1,
                bloco1: blocos.bloco1,
                bloco2: blocos.bloco2,
                bloco3: blocos.bloco3
            },
            sku: `KIT-PIZZA-${pizza.tamanho.toUpperCase()}-${pizza.molho.includes('Doce') ? 'DOCE' : 'SALGADA'}`
        },
        callbackUrl: "http://localhost:3333/callback"
    };
}

export default traduzirPizzaParaCaixinha;
