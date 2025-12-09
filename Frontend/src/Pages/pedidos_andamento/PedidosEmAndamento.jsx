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
// Centraliza a lógica para saber se o pedido acabou
const verificarSeFinalizado = (status) => {
    if (typeof status !== 'string') return false;
    const s = status.toLowerCase();
    return (
        s.includes("entregue") || 
        s.includes("erro") || 
        s.includes("falha") || 
        s.includes("não encontrado") ||
        s.includes("cancelado") ||
        s.includes("delivered") // Adicionado inglês
    );
};

// Verifica se o pedido está pronto para retirada
const verificarSeProntoParaRetirada = (status) => {
    if (typeof status !== 'string') return false;
    const s = status.toLowerCase();
    return (
        s.includes("pronto") || 
        s.includes("completed") || 
        s.includes("conclu") ||   
        s.includes("finaliz") ||  
        s.includes("sucesso") ||
        s.includes("expedicao")
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
            return { className: "status-erro", icon: icons.erro, texto: "Erro no Pedido" };
        }
        // Status de carregamento/processamento
        if (lowerStatus.includes("carregando") || lowerStatus.includes("enviando") || lowerStatus.includes("recebido") || lowerStatus.includes("pending") || lowerStatus.includes("na_fila") || lowerStatus.includes("produzindo")) {
             // Tradução visual amigável
             let texto = "Preparando...";
             if (lowerStatus.includes("enviando")) texto = "Enviando para Cozinha...";
             if (lowerStatus.includes("na_fila")) texto = "Na Fila...";
             if (lowerStatus.includes("produzindo")) texto = "No Forno...";
             
             return { className: "status-carregando", icon: icons.carregando, texto: texto };
        }
        // Se estiver pronto (Sucesso)
        if (verificarSeProntoParaRetirada(status)) {
            return { className: "status-sucesso", icon: icons.sucesso, texto: "Pronto para Retirar!" };
        }
        // Se já foi entregue (Finalizado)
        if (lowerStatus.includes("entregue") || lowerStatus.includes("delivered")) {
             return { className: "status-sucesso", icon: icons.sucesso, texto: "Entregue" };
        }

        // Default
        return { className: "status-ok", icon: icons.ok, texto: status };
    };

    // 1. Carregar IDs do LocalStorage
    useEffect(() => {
        try {
            const pedidosSalvos = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
            const pedidosValidos = pedidosSalvos.filter(p => p && p.id && p.nome); 
            
            if (pedidosValidos.length > 0) {
              setPedidos(pedidosValidos.map(p => ({ 
                  id: p.id, 
                  status: "Carregando...", 
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

        const fetchStatus = async () => {
            let houveAlteracao = false;
            
            const novosPedidos = await Promise.all(pedidos.map(async (pedido) => {
                if (verificarSeFinalizado(pedido.status)) {
                    return pedido;
                }

                try {
                    const res = await fetch(`http://localhost:3002/api/pedidos/status/${pedido.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        
                        // --- AQUI ESTÁ A CORREÇÃO PRINCIPAL ---
                        // Verifica todos os campos possíveis que o backend pode mandar
                        const statusBruto = data.status || data.status_externo || data.status_maquina || "Status Desconhecido";
                        
                        // Pega o slot se existir no payload
                        const novoSlot = data.slot || data.item?.slot || null;
                        
                        if (statusBruto !== pedido.status || novoSlot !== pedido.slot) {
                            houveAlteracao = true;
                            console.log(`Atualização: ${pedido.id} -> ${statusBruto}`);
                            return { ...pedido, status: statusBruto, slot: novoSlot };
                        }
                    } else if (res.status === 404) {
                        houveAlteracao = true;
                        return { ...pedido, status: "Pedido não encontrado", slot: null };
                    }
                } catch (err) {
                    // Erro de rede silencioso, mantém o estado atual
                    return pedido;
                }
                return pedido;
            }));

            if (houveAlteracao) {
                setPedidos(novosPedidos);
            }
        };

        const existemPedidosAtivos = pedidos.some(p => !verificarSeFinalizado(p.status));
        let intervalId = null;

        if (existemPedidosAtivos) {
            fetchStatus(); // Busca imediata
            intervalId = setInterval(fetchStatus, 3000); // Polling a cada 3s (mais rápido)
        }

        // Configura Timers de Remoção
        pedidos.forEach(pedido => {
            if (verificarSeFinalizado(pedido.status)) {
                if (!removalTimersRef.current.has(pedido.id)) {
                    const tempoRemocao = verificarSeErro(pedido.status) ? 10000 : 30000;
                    
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
        };
    }, [pedidos]);

    const handleConfirmarEntrega = async (pedidoId) => {
        // 1. Chama o Backend para liberar o slot e marcar como entregue
        try {
            const res = await fetch('http://localhost:3002/api/pedidos/confirmar_entrega', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ machine_id: pedidoId })
            });

            if (!res.ok) throw new Error('Falha ao confirmar entrega');

            // 2. Remove visualmente da lista NA HORA (UX instantânea)
            const novosPedidos = pedidos.filter(p => p.id !== pedidoId);
            setPedidos(novosPedidos);

            // 3. Atualiza o LocalStorage para não voltar se der F5
            const idsParaSalvar = novosPedidos.map(p => ({ id: p.id, nome: p.nome }));
            localStorage.setItem("pedidosEmAndamento", JSON.stringify(idsParaSalvar));

        } catch (error) {
            console.error("Erro ao confirmar:", error);
            alert("Não foi possível confirmar a entrega. Tente novamente.");
        }
    };

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
                                                {/* Mostramos o ID pequeno para debug/conferência se quiser 
                                                <span className="pedido-texto-id">#{pedido.id.slice(-4)}</span> */}
                                            </div>
                                            
                                            <div className="pedido-status-container">
                                                <div className={`status-badge ${statusInfo.className}`}>
                                                    <span className="status-icone">{statusInfo.icon}</span>
                                                    {statusInfo.texto} 
                                                </div>
                                                
                                                {mostrarSlot && (
                                                    <div className="pedido-slot-destaque">
                                                        <div className="slot-label">
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                            </svg>
                                                            RETIRAR NO
                                                        </div>
                                                        <div className="slot-valor">{pedido.slot}</div>
                                                    </div>
                                                )}
        
                                                {/* NOVO BOTÃO: Só aparece quando está PRONTO */}
                                                {isPronto && (
                                                    <button 
                                                        className="btn-recebi-pedido"
                                                        onClick={() => handleConfirmarEntrega(pedido.id)}
                                                    >
                                                        Já retirei meu pedido
                                                    </button>
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