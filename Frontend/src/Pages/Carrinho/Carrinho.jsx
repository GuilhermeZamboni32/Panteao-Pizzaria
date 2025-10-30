import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from '../../components/pastaheader/Header';
import './Carrinho.css';

function Carrinho() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Pega itens do 'state' da navegação (vindo do Cardapio ou CriePizza)
    const [itensCarrinho, setItensCarrinho] = useState(location.state?.carrinho || []);
    const [usuarioLogado, setUsuarioLogado] = useState(null);

    const frete = 5;
    const desconto = 0;

    // Preços base (você já tem isto)
    const precos = {
        Broto: 25,
        Média: 30,
        Grande: 45,
    };
    
    useEffect(() => {
        // Atualiza o carrinho se a navegação mudar
        setItensCarrinho(location.state?.carrinho || []);

        // Carrega o usuário logado
        const usuarioSalvo = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (usuarioSalvo && usuarioSalvo.cliente_id) {
            setUsuarioLogado(usuarioSalvo);
        }
    }, [location.state]);


    const clonarItem = (itemParaClonar) => {
        const novoItem = {
            ...itemParaClonar,
            id: Date.now()
        };
        setItensCarrinho(prev => [...prev, novoItem]);
    };

    const removerItem = (id) => {
        setItensCarrinho(prev => prev.filter(item => item.id !== id));
    };

    const calcularSubtotal = () => {
        return itensCarrinho.reduce(
            (soma, item) => {
                // Lógica para calcular preço de item do histórico ou item novo
                if (item.origem === 'historico') {
                    return soma + (item.preco || 0);
                }
                return soma + (precos[item.tamanho] || 0);
            },
            0
        );
    };

    const subtotal = calcularSubtotal();
    const total = subtotal + frete - desconto;

    const handleAdicionarMais = () => {
        // Volta para CriePizza mantendo o estado do carrinho
        navigate('/crie_pizza', { state: { carrinho: itensCarrinho } });
    };

    const handleConcluirCompra = async () => {
        if (!usuarioLogado || !usuarioLogado.cliente_id) {
            alert("Você precisa estar logado para finalizar o pedido!");
            navigate('/login');
            return;
        }
        if (itensCarrinho.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        
        // --- MUDANÇA IMPORTANTE 1: Gerar os nomes ANTES de enviar ---
        // Vamos criar os 'nome_item' que serão usados no Histórico e Pedidos em Andamento
        const itensComNomeFormatado = itensCarrinho.map(item => {
            // Se já veio do histórico, apenas retorna
            if (item.origem === 'historico') {
                return { ...item, nome_item: item.nome }; // Garante que 'nome_item' exista
            }
            // Se veio do CriePizza, formata o nome
            const nomeFormatado = `Pizza ${item.tamanho} (${item.ingredientes.map(i => i.nome).join(', ')})`;
            return { ...item, nome_item: nomeFormatado };
        });


        const pedidoPayload = {
            usuario: {
                id: usuarioLogado.cliente_id,
                nome: usuarioLogado.nome,
                email: usuarioLogado.email
            },
            // Envia os itens com o nome_item formatado
            itens: itensComNomeFormatado, 
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
                alert('🍕 Pedido realizado com sucesso! Acompanhe na tela de "Pedidos em Andamento".');
                console.log("📦 Retorno do servidor:", data);
    
                const idsDaMaquina = data.idsDaMaquina || []; // IDs [ "machine-id-1", "machine-id-2" ]
    
                // --- MUDANÇA IMPORTANTE 2: Salvar {id, nome} no localStorage ---
                try {
                    const idsEmAndamento = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
                    
                    // Mapeia os IDs da máquina para os nomes dos itens que acabamos de formatar
                    const novosPedidosParaAndamento = idsDaMaquina.map((id, index) => {
                        const itemCorrespondente = itensComNomeFormatado[index];
                        return {
                            id: id, // O ID da máquina
                            nome: itemCorrespondente.nome_item // O nome completo (ex: "Pizza Média (Bacon...)")
                        };
                    });

                    // Adiciona os novos objetos ao array existente
                    const idsAtualizados = [...idsEmAndamento, ...novosPedidosParaAndamento];
                    localStorage.setItem("pedidosEmAndamento", JSON.stringify(idsAtualizados));

                } catch (error) {
                    console.error("Falha ao salvar o ID do pedido no localStorage:", error);
                }
                
                setItensCarrinho([]); // Limpa o carrinho
                navigate('/pedidosemandamento'); // Navega para a tela de andamento
            } else {
                alert(data.error || 'Erro ao concluir o pedido.');
            }
        } catch (err) {
            console.error("❌ Erro ao enviar pedido:", err);
            alert("Erro ao conectar com o servidor de pedidos.");
        }
    };
    
    // --- Lógica de Renderização do Carrinho (JSX) ---
    // (O seu JSX do carrinho continua aqui, sem necessidade de alterações)
    // ...
    // Apenas um exemplo de como exibir os itens (adapte ao seu código real)
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
                                            {/* --- MUDANÇA 3: Lógica de exibição adaptada --- */}
                                            {pizza.origem === 'historico' ? (
                                                <p className="nome-produto">{pizza.nome}</p>
                                            ) : (
                                                <>
                                                    <p className="nome-produto">
                                                        Pizza {pizza.tamanho} {pizza.molho.includes('Doce') ? 'Doce' : 'Salgada'}
                                                    </p>
                                                    <ul className="ingredientes-lista">
                                                        {pizza.ingredientes.map((ingrediente, i) => (
                                                            <li key={i}>{ingrediente.nome}</li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                        <div className="controle-produto">
                                            <div className="seletor-quantidade">
                                                <button onClick={() => removerItem(pizza.id)}>Remover</button>
                                                <button onClick={() => clonarItem(pizza)}>+</button>
                                            </div>
                                            {/* Lógica de preço adaptada */}
                                            <p className="preco-produto">
                                                R$ {(pizza.origem === 'historico' ? pizza.preco : (precos[pizza.tamanho] || 0)).toFixed(2)}
                                            </p>
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
