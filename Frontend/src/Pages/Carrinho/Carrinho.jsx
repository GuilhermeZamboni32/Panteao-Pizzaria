import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from '../../components/header/Header';
import './Carrinho.css';

function Carrinho() {
    const location = useLocation();
    const navigate = useNavigate();
    const itensIniciais = location.state?.carrinho || [];


    const [itensCarrinho, setItensCarrinho] = useState([]);
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

    
    useEffect(() => {
        // Este efeito agora preserva a quantidade dos itens que já estavam no carrinho
        if (itensIniciais) {
            const novoEstadoCarrinho = itensIniciais.map(itemRecebido => {
                const itemExistente = itensCarrinho.find(
                    itemAntigo =>
                        itemAntigo.tamanho === itemRecebido.tamanho &&
                        itemAntigo.molho === itemRecebido.molho &&
                        JSON.stringify(itemAntigo.ingredientes) === JSON.stringify(itemRecebido.ingredientes)
                );
                return {
                    ...itemRecebido,
                    quantidade: itemExistente ? itemExistente.quantidade : 1,
                };
            });
            setItensCarrinho(novoEstadoCarrinho);
        }

    }, [location.state]);


    const handleQuantidade = (index, delta) => {
        const novosItens = [...itensCarrinho];
        const item = novosItens[index];

        if (item.quantidade + delta <= 0) {
            novosItens.splice(index, 1);
        } else {
            item.quantidade += delta;
        }
        setItensCarrinho(novosItens);
    };

    const calcularSubtotal = () => {
        return itensCarrinho.reduce(
            (soma, item) => soma + (precos[item.tamanho] || 0) * item.quantidade,
            0
        );
    };

    const subtotal = calcularSubtotal();
    const total = subtotal + frete - desconto;

  
    const handleAdicionarMais = () => {
        // Envia o estado ATUAL do carrinho de volta para a tela de criação
        navigate('/crie_pizza', { state: { carrinho: itensCarrinho } });
    };

     const handleConcluirCompra = () => {
        // Aqui você poderia enviar os dados para um backend antes de mostrar o modal
      alert('Compra concluída com sucesso!');
    };
    
    // 4. Função para ser chamada quando o modal for fechado
    const handleFecharModal = () => {
        setModalVisivel(false); // Fecha o modal
        setItensCarrinho([]);   // Limpa o carrinho
        navigate('/');          // Redireciona para a página inicial
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
                                {itensCarrinho.map((pizza, index) => (
                                    <div key={index} className="produto-item">
                                        <div className="info-produto">
                                            <p className="nome-produto">
                                                Pizza {pizza.tamanho} {pizza.molho.includes('Doce') ? 'Doce' : 'Salgada'}
                                            </p>
                                        </div>
                                        <div className="controle-produto">
                                            <div className="seletor-quantidade">
                                                <button onClick={() => handleQuantidade(index, -1)}>-</button>
                                                <span>{pizza.quantidade}</span>
                                                <button onClick={() => handleQuantidade(index, 1)}>+</button>
                                            </div>
                                            <p className="preco-produto">R$ {(precos[pizza.tamanho] * pizza.quantidade).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* O botão agora chama a nova função handleAdicionarMais */}
                        <button className="btn-adicionar-mais" onClick={handleAdicionarMais}>
                            +
                        </button>

                        <div className="info-entrega">
                            <div className="linha-entrega">
                                <span>Frete</span>
                                <span>R$ {frete.toFixed(2)}</span>
                            </div>
                            <div className="info-usuario">
                                <p><strong>Seu nome:</strong><br/>{usuario.nome}</p>

                                <p><strong>Seu endereço:</strong><br/>{usuario.endereco}</p>
                            </div>
                        </div>
                        <div className="logo-meio">
                           <img src="/logo.png" alt="Logo Panteão" />
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
                        <div className="linha-pagamento">
                            <span>Desconto:</span>
                            <span>R$ {desconto.toFixed(2)}</span>
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