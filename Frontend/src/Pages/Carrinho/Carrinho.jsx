import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from '../../components/pastaheader/Header';
import './Carrinho.css'; 

// --- Componente Modal de Pagamento ---
const ModalPagamento = ({ onSubmit, onCancel, mensagemErro }) => {
    // (O código do ModalPagamento permanece exatamente o mesmo)
    const [cartao, setCartao] = useState('');
    const [validade, setValidade] = useState('');
    const [cvv, setCvv] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!/^\d{16}$/.test(cartao)) {
            onSubmit(null, "Número do cartão inválido (deve ter 16 dígitos).");
            return;
        }
        if (!/^\d{2}\/\d{2}$/.test(validade)) {
            onSubmit(null, "Validade inválida (use MM/AA).");
            return;
        }
        if (!/^\d{3,4}$/.test(cvv)) {
            onSubmit(null, "CVV inválido (deve ter 3 ou 4 dígitos).");
            return;
        }
        onSubmit({ numero_cartao: cartao, validade_cartao: validade, cvv: cvv }, null);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Informações de Pagamento</h2>
                <p>Como é a sua primeira compra, precisamos dos dados do seu cartão.</p>
                <form className="modal-form" onSubmit={handleSubmit}>
                    {/* (Inputs do formulário do modal... sem alterações) */}
                    <div className="modal-form-group">
                        <label htmlFor="numero_cartao">Número do Cartão:</label>
                        <input
                            type="text"
                            id="numero_cartao"
                            placeholder="0000 0000 0000 0000"
                            maxLength="16"
                            value={cartao}
                            onChange={(e) => setCartao(e.target.value)}
                            required
                        />
                    </div>
                    <div className="modal-form-group-inline">
                        <div className="modal-form-group">
                            <label htmlFor="validade_cartao">Validade:</label>
                            <input
                                type="text"
                                id="validade_cartao"
                                placeholder="MM/AA"
                                maxLength="5"
                                value={validade}
                                onChange={(e) => setValidade(e.target.value)}
                                required
                            />
                        </div>
                        <div className="modal-form-group">
                            <label htmlFor="cvv">CVV:</label>
                            <input
                                type="text"
                                id="cvv"
                                placeholder="CVV"
                                maxLength="4"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    {mensagemErro && <p className="modal-mensagem-erro">{mensagemErro}</p>}
                    <div className="modal-botoes">
                        <button type="button" className="btn-modal-cancelar" onClick={onCancel}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-modal-salvar">
                            Salvar e Continuar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
// --- Fim do Componente Modal ---


function Carrinho() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [itensCarrinho, setItensCarrinho] = useState(location.state?.carrinho || []);
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    
    const frete = 5;
    const desconto = 0;
    const precos = { Broto: 25, Média: 30, Grande: 45 };
    
    useEffect(() => {
        setItensCarrinho(location.state?.carrinho || []);
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
        navigate('/crie_pizza', { state: { carrinho: itensCarrinho } });
    };

    // --- 1. LÓGICA DE COMPRA PRINCIPAL ---
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

        // **A VERIFICAÇÃO**
        // (Sua lógica de verificar 'numero_cartao' está correta)
        if (!usuarioLogado.numero_cartao) {
            console.log("Usuário sem cartão. Abrindo modal...");
            setModalMessage('');
            setShowModal(true);
            return; 
        }

        console.log("Usuário já tem cartão. Prosseguindo...");
        proceedToCheckout(usuarioLogado);
    };

    // --- 2. FUNÇÃO CHAMADA PELO MODAL ---
    const handleModalSubmit = async (paymentData, erro) => {
        if (erro) {
            setModalMessage(erro); 
            return;
        }

        if (paymentData) {
            // (Sua lógica de salvar no localStorage está correta)
            console.log("Salvando dados do cartão no localStorage...");
            const updatedUser = {
                ...usuarioLogado,
                ...paymentData 
            };
            localStorage.setItem('usuarioLogado', JSON.stringify(updatedUser));
            setUsuarioLogado(updatedUser);
            setShowModal(false);
            setModalMessage('');

            // Prossegue para o checkout com o usuário atualizado
            proceedToCheckout(updatedUser);
        }
    };

    // --- 3. FUNÇÃO DE CHECKOUT FINAL ---
    const proceedToCheckout = async (usuarioComCartao) => {
        
        // (Sua lógica de formatar nomes está correta)
        const itensComNomeFormatado = itensCarrinho.map(item => {
            if (item.origem === 'historico') {
                return { ...item, nome_item: item.nome };
            }
            const nomeFormatado = `Pizza ${item.tamanho} (${item.ingredientes.map(i => i.nome).join(', ')})`;
            return { ...item, nome_item: nomeFormatado };
        });


        const pedidoPayload = {
            usuario: {
                id: usuarioComCartao.cliente_id,
                nome: usuarioComCartao.nome,
                email: usuarioComCartao.email
            },
            itens: itensComNomeFormatado,
            total: total
        };
    
        try {
            const response = await fetch('http://localhost:3002/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedidoPayload)
            });
            const data = await response.json(); // <-- 'data' AGORA TEM A RECOMENDAÇÃO
    
            if (response.ok) {
                alert('🍕 Pedido realizado com sucesso!');
                
                // Pega os IDs e a nova recomendação
                const idsDaMaquina = data.idsDaMaquina || [];
                const recomendacaoIA = data.recomendacao; // <-- PEGA A RECOMENDAÇÃO

                try {
                    // (Sua lógica de salvar IDs no localStorage está correta)
                    const idsEmAndamento = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
                    const novosPedidosParaAndamento = idsDaMaquina.map((id, index) => {
                        const itemCorrespondente = itensComNomeFormatado[index];
                        return {
                            id: id, 
                            nome: itemCorrespondente.nome_item
                        };
                    });
                    const idsAtualizados = [...idsEmAndamento, ...novosPedidosParaAndamento];
                    localStorage.setItem("pedidosEmAndamento", JSON.stringify(idsAtualizados));
                } catch (error) {
                    console.error("Falha ao salvar IDs no localStorage:", error);
                }
                
                setItensCarrinho([]);
                
                // ==========================================================
                // --- ALTERAÇÃO PRINCIPAL AQUI ---
                // Navega para a próxima página E PASSA A RECOMENDAÇÃO no state
                // ==========================================================
                navigate('/pedidosemandamento', {
                    state: {
                        recomendacao: recomendacaoIA
                        // Não precisamos passar os IDs, pois já estão no localStorage
                    }
                });
                // ==========================================================

            } else {
                alert(data.error || 'Erro ao concluir o pedido.');
            }
        } catch (err) {
            console.error("❌ Erro ao enviar pedido:", err);
            alert("Erro ao conectar com o servidor de pedidos.");
        }
    };

    // --- JSX (RENDERIZAÇÃO) ---
    // (O seu JSX permanece exatamente o mesmo)
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
                                                <button className="btn-remover-pizza" onClick={() => removerItem(pizza.id)}>Remover</button>
                                                <button className="btn-adicionar-pizza" onClick={() => clonarItem(pizza)}>+</button>
                                            </div>
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

            {showModal && (
                <ModalPagamento
                    mensagemErro={modalMessage}
                    onCancel={() => {
                        setShowModal(false);
                        setModalMessage('');
                    }}
                    onSubmit={handleModalSubmit}
                />
            )}
        </div>
    );
}

export default Carrinho;
