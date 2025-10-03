import React, { useEffect, useState, useRef } from "react";

function PedidosEmAndamento() {
  const [pedidos, setPedidos] = useState([]); // Array de objetos: {id, status}
  
  // Usamos useRef para evitar que o intervalo seja recriado em cada renderização
  const intervalRef = useRef(null);

  // 1. Efeito para carregar os IDs do localStorage apenas uma vez, quando o componente montar
  useEffect(() => {
    try {
      const idsSalvos = JSON.parse(localStorage.getItem("pedidosEmAndamento")) || [];
      // Filtra para garantir que não há valores nulos ou vazios
      const idsValidos = idsSalvos.filter(id => id); 
      setPedidos(idsValidos.map((id) => ({ id, status: "Carregando..." })));
    } catch (error) {
      console.error("Erro ao ler pedidos do localStorage:", error);
      localStorage.removeItem("pedidosEmAndamento"); // Limpa se estiver corrompido
    }
  }, []);

  // 2. Função para buscar o status de todos os pedidos na lista
  const atualizarStatusDeTodos = async () => {
    // Verificação para não fazer chamadas à toa se a lista estiver vazia
    if (pedidos.length === 0) return;

    console.log("Atualizando status...");
    
    const promessasDeStatus = pedidos.map(async (pedido) => {
      try {
        // Chamada para o NOSSO backend (a rota proxy)
        const res = await fetch(`http://localhost:3002/api/pedidos/status/${pedido.id}`);
        
        if (!res.ok) {
          // Se nosso backend falhar, retorna um erro claro
          return { ...pedido, status: `Erro ${res.status}` };
        }

        const data = await res.json();
        // A resposta da máquina pode ter o status dentro de `data.payload.status`
        // ou diretamente `data.status`. Ajuste se necessário.
        return { ...pedido, status: data.status || "Desconhecido" };

      } catch (err) {
        console.error(`Erro ao buscar status para o pedido ${pedido.id}:`, err);
        return { ...pedido, status: "Falha na conexão" };
      }
    });

    const pedidosAtualizados = await Promise.all(promessasDeStatus);
    setPedidos(pedidosAtualizados);
  };

  // 3. Efeito para controlar o intervalo de atualização
  useEffect(() => {
    // Se não há pedidos, não faz nada
    if (pedidos.length === 0) {
      return;
    }
    
    // Busca o status imediatamente na primeira vez
    atualizarStatusDeTodos();

    // Configura o intervalo para rodar a cada 10 segundos
    intervalRef.current = setInterval(atualizarStatusDeTodos, 10000);

    // Função de limpeza: quando o componente for desmontado, limpa o intervalo
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pedidos.length]); // Depende do tamanho do array para (re)iniciar

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", color: "#333" }}>
      <h2>📦 Pedidos em Andamento</h2>
      {pedidos.length === 0 ? (
        <p>Nenhum pedido em andamento no momento.</p>
      ) : (
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {pedidos.map((pedido) => (
            <li key={pedido.id} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "8px", borderRadius: "4px" }}>
              <strong>ID na Máquina:</strong> {pedido.id} | <strong>Status:</strong> {pedido.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PedidosEmAndamento;
