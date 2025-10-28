import React, { useEffect, useState, useRef } from "react";
import "./PedidosEmAndamento.css";
import Header from "../../components/pastaheader/Header";
import { useNavigate } from 'react-router-dom';

// Ícones de status do pedido
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

    const getStatusInfo = (status) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes("erro") || lowerStatus.includes("Falha")) {
            return { className: "status-erro", icon: icons.erro };
        }
        if (lowerStatus.includes("carregando") || lowerStatus.includes("Carregando")) {
            return { className: "status-carregando", icon: icons.carregando };
        }
        if (lowerStatus.includes("pronto") || lowerStatus.includes("Entregue")) {
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
            }
        } catch (error) {
            console.error("Erro ao ler pedidos do localStorage:", error);
            localStorage.removeItem("pedidosEmAndamento");
        }
    }, []);

    useEffect(() => {
        const atualizarStatusDeTodos = async () => {
            if (pedidos.length === 0 || pedidos.every(p => p.status !== "Carregando...")) return;

            const promessasDeStatus = pedidos.map(async (pedido) => {
                // Não busca novamente status de pedidos finalizados
                if (pedido.status.toLowerCase().includes("pronto") || pedido.status.toLowerCase().includes("entregue") || pedido.status.toLowerCase().includes("erro")) {
                    return pedido;
                }
                try {
                    const res = await fetch(`http://localhost:3002/api/pedidos/status/${pedido.id}`);
                    if (!res.ok) return { ...pedido, status: `Erro ${res.status}` };
                    const data = await res.json();
                    return { ...pedido, status: data.status || "Desconhecido" };
                } catch (err) {
                    console.error(`Erro ao buscar status para o pedido ${pedido.id}:`, err);
                    return { ...pedido, status: "Falha na conexão" };
                }
            });
            const pedidosAtualizados = await Promise.all(promessasDeStatus);
            setPedidos(pedidosAtualizados);
        };

        if (pedidos.length > 0) {
            atualizarStatusDeTodos(); 
            intervalRef.current = setInterval(atualizarStatusDeTodos, 10000);
        }

        return () => intervalRef.current && clearInterval(intervalRef.current);
    }, [pedidos]); 

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
                    
                    {pedidos.length === 0 ? (
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