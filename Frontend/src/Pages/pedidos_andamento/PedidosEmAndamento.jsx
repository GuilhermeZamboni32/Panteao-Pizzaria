import React, { useEffect, useState, useRef } from "react";
import "./PedidosEmAndamento.css";
import Header from "../../components/pastaheader/Header";
import { useNavigate } from 'react-router-dom';

const icons = {
  sucesso: <img src="/icons/sucesso-preto.png" alt="Pronto" className="icone-status"/>,
  erro: <img src="/icons/erro-preto.png" alt="Erro" className="icone-status"/>,
  carregando: <img src="/icons/carregando-preto.png" alt="Carregando" className="icone-status"/>,
  ok: <img src="/icons/carregando-2-preto.png" alt="Em andamento" className="icone-status"/>
};

function PedidosEmAndamento() {
    const [pedidos, setPedidos] = useState([]); // Guarda { id, status, slot }
    const intervalRef = useRef(null);
    const navigate = useNavigate();
    const removalTimersRef = useRef(new Map());
    const [carregamentoInicialCompleto, setCarregamentoInicialCompleto] = useState(false);

    // Determina classe CSS e ícone baseado no status vindo do backend
    const getStatusInfo = (status) => {
        if (typeof status !== 'string') {
             console.warn("getStatusInfo recebeu status inválido:", status);
             return { className: "status-erro", icon: icons.erro };
        }
        const lowerStatus = status.toLowerCase();

        if (lowerStatus.includes("erro") || lowerStatus.includes("falha") || lowerStatus.includes("não encontrado")) {
            return { className: "status-erro", icon: icons.erro };
        }
        if (lowerStatus.endsWith("carregando...")) { // Apenas o status inicial do frontend
             return { className: "status-carregando", icon: icons.carregando };
        }
        if (lowerStatus.includes("pronto") || lowerStatus.includes("entregue") || lowerStatus.includes("completed")) { // Inclui "completed" da máquina real
            return { className: "status-sucesso", icon: icons.sucesso };
        }
        // Status intermediários (Recebido, Em Producao, etc.)
        return { className: "status-ok", icon: icons.ok };
    };

    // Efeito para carregar IDs do localStorage na montagem inicial
    useEffect(() => {
        try {
            const idsSalvos = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
            const idsValidos = idsSalvos.filter(id => id);
            if (idsValidos.length > 0) {
              setPedidos(idsValidos.map((id) => ({ id, status: "Carregando...", slot: null })));
            } else {
              setCarregamentoInicialCompleto(true);
            }
        } catch (error) {
            console.error("Erro ao ler pedidos do localStorage:", error);
            localStorage.removeItem("pedidosEmAndamento");
            setCarregamentoInicialCompleto(true);
        }
    }, []); // Roda só uma vez

    // Efeito principal: busca status, agenda remoção de concluídos e controla o intervalo de atualização
    useEffect(() => {
        // Agendamento de Remoção: Remove pedidos concluídos após um tempo
        pedidos.forEach(pedido => {
            if (typeof pedido.status !== 'string') return;
            const statusLower = pedido.status.toLowerCase();
            const isConcluido = statusLower.includes("pronto") || statusLower.includes("entregue") || statusLower.includes("completed");
            const isErro = statusLower.includes("erro") || statusLower.includes("falha") || statusLower.includes("não encontrado");

            if (isConcluido && !isErro && !removalTimersRef.current.has(pedido.id)) {
                const timerId = setTimeout(() => {
                    setPedidos(prev => prev.filter(p => p.id !== pedido.id));
                    // Remove do localStorage também
                    try {
                        const idsSalvos = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
                        const idsAtualizados = idsSalvos.filter(id => id !== pedido.id);
                        localStorage.setItem("pedidosEmAndamento", JSON.stringify(idsAtualizados));
                    } catch (e) { console.error("Erro ao remover do localStorage:", e); }
                    removalTimersRef.current.delete(pedido.id);
                }, 20000); // 20 segundos para remover
                removalTimersRef.current.set(pedido.id, timerId);
            }
        });

        // Busca de Status: Atualiza o status dos pedidos
        const atualizarStatusDeTodos = async (isInitialLoad = false) => {
             if (pedidos.length === 0) return;

            // Para o intervalo se todos já finalizaram
            const todosRealmenteFinalizados = pedidos.every(p => {
                const s = typeof p.status === 'string' ? p.status.toLowerCase() : '';
                return s.includes("pronto") || s.includes("entregue") || s.includes("completed") || s.includes("erro") || s.includes("não encontrado");
            });
            if(todosRealmenteFinalizados && !isInitialLoad){
                if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
                return;
            }

            const promessasDeStatus = pedidos.map(async (pedido) => {
                 // Evita buscar status de pedidos já finalizados (exceto na carga inicial)
                 if (typeof pedido.status === 'string') {
                     const statusLower = pedido.status.toLowerCase();
                     if (!isInitialLoad && (statusLower.includes("pronto") || statusLower.includes("entregue") || statusLower.includes("completed") || statusLower.includes("erro") || statusLower.includes("não encontrado"))) {
                         return pedido;
                     }
                 }

                // Faz o fetch para o backend proxy
                try {
                    const res = await fetch(`http://localhost:3002/api/pedidos/status/${pedido.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        console.log(`DEBUG: Status recebido para ${pedido.id}: "${data.status}" (Slot: ${data.slot})`); // Log útil para debug
                        const statusRecebido = typeof data.status === 'string' ? data.status : "Status Desconhecido";
                        return { id: pedido.id, status: statusRecebido, slot: data.slot || null };
                    } else if (res.status === 404) {
                        return { ...pedido, status: "Pedido não encontrado", slot: null };
                    } else {
                        return { ...pedido, status: `Erro ${res.status}`, slot: null };
                    }
                } catch (err) { // Erro de rede/conexão
                    return { ...pedido, status: "Falha na conexão", slot: null };
                }
            });

            const pedidosComStatusBuscados = await Promise.all(promessasDeStatus);

            // Aplica atualização com atraso na carga inicial
            if (isInitialLoad) {
                setTimeout(() => {
                    setPedidos(pedidosComStatusBuscados);
                    setCarregamentoInicialCompleto(true); // Libera o início do intervalo
                }, 3000); // 3 segundos de atraso
            } else {
                // Atualiza apenas se houver mudanças
                 const mudouAlgo = pedidosComStatusBuscados.some((novoPedido, index) => {
                     const pedidoAntigo = pedidos[index];
                     if (!pedidoAntigo) return true;
                     return novoPedido.status !== pedidoAntigo.status || (novoPedido.slot || null) !== (pedidoAntigo.slot || null);
                 });
                 if(mudouAlgo){ setPedidos(pedidosComStatusBuscados); }
            }
        };

        // Controle do Intervalo de Busca
         const todosFinalizadosCheck = pedidos.every(p => {
           const statusLower = typeof p.status === 'string' ? p.status.toLowerCase() : '';
           return statusLower.includes("pronto") || statusLower.includes("entregue") || statusLower.includes("completed") || statusLower.includes("erro") || statusLower.includes("não encontrado");
         });

        if (pedidos.length > 0 && !todosFinalizadosCheck) {
            // Dispara a busca inicial (com atraso)
            if (!carregamentoInicialCompleto) {
                 if (pedidos.some(p => typeof p.status === 'string' && p.status === "Carregando...")) {
                    atualizarStatusDeTodos(true);
                 }
            }
            // Inicia o intervalo após a carga inicial
            else if (carregamentoInicialCompleto && !intervalRef.current) {
                atualizarStatusDeTodos(false); // Busca uma vez
                intervalRef.current = setInterval(() => atualizarStatusDeTodos(false), 10000); // E depois a cada 10s
            }
        }
        // Para o intervalo se todos finalizaram
        else if (todosFinalizadosCheck && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Limpeza do useEffect: para o intervalo e limpa timers de remoção
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            removalTimersRef.current.forEach(timerId => clearTimeout(timerId));
        };
    }, [pedidos, carregamentoInicialCompleto]); // Dependências do efeito

    // Renderização do componente
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

                    {pedidos.length === 0 && carregamentoInicialCompleto ? (
                       <div className="sem-pedidos">
                            <div className="sem-pedidos-icone">🍕</div>
                            <h2>Nenhum pedido em andamento</h2>
                            <p>Seus pedidos ativos aparecerão aqui.</p>
                       </div>
                    ) : (
                        <ul className="lista-pedidos-status">
                            {pedidos.map((pedido) => {
                                const statusInfo = getStatusInfo(pedido.status || 'Erro');
                                const mostrarSlot = pedido.slot && typeof pedido.status === 'string' &&
                                                    (pedido.status.toLowerCase().includes("pronto") ||
                                                     pedido.status.toLowerCase().includes("entregue") ||
                                                     pedido.status.toLowerCase().includes("completed"));

                                return (
                                    <li key={pedido.id} className="pedido-item">
                                        <div className="pedido-info">
                                            <span className="pedido-texto">Pedido</span>
                                            <span className="pedido-id" title={pedido.id}>
                                                {pedido.id.length > 15 ? `${pedido.id.substring(0, 15)}...` : pedido.id}
                                            </span>
                                        </div>
                                        <div className="pedido-status-container">
                                            <div className={`status-badge ${statusInfo.className}`}>
                                                <span className="status-icone">{statusInfo.icon}</span>
                                                {typeof pedido.status === 'string' ? pedido.status : 'Status Inválido'}
                                            </div>
                                            {mostrarSlot && (
                                                <div className="pedido-slot-info">
                                                   <span>
                                                    <img src="/icons/local-preto.png" className="icone-local" alt="Ícone de local" />
                                                   </span> Retirar no: <strong>{pedido.slot}</strong>
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

