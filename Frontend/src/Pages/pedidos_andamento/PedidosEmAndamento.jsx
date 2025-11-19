import React, { useEffect, useState, useRef } from "react";
import "./PedidosEmAndamento.css";
import Header from "../../components/pastaheader/Header";
import { useNavigate, useLocation } from 'react-router-dom';

const icons = {
  sucesso: <img src="/icons/sucesso-preto.png" alt="Pronto" className="icone-status"/>,
  erro: <img src="/icons/erro-preto.png" alt="Erro" className="icone-status"/>,
  carregando: <img src="/icons/carregando-preto.png" alt="Carregando" className="icone-status"/>,
  ok: <img src="/icons/carregando-2-preto.png" alt="Em andamento" className="icone-status"/>
};

// --- HELPERS DE STATUS ---
// Centraliza a lógica para saber se o pedido acabou (seja sucesso ou erro)
// Se retornar TRUE, o polling (busca automática) pode parar para este item.
const verificarSeFinalizado = (status) => {
    if (typeof status !== 'string') return false;
    const s = status.toLowerCase();
    return (
        s.includes("entregue") || 
        s.includes("erro") || 
        s.includes("falha") || 
        s.includes("não encontrado") ||
        s.includes("cancelado")
    );
};

// Verifica se o pedido está pronto para retirada (mas ainda não foi entregue ao cliente)
const verificarSeProntoParaRetirada = (status) => {
    if (typeof status !== 'string') return false;
    const s = status.toLowerCase();
    return (
        s.includes("pronto") || 
        s.includes("completed") || 
        s.includes("conclu") ||   
        s.includes("finaliz") ||  
        s.includes("sucesso") ||
        s.includes("expedicao") // Adicionado status comum de middleware
    );
};

const verificarSeErro = (status) => {
    if (typeof status !== 'string') return true;
    const s = status.toLowerCase();
    return s.includes("erro") || s.includes("falha") || s.includes("não encontrado") || s.includes("cancelado");
};

// --- FUNÇÃO PARA GERAR NOME ---
const gerarNomePedido = (pedido) => {
    if (!pedido || !pedido.itens || pedido.itens.length === 0) {
        return "Pedido Vazio";
    }
    if (pedido.itens.length === 1) {
        const item = pedido.itens[0];
        const nomeItem = item?.nome_item || "";
        let tamanho = "";
        if (nomeItem.toLowerCase().includes("broto")) tamanho = "Broto";
        else if (nomeItem.toLowerCase().includes("média")) tamanho = "Média";
        else if (nomeItem.toLowerCase().includes("grande")) tamanho = "Grande";
        
        return `Pizza ${tamanho}`.trim() || nomeItem;
    }
    return `Combo com ${pedido.itens.length} pizzas`;
};

function PedidosEmAndamento() {
    const [pedidos, setPedidos] = useState([]);
    const navigate = useNavigate();
    const removalTimersRef = useRef(new Map());
    const location = useLocation();
    const recomendacaoIA = location.state?.recomendacao;

    // --- STATUS VISUAL ---
    const getStatusInfo = (status) => {
        if (typeof status !== 'string') {
             return { className: "status-erro", icon: icons.erro, texto: "Erro" };
        }
        const lowerStatus = status.toLowerCase();

        if (verificarSeErro(status)) {
            return { className: "status-erro", icon: icons.erro, texto: status };
        }
        // Se estiver enviando ou carregando
        if (lowerStatus.includes("carregando") || lowerStatus.includes("enviando") || lowerStatus.includes("recebido")) {
             return { className: "status-carregando", icon: icons.carregando, texto: "Enviando..." };
        }
        // Se estiver pronto (Sucesso)
        if (verificarSeProntoParaRetirada(status)) {
            return { className: "status-sucesso", icon: icons.sucesso, texto: "Pronto para Retirar!" };
        }
        // Se já foi entregue (Finalizado)
        if (lowerStatus.includes("entregue")) {
             return { className: "status-sucesso", icon: icons.sucesso, texto: "Entregue" };
        }

        // Default (Em produção/Andamento)
        return { className: "status-ok", icon: icons.ok, texto: status };
    };

    // 1. Carregar IDs do LocalStorage (Roda apenas uma vez na montagem)
    useEffect(() => {
        try {
            const pedidosSalvos = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
            // Garante que pegamos apenas entradas válidas
            const pedidosValidos = pedidosSalvos.filter(p => p && p.id && p.nome); 
            
            if (pedidosValidos.length > 0) {
              setPedidos(pedidosValidos.map(p => ({ 
                  id: p.id, 
                  status: "Carregando...", // Estado inicial visual
                  slot: null, 
                  nome: p.nome 
              })));
            }
        } catch (error) {
            console.error("Erro localStorage:", error);
            localStorage.removeItem("pedidosEmAndamento");
        }
    }, []);

    // 2. Lógica de Polling (Busca) e Remoção
    useEffect(() => {
        if (pedidos.length === 0) return;

        // Função de atualização
        const fetchStatus = async () => {
            let houveAlteracao = false;
            
            const novosPedidos = await Promise.all(pedidos.map(async (pedido) => {
                // Se já está entregue/erro, não busca mais para economizar rede
                if (verificarSeFinalizado(pedido.status)) {
                    return pedido;
                }

                try {
                    const res = await fetch(`http://localhost:3002/api/pedidos/status/${pedido.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        const novoStatus = data.status || "Status Desconhecido";
                        const novoSlot = data.slot || null;
                        
                        // Só atualiza se mudou algo
                        if (novoStatus !== pedido.status || novoSlot !== pedido.slot) {
                            houveAlteracao = true;
                            console.log(`Atualização detectada: ${pedido.id} -> ${novoStatus}`);
                            return { ...pedido, status: novoStatus, slot: novoSlot };
                        }
                    } else if (res.status === 404) {
                        houveAlteracao = true;
                        return { ...pedido, status: "Pedido não encontrado", slot: null };
                    } else {
                        // Erro temporário do servidor, mantém o antigo ou mostra erro
                        return pedido; 
                    }
                } catch (err) {
                    return pedido; // Falha na conexão, tenta na próxima
                }
                return pedido;
            }));

            if (houveAlteracao) {
                setPedidos(novosPedidos);
            }
        };

        // Lógica do Intervalo: Só roda se existir algum pedido NÃO finalizado (ou seja, não entregue e não erro)
        const existemPedidosAtivos = pedidos.some(p => !verificarSeFinalizado(p.status));
        let intervalId = null;

        if (existemPedidosAtivos) {
            fetchStatus(); // Busca imediata
            intervalId = setInterval(fetchStatus, 5000); // Busca a cada 5s
        }

        // Configura Timers de Remoção APENAS para pedidos "Entregues" ou com Erro Crítico
        // Pedidos "Prontos" (Completed/Expedicao) NÃO são removidos automaticamente, pois o usuário precisa ver o slot.
        pedidos.forEach(pedido => {
            if (verificarSeFinalizado(pedido.status)) {
                // Se finalizado e ainda não tem timer agendado
                if (!removalTimersRef.current.has(pedido.id)) {
                    // Remove rápido se for erro (10s), demora mais se for sucesso (entregue) (20s)
                    const tempoRemocao = verificarSeErro(pedido.status) ? 10000 : 20000;
                    
                    const timerId = setTimeout(() => {
                        setPedidos(currentPedidos => {
                            const filtrados = currentPedidos.filter(p => p.id !== pedido.id);
                            try {
                                const idsParaSalvar = filtrados.map(p => ({ id: p.id, nome: p.nome }));
                                localStorage.setItem("pedidosEmAndamento", JSON.stringify(idsParaSalvar));
                            } catch (e) { console.error(e); }
                            return filtrados;
                        });
                        removalTimersRef.current.delete(pedido.id);
                    }, tempoRemocao);

                    removalTimersRef.current.set(pedido.id, timerId);
                }
            }
        });

        return () => {
            if (intervalId) clearInterval(intervalId);
            // Não limpamos os timers de remoção aqui para persistirem durante re-renders
        };
    }, [pedidos]);

    // Renderização
    return (
        <div className="pagina-pedidos">
            <Header />
            <main className="container-pedidos">
                <div className="box-pedidos">
                    <button className="btn-voltar" onClick={() => navigate('/cardapio')}>
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg>
                        Voltar ao Cardápio
                    </button>
                    <h1 className="titulo-pedidos">Pedidos em Andamento</h1>
                    
                    {recomendacaoIA && (
                        <div className="card-recomendacao-ia">
                            <img src="/icons/dionisio-2.png" className="icon-dionisio" alt="Ícone do Dionísio" />
                            <div className="texto-recomendacao">
                            <strong>Sugestão do Dionísio:</strong>
                            <p>{recomendacaoIA}</p>
                            </div>
                        </div>
                    )}

                    {pedidos.length === 0 ? (
                       <div className="sem-pedidos">
                            <div className="sem-pedidos-icone">🍕</div>
                            <h2>Nenhum pedido em andamento</h2>
                            <p>Seus pedidos ativos aparecerão aqui.</p>
                       </div>
                    ) : (
                        <ul className="lista-pedidos-status">
                            {pedidos.map((pedido) => {
                                const statusInfo = getStatusInfo(pedido.status);
                                const isPronto = verificarSeProntoParaRetirada(pedido.status);
                                const mostrarSlot = pedido.slot && isPronto;
                                
                                const nomeDoPedido = pedido.nome ? 
                                    gerarNomePedido({ itens: [{ nome_item: pedido.nome }] }) : 
                                    "Pizza Personalizada";

                                return (
                                    <li key={pedido.id} className="pedido-item">
                                        <div className="pedido-info">
                                            <span className="pedido-texto-nome">{nomeDoPedido}</span>
                                        </div>
                                        <div className="pedido-status-container">
                                            <div className={`status-badge ${statusInfo.className}`}>
                                                <span className="status-icone">{statusInfo.icon}</span>
                                                {/* Exibe o texto amigável do helper */}
                                                {statusInfo.texto} 
                                            </div>
                                            
                                            {/* Se estiver pronto, mostra o Slot e talvez um botão de confirmar retirada (opcional) */}
                                            {mostrarSlot && (
                                                <div className="pedido-slot-destaque">
                                                   <div className="slot-label">
                                                       <img src="/icons/local-preto.png" className="icone-local" alt="Ícone de local" />
                                                       Retirar no:
                                                   </div>
                                                   <div className="slot-valor">{pedido.slot}</div>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}

export default PedidosEmAndamento;