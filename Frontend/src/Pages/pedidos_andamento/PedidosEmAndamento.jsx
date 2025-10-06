import React, { useEffect, useState, useRef } from "react";
import "./PedidosEmAndamento.css";
import Header from "../../components/pastaheader/Header";
import { useNavigate } from 'react-router-dom';

function PedidosEmAndamento() {
    const [pedidos, setPedidos] = useState([]);
    const intervalRef = useRef(null);
    const navigate = useNavigate();

    // Mapeamento de status para classes de CSS para cores e ícones
    const getStatusInfo = (status) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes("erro") || lowerStatus.includes("falha")) {
            return { className: "status-erro", icon: "❌" };
        }
        if (lowerStatus.includes("carregando")) {
            return { className: "status-carregando", icon: "⏳" };
        }
        // Adicione outros status conforme necessário
        if (lowerStatus.includes("pronto") || lowerStatus.includes("entregue")) {
            return { className: "status-sucesso", icon: "✅" };
        }
        // Status padrão para 'Em produção', 'Recebido', etc.
        return { className: "status-ok", icon: "⚙️" };
    };

    // Efeito para carregar os IDs do localStorage ao montar o componente
    useEffect(() => {
        try {
            const idsSalvos = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
            const idsValidos = idsSalvos.filter(id => id);
            setPedidos(idsValidos.map((id) => ({ id, status: "Carregando..." })));
        } catch (error) {
            console.error("Erro ao ler pedidos do localStorage:", error);
            localStorage.removeItem("pedidosEmAndamento");
        }
    }, []);

    // Efeito para buscar os status dos pedidos
    useEffect(() => {
        const atualizarStatusDeTodos = async () => {
            if (pedidos.length === 0) return;

            const promessasDeStatus = pedidos.map(async (pedido) => {
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
            atualizarStatusDeTodos(); // Busca inicial
            intervalRef.current = setInterval(atualizarStatusDeTodos, 10000); // Atualiza a cada 10s
        }

        return () => intervalRef.current && clearInterval(intervalRef.current);
    }, [pedidos.length]); // Roda de novo se a quantidade de pedidos mudar

    return (
        <div className="pagina-pedidos">
            <Header />
            <main className="container-pedidos">
                <div className="box-pedidos">
                     <button className="btn-voltar-cardapio" onClick={() => navigate('/historico_pedidos')}>
                        Voltar ao Histórico de Pedidos
                    </button>
                    <h1 className="titulo-pedidos">Acompanhe seus Pedidos</h1>
                    {pedidos.length === 0 ? (
                        <p className="sem-pedidos">Nenhum pedido em andamento no momento.</p>
                    ) : (
                        <ul className="lista-pedidos">
                            {pedidos.map((pedido) => {
                                const statusInfo = getStatusInfo(pedido.status);
                                return (
                                    <li key={pedido.id} className="pedido-item">
                                        <div className="pedido-info">
                                            <span className="pedido-texto">ID do Item:</span>
                                            <span className="pedido-id">{pedido.id}</span>
                                        </div>
                                        <div className={`status-badge ${statusInfo.className}`}>
                                            {statusInfo.icon} {pedido.status}
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

