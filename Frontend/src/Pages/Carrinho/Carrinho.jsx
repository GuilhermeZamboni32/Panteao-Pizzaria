import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from '../../components/pastaheader/Header';
import './Carrinho.css';

function Carrinho() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [itensCarrinho, setItensCarrinho] = useState(location.state?.carrinho || []);
    const [usuarioLogado, setUsuarioLogado] = useState(null);

    const frete = 5;
    const desconto = 0;

    const precos = {
        Broto: 25,
        Média: 30,
        Grande: 45,
    };
    
    // Efeito para carregar o carrinho da navegação e o usuário do localStorage
    useEffect(() => {
        setItensCarrinho(location.state?.carrinho || []);

        const usuarioSalvo = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (usuarioSalvo && usuarioSalvo.cliente_id) { // Verifica pelo ID que vem do BD
            setUsuarioLogado(usuarioSalvo);
        }
    }, [location.state]);


    const clonarItem = (itemParaClonar) => {
        const novoItem = {
            ...itemParaClonar,
            id: Date.now() // Novo ID único para o item clonado
        };
        setItensCarrinho(prev => [...prev, novoItem]);
    };

    const removerItem = (id) => {
        setItensCarrinho(prev => prev.filter(item => item.id !== id));
    };

    const calcularSubtotal = () => {
        return itensCarrinho.reduce(
            (soma, item) => soma + (precos[item.tamanho] || 0),
            0
        );
    };

    const subtotal = calcularSubtotal();
    const total = subtotal + frete - desconto;

    const handleAdicionarMais = () => {
        navigate('/crie_pizza', { state: { carrinho: itensCarrinho } });
    };

    const handleConcluirCompra = async () => {
    // 1. Verifica login
    if (!usuarioLogado || !usuarioLogado.cliente_id) {
        alert("Você precisa estar logado para finalizar o pedido!");
        navigate('/login');
        return;
    }

    // 2. Verifica carrinho vazio
    if (itensCarrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    // 3. Monta o payload do pedido
    const pedidoPayload = {
        usuario: {
            id: usuarioLogado.cliente_id, // ID do banco
            nome: usuarioLogado.nome,
            email: usuarioLogado.email
        },
        itens: itensCarrinho,
        total: total
    };

    try {
        const response = await fetch('http://localhost:3002/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedidoPayload)
        });

        const data = await response.json();

        if (response.ok) {
            alert('🍕 Pedido realizado com sucesso!');
            console.log("📦 Retorno do servidor:", data);

            // Limpa o carrinho e redireciona para histórico ou página inicial
            setItensCarrinho([]);
            navigate('/historico_pedidos', { state: { pedidos: data.pedido } });
        } else {
            alert(data.error || 'Erro ao concluir o pedido.');
        }
    } catch (err) {
        console.error("❌ Erro ao enviar pedido:", err);
        alert("Erro ao conectar com o servidor de pedidos.");
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
                                            <ul className="ingredientes-lista">
                                                {pizza.ingredientes.map((ingrediente, i) => (
                                                    <li key={i}>{ingrediente.nome}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="controle-produto">
                                            <div className="seletor-quantidade">
                                                <button onClick={() => removerItem(pizza.id)}>Remover</button>
                                                <button onClick={() => clonarItem(pizza)}>+</button>
                                            </div>
                                            <p className="preco-produto">R$ {(precos[pizza.tamanho] || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button className="btn-adicionar-mais" onClick={handleAdicionarMais}>
                            Adicionar outra pizza
                        </button>

                        <div className="info-entrega">
                            <div className="info-usuario">
                                <p><strong>Seu nome:</strong><br/>{usuarioLogado?.nome || 'Faça o login'}</p>
                                <p><strong>Seu endereço:</strong><br/>{usuarioLogado?.endereco || 'Não disponível'}</p>
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

