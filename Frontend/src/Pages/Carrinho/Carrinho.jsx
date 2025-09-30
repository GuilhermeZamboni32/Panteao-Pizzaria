import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from '../../components/pastaheader/Header';
import './Carrinho.css';

function Carrinho() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // O estado inicial agora é um array de objetos de pizza estruturados
    const [itensCarrinho, setItensCarrinho] = useState(location.state?.carrinho || []);
    const [usuario, setUsuario] = useState({
        nome: "Guilherme Zamboni",
        endereco: "Rua Aleatória 123"
    });

    const frete = 5;
    const desconto = 0;

    const precos = {
        Broto: 25,
        Média: 30,
        Grande: 45,
    };
    
    // O useEffect para lidar com a adição de mais itens pode ser removido ou simplificado,
    // já que agora passamos o carrinho inteiro de volta para a tela de criação.
    // Para simplificar, vamos confiar que o estado `location.state.carrinho` é a fonte da verdade.
    useEffect(() => {
        setItensCarrinho(location.state?.carrinho || []);
    }, [location.state]);


    // A lógica de quantidade agora opera em itens com um ID único, o que é mais seguro.
    const handleQuantidade = (id, delta) => {
        const novosItens = itensCarrinho.map(item => {
            if (item.id === id) {
                return { ...item, quantidade: (item.quantidade || 1) + delta };
            }
            return item;
        }).filter(item => (item.quantidade || 1) > 0); // Filtra itens removidos

        setItensCarrinho(novosItens);
    };
    
    // Renomeei a função para ser mais clara. 
    // Em vez de "quantidade" por pizza, cada item no carrinho é único.
    // Vamos clonar um item para adicionar um igual.
    const clonarItem = (itemParaClonar) => {
        const novoItem = {
            ...itemParaClonar,
            id: Date.now() // Novo ID para o clone
        };
        setItensCarrinho(prev => [...prev, novoItem]);
    };

    const removerItem = (id) => {
        setItensCarrinho(prev => prev.filter(item => item.id !== id));
    };


    const calcularSubtotal = () => {
        return itensCarrinho.reduce(
            (soma, item) => soma + (precos[item.tamanho] || 0), // Cada item é uma pizza, não há 'quantidade' no item
            0
        );
    };

    const subtotal = calcularSubtotal();
    const total = subtotal + frete - desconto;

 
    const handleAdicionarMais = () => {
        navigate('/crie_pizza', { state: { carrinho: itensCarrinho } });
    };

   const handleConcluirCompra = async () => {
    if (itensCarrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    // Pedido que o front envia para o backend
    const pedido = {
        usuario,
        itens: itensCarrinho,
        subtotal,
        frete,
        total,
        data: new Date().toISOString()
    };

    try {
        const response = await fetch('http://localhost:3002/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedido)
        });

        const resultado = await response.json();

        if (response.ok) {
            const ids = resultado.ids || [];

            // Salva no localStorage para a tela PedidosEmAndamento
            localStorage.setItem("pedidosEmAndamento", JSON.stringify(ids));

            alert(`Pedido concluído com sucesso! IDs enviados: ${ids.join(", ")}`);

            setItensCarrinho([]);
            navigate('/cardapio');

        } else {
            alert(`Erro ao salvar pedido: ${resultado.error}`);
        }
    } catch (err) {
        console.error("Erro de conexão:", err);
        alert('Erro de conexão com o servidor! Verifique o console.');
    }
};

    
    return (
        <div className="pagina-carrinho">
            <Header />
            <main className="container-carrinho">
                <div className="coluna-esquerda">
                    <h2 className="titulo-resumo">Resumo da Compra</h2>
                    <div className="box-detalhes">
                        {itensCarrinho.length === 0 ? (
                            <p>Seu carrinho está vazio.</p>
                        ) : (
                            <div className="lista-produtos">
                                {itensCarrinho.map((pizza) => (
                                    <div key={pizza.id} className="produto-item">
                                        <div className="info-produto">
                                            <p className="nome-produto">
                                                Pizza {pizza.tamanho} {pizza.molho.includes('Doce') ? 'Doce' : 'Salgada'}
                                            </p>
                                            {/* --- MUDANÇA NA RENDERIZAÇÃO --- */}
                                            {/* Agora lemos os ingredientes do array de objetos */}
                                            <ul className="ingredientes-lista">
                                                {pizza.ingredientes.map((ingrediente, i) => (
                                                    <li key={i}>{ingrediente.categoria}: {ingrediente.nome} (x{ingrediente.quantidade})</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="controle-produto">
                                            <div className="seletor-quantidade">
                                                <button onClick={() => removerItem(pizza.id)}>Remover</button>
                                                <button onClick={() => clonarItem(pizza)}>+</button>
                                            </div>
                                            <p className="preco-produto">R$ {(precos[pizza.tamanho]).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button className="btn-adicionar-mais" onClick={handleAdicionarMais}>
                            + Adicionar outra pizza
                        </button>

                        <div className="info-entrega">
                            <div className="info-usuario">
                                <p><strong>Seu nome:</strong><br/>{usuario.nome}</p>
                                <p><strong>Seu endereço:</strong><br/>{usuario.endereco}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="coluna-direita">
                    <div className="box-pagamento">
                        <div className="linha-pagamento">
                            <span>Subtotal:</span>
                            <span>R$ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="linha-pagamento">
                            <span>Frete:</span>
                            <span>R$ {frete.toFixed(2)}</span>
                        </div>
                        <div className="linha-total">
                            <span>Total a pagar:</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                        <button className="btn-comprar" onClick={handleConcluirCompra}>
                            Comprar
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Carrinho;
