import React, { useEffect, useState } from "react";

function PedidosEmAndamento() {
  const [pedidos, setPedidos] = useState([]); // [{id, status}, ...]

  // Carrega IDs do localStorage (salvos no Carrinho)
  useEffect(() => {
    const idsSalvos = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
    setPedidos(idsSalvos.map((id) => ({ id, status: "Carregando..." })));
  }, []);

  // Função para buscar status de cada pedido
  const atualizarStatus = async () => {
    const atualizados = await Promise.all(
      pedidos.map(async (pedido) => {
        try {
          const res = await fetch(`http://52.1.197.112:3000/queue/items/${pedido.id}`);
          if (!res.ok) throw new Error("Erro ao buscar status");
          const data = await res.json();
          return { ...pedido, status: data.status || "Desconhecido" };
        } catch (err) {
          console.error("Erro:", err);
          return { ...pedido, status: "Erro ao consultar" };
        }
      })
    );
    setPedidos(atualizados);
  };

  // Atualiza a cada 10s
  useEffect(() => {
    if (pedidos.length > 0) {
      atualizarStatus();
      const interval = setInterval(atualizarStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [pedidos]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📦 Pedidos em Andamento</h2>
      {pedidos.length === 0 ? (
        <p>Nenhum pedido em andamento.</p>
      ) : (
        <ul>
          {pedidos.map((pedido) => (
            <li key={pedido.id}>
              <strong>ID:</strong> {pedido.id} | <strong>Status:</strong> {pedido.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PedidosEmAndamento;
