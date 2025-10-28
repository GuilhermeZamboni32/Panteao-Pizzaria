import React, { useEffect, useState, useRef } from "react";
import "./PedidosEmAndamento.css";
import Header from "../../components/pastaheader/Header";
import { useNavigate } from 'react-router-dom';

const icons = {
  sucesso: <img src="/icons/sucesso-preto.png" alt="" className="icone-status"/>,
  erro: <img src="/icons/erro-preto.png" alt="" className="icone-status"/>,
  carregando: <img src="/icons/carregando-preto.png" alt="" className="icone-status"/>,
  ok: <img src="/icons/carregando-2-preto.png" alt="" className="icone-status"/>
};

function PedidosEmAndamento() {
    const [pedidos, setPedidos] = useState([]);
    const intervalRef = useRef(null);
    const navigate = useNavigate();
    const removalTimersRef = useRef(new Map());// remove os pedidos concluídos
    const [carregamentoInicialCompleto, setCarregamentoInicialCompleto] = useState(false);//tempo para carregar os pedidos

    const getStatusInfo = (status) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes("erro") || lowerStatus.includes("falha")) {
            return { className: "status-erro", icon: icons.erro };
        }
        if (lowerStatus.endsWith("carregando...")) {
             return { className: "status-carregando", icon: icons.carregando };
        }
        if (lowerStatus.includes("pronto") || lowerStatus.includes("entregue")) {
            return { className: "status-sucesso", icon: icons.sucesso };
        }
        return { className: "status-ok", icon: icons.ok };
    };

    
    useEffect(() => {
        try {
            const idsSalvos = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
            const idsValidos = idsSalvos.filter(id => id);
            if (idsValidos.length > 0) {
              setPedidos(idsValidos.map((id) => ({ id, status: "Carregando..." })));
            } else {
              setCarregamentoInicialCompleto(true);
            }
        } catch (error) {
            console.error("Erro ao ler pedidos do localStorage:", error);
            localStorage.removeItem("pedidosEmAndamento");
            setCarregamentoInicialCompleto(true); 
        }
    }, []);


   
    useEffect(() => {
        pedidos.forEach(pedido => {
            const isConcluido = pedido.status.toLowerCase().includes("pronto") ||
                                pedido.status.toLowerCase().includes("entregue");
            if (isConcluido && !removalTimersRef.current.has(pedido.id)) {
                const timerId = setTimeout(() => {
                    console.log(`Removendo pedido concluído: ${pedido.id}`);
                    setPedidos(prev => prev.filter(p => p.id !== pedido.id));
                    try {
                        const idsSalvos = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
                        const idsAtualizados = idsSalvos.filter(id => id !== pedido.id);
                        localStorage.setItem("pedidosEmAndamento", JSON.stringify(idsAtualizados));
                    } catch (e) {
                        console.error("Erro ao remover do localStorage:", e);
                    }
                    removalTimersRef.current.delete(pedido.id);
                }, 5000);
                removalTimersRef.current.set(pedido.id, timerId);
            }
        });

        const atualizarStatusDeTodos = async (isInitialLoad = false) => {//  buscar status 
            if (pedidos.length === 0 || pedidos.every(p => {
                const s = p.status.toLowerCase();
                return s.includes("pronto") || s.includes("entregue") || s.includes("erro");
            })) {
                return;
            }

            console.log(isInitialLoad ? "Buscando status iniciais..." : "Atualizando status...");

            const promessasDeStatus = pedidos.map(async (pedido) => {
                const statusLower = pedido.status.toLowerCase();
                if (statusLower.includes("pronto") || statusLower.includes("entregue") || statusLower.includes("erro")) {
                    return pedido; // Retorna o pedido como está
                }
                if (isInitialLoad || !statusLower.endsWith("carregando...")) {
                    try {
                        const res = await fetch(`http://localhost:3002/api/pedidos/status/${pedido.id}`);
                        if (!res.ok) return { ...pedido, status: `Erro ${res.status}` };
                        const data = await res.json();
                        return { ...pedido, status: data.status || "Desconhecido" };
                    } catch (err) {
                        console.error(`Erro ao buscar status para o pedido ${pedido.id}:`, err);
                        return { ...pedido, status: "Falha na conexão" };
                    }
                } else {
                     return pedido;
                }
            });

            const pedidosComStatusBuscados = await Promise.all(promessasDeStatus);

            // Atrasa a atualização 
            if (isInitialLoad) {
                setTimeout(() => {
                    console.log("Aplicando status iniciais após 3 segundos.");
                    setPedidos(pedidosComStatusBuscados);
                    setCarregamentoInicialCompleto(true); 
                }, 3000); //  3 segundos
            } else {
                setPedidos(pedidosComStatusBuscados); // Atualizações normais a cada 10s
            }
        };

        const todosFinalizados = pedidos.every(p => {
           const statusLower = p.status.toLowerCase();
           return statusLower.includes("pronto") || statusLower.includes("entregue") || statusLower.includes("erro");
        });


        if (pedidos.length > 0 && !todosFinalizados) {
            if (!carregamentoInicialCompleto) {
                 if (pedidos.some(p => p.status === "Carregando...")) { // Só busca se houver algo para buscar
                    atualizarStatusDeTodos(true); // true indica que é a carga inicial
                 }
            }
            else if (carregamentoInicialCompleto && !intervalRef.current) {
                console.log("Iniciando intervalo de atualização (10s)...");
                 atualizarStatusDeTodos(false);
                intervalRef.current = setInterval(() => atualizarStatusDeTodos(false), 10000); // E depois a cada 10 segundos
            }
        } else if (todosFinalizados && intervalRef.current) {
            console.log("Todos os pedidos finalizados. Parando intervalo.");
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }


        // Limpa o useEffect
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            removalTimersRef.current.forEach(timerId => clearTimeout(timerId));
        };
    }, [pedidos, carregamentoInicialCompleto]);

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

                    {pedidos.length === 0 && carregamentoInicialCompleto ? ( // Só mostra "sem pedidos" se o carregamento acabou
                        <div className="sem-pedidos">
                             <div className="sem-pedidos-icone">🍕</div>
                             <h2>Nenhum pedido em andamento</h2>
                             <p>Seus pedidos ativos aparecerão aqui assim que você finalizar uma compra.</p>
                        </div>
                    ) : (
                        <ul className="lista-pedidos-status">
                            {pedidos.map((pedido) => {
                                const statusInfo = getStatusInfo(pedido.status);
                                return (
                                    <li key={pedido.id} className="pedido-item">
                                        <div className="pedido-info">
                                            <span className="pedido-texto">Pedido</span>
                                            <span className="pedido-id">{pedido.id}</span>
                                        </div>
                                        <div className={`status-badge ${statusInfo.className}`}>
                                            <span className="status-icone">{statusInfo.icon}</span>
                                            {pedido.status}
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