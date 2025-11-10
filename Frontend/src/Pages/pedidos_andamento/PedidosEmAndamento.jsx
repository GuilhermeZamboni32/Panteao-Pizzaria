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

// --- FUNÇÃO PARA GERAR NOME (Copiada do Histórico) ---
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
        
        return `Pizza ${tamanho}`.trim();
    }
    return `Combo com ${pedido.itens.length} pizzas`;
};


function PedidosEmAndamento() {
    const [pedidos, setPedidos] = useState([]);
    const intervalRef = useRef(null);
    const navigate = useNavigate();
    const removalTimersRef = useRef(new Map());
    const [carregamentoInicialCompleto, setCarregamentoInicialCompleto] = useState(false);


    const location = useLocation();
    const recomendacaoIA = location.state?.recomendacao;

    const getStatusInfo = (status) => {
        if (typeof status !== 'string') {
             console.warn("getStatusInfo recebeu status inválido:", status);
             return { className: "status-erro", icon: icons.erro };
        }
        const lowerStatus = status.toLowerCase();

        if (lowerStatus.includes("erro") || lowerStatus.includes("falha") || lowerStatus.includes("não encontrado")) {
            return { className: "status-erro", icon: icons.erro };
        }
        if (lowerStatus.endsWith("carregando...")) {
             return { className: "status-carregando", icon: icons.carregando };
        }
        if (lowerStatus.includes("pronto") || lowerStatus.includes("entregue") || lowerStatus.includes("completed")) {
            return { className: "status-sucesso", icon: icons.sucesso };
        }
        return { className: "status-ok", icon: icons.ok };
    };

    // --- CORREÇÃO AQUI ---
    // Efeito para carregar IDs e NOMES do localStorage
    useEffect(() => {
        try {
            // Lê o array de objetos {id, nome}
            const pedidosSalvos = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
            // Filtra objetos válidos que tenham id E nome
            const pedidosValidos = pedidosSalvos.filter(p => p && p.id && p.nome); 
            
            if (pedidosValidos.length > 0) {
              // Mapeia os objetos para o estado inicial
              setPedidos(pedidosValidos.map(p => ({ 
                  id: p.id, // O ID da máquina
                  status: "Carregando...", 
                  slot: null, 
                  nome: p.nome // O nome completo (vindo do localStorage)
              })));
            } else {
              setCarregamentoInicialCompleto(true);
            }
        } catch (error) {
            console.error("Erro ao ler pedidos do localStorage:", error);
            localStorage.removeItem("pedidosEmAndamento");
            setCarregamentoInicialCompleto(true);
        }
    }, []); // Roda só uma vez

    // Efeito principal: busca status, agenda remoção, controla intervalo
    useEffect(() => {
        // Agendamento de Remoção
        pedidos.forEach(pedido => {
            if (typeof pedido.status !== 'string') return;
            const statusLower = pedido.status.toLowerCase();
            const isConcluido = statusLower.includes("pronto") || statusLower.includes("entregue") || statusLower.includes("completed");
            const isErro = statusLower.includes("erro") || statusLower.includes("falha") || statusLower.includes("não encontrado");

            if (isConcluido && !isErro && !removalTimersRef.current.has(pedido.id)) {
                const timerId = setTimeout(() => {
                    setPedidos(prev => prev.filter(p => p.id !== pedido.id));
                    try {
                        const idsSalvos = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
                        // Filtra pelo ID do objeto
                        const idsAtualizados = idsSalvos.filter(p => p.id !== pedido.id); 
                        localStorage.setItem("pedidosEmAndamento", JSON.stringify(idsAtualizados));
                    } catch (e) { console.error("Erro ao remover do localStorage:", e); }
                    removalTimersRef.current.delete(pedido.id);
                }, 20000); 
                removalTimersRef.current.set(pedido.id, timerId);
            }
        });

        // Busca de Status
        const atualizarStatusDeTodos = async (isInitialLoad = false) => {
             if (pedidos.length === 0) return;

            const todosRealmenteFinalizados = pedidos.every(p => {
                const s = typeof p.status === 'string' ? p.status.toLowerCase() : '';
                return s.includes("pronto") || s.includes("entregue") || s.includes("completed") || s.includes("erro") || s.includes("não encontrado");
            });
            if(todosRealmenteFinalizados && !isInitialLoad){
                if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
                return;
            }

            const promessasDeStatus = pedidos.map(async (pedido) => {
                 if (typeof pedido.status === 'string') {
                     const statusLower = pedido.status.toLowerCase();
                     if (!isInitialLoad && (statusLower.includes("pronto") || statusLower.includes("entregue") || statusLower.includes("completed") || statusLower.includes("erro") || statusLower.includes("não encontrado"))) {
                         return pedido;
                     }
                 }

                try {
                    const res = await fetch(`http://localhost:3002/api/pedidos/status/${pedido.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        console.log(`DEBUG: Recebido para ${pedido.id}: "${data.status}" (Slot: ${data.slot})`);
                        const statusRecebido = typeof data.status === 'string' ? data.status : "Status Desconhecido";
                        
                        // Mantém o nome que já temos no estado (vindo do localStorage)
                        return { id: pedido.id, status: statusRecebido, slot: data.slot || null, nome: pedido.nome };
                    } else if (res.status === 404) {
                        return { ...pedido, status: "Pedido não encontrado", slot: null };
                    } else {
                        return { ...pedido, status: `Erro ${res.status}`, slot: null };
                    }
                } catch (err) {
                    return { ...pedido, status: "Falha na conexão", slot: null };
                }
            });

            const pedidosComStatusBuscados = await Promise.all(promessasDeStatus);

            if (isInitialLoad) {
                setTimeout(() => {
                    setPedidos(pedidosComStatusBuscados);
                    setCarregamentoInicialCompleto(true);
                }, 3000);
            } else {
                 const mudouAlgo = pedidosComStatusBuscados.some((novoPedido, index) => {
                     const pedidoAntigo = pedidos[index];
                     if (!pedidoAntigo) return true;
                     return novoPedido.status !== pedidoAntigo.status ||
                            (novoPedido.slot || null) !== (pedidoAntigo.slot || null);
                 });
                 if(mudouAlgo){ setPedidos(pedidosComStatusBuscados); }
            }
        };

        // Controle do Intervalo (sem alteração)
         const todosFinalizadosCheck = pedidos.every(p => {
           const statusLower = typeof p.status === 'string' ? p.status.toLowerCase() : '';
           return statusLower.includes("pronto") || statusLower.includes("entregue") || statusLower.includes("completed") || statusLower.includes("erro") || statusLower.includes("não encontrado");
         });

        if (pedidos.length > 0 && !todosFinalizadosCheck) {
            if (!carregamentoInicialCompleto) {
                 if (pedidos.some(p => typeof p.status === 'string' && p.status === "Carregando...")) {
                    atualizarStatusDeTodos(true);
                 }
            }
            else if (carregamentoInicialCompleto && !intervalRef.current) {
                atualizarStatusDeTodos(false);
                intervalRef.current = setInterval(() => atualizarStatusDeTodos(false), 10000);
            }
        }
        else if (todosFinalizadosCheck && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Limpeza (sem alteração)
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            removalTimersRef.current.forEach(timerId => clearTimeout(timerId));
        };
    }, [pedidos, carregamentoInicialCompleto]);

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
                                
                                // Usa a função 'gerarNomePedido' para formatar o nome
                                const nomeDoPedido = pedido.nome ? 
                                    gerarNomePedido({ itens: [{ nome_item: pedido.nome }] }) : 
                                    "Carregando nome...";

                                return (
                                    <li key={pedido.id} className="pedido-item">
                                        <div className="pedido-info">
                                            {/* Exibe o nome formatado */}
                                            <span className="pedido-texto-nome">{nomeDoPedido}</span>
                                            {/* O ID foi removido como solicitado */}
                                        </div>
                                        <div className="pedido-status-container">
                                            {/* Badge do Status */}
                                            <div className={`status-badge ${statusInfo.className}`}>
                                                <span className="status-icone">{statusInfo.icon}</span>
                                                {typeof pedido.status === 'string' ? pedido.status : 'Status Inválido'}
                                            </div>
                                            {/* Informação do Slot (se existir) */}
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

