//traduzirPizzaParaCaixinha.js

/**
 * Recebe uma pizza estruturada do frontend e retorna o objeto "caixinha"
 * no formato esperado pelo Alexpress.
 * @param {Object} pizza - pizza do carrinho
 * @returns {Object} - objeto traduzido para "caixinha"
 */
function traduzirPizzaParaCaixinha(pizza) {
    // Traduz tamanho
    const tamanhoMap = {
        Broto: 1,
        Média: 2,
        Grande: 3
    };
    
    // Traduz tipo de molho
    const corBlocoMap = {
        "Molho de Tomate": 2,
        "Molho Doce": 3
    };
    
    // Traduz categoria e ingredientes para lâminas/padrões
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
        Frutas: { "Abacaxi": "0", "Morango": "1", "Banana": "2", "Maçã": "3" },
        Queijos: { "Mussarela": "0", "Cheddar": "1", "Parmesão": "2", "Gorgonzola": "3" },
        Saladas: { "Tomate": "0", "Brócolis": "1", "Rúcula": "2", "Cebola": "3" },
        Complementos: { "Milho": "0", "Orégano": "1", "M&M": "2", "CocoRalado": "3" },
        Chocolates: { "Chocolate Preto": "0", "Chocolate Branco": "1", "Nutella": "2", "Ovomaltine": "3" }
    };

    let blocos = [
        { cor: 0, lamina1: 0, lamina2: 0, lamina3: 0, padrao1: "0", padrao2: "0", padrao3: "0" },
        { cor: 0, lamina1: 0, lamina2: 0, lamina3: 0, padrao1: "0", padrao2: "0", padrao3: "0" },
        { cor: 0, lamina1: 0, lamina2: 0, lamina3: 0, padrao1: "0", padrao2: "0", padrao3: "0" },
    ];

    pizza.ingredientes.forEach((ing, idx) => {
        const bloco = blocos[0];
        bloco.cor = corBlocoMap[pizza.molho] || 0;

        if (idx === 0) {
            bloco.lamina1 = categoriaMap[ing.categoria] || 0;
            bloco.padrao1 = padraoMap[ing.categoria][ing.nome] || "0";
        } else if (idx === 1) {
            bloco.lamina2 = categoriaMap[ing.categoria] || 0;
            bloco.padrao2 = padraoMap[ing.categoria][ing.nome] || "0";
        } else if (idx === 2) {
            bloco.lamina3 = categoriaMap[ing.categoria] || 0;
            bloco.padrao3 = padraoMap[ing.categoria][ing.nome] || "0";
        }
    });

    return {
        payload: {
            orderId: `ORDER-${Date.now()}`,
            caixa: {
                codigoProduto: tamanhoMap[pizza.tamanho] || 1,
                bloco1: blocos[0],
                bloco2: blocos[1],
                bloco3: blocos[2]
            },
            sku: `KIT-PIZZA-${pizza.tamanho.toUpperCase()}-${pizza.molho.includes('Doce') ? 'DOCE' : 'SALGADA'}`
        },
        callbackUrl: "http://localhost:3333/callback"
    };
}

// Aqui é a mudança principal para a opção 1
export default traduzirPizzaParaCaixinha;
