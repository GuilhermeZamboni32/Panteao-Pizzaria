import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Header from "../../components/pastaheader/Header";
import './Historico_Pedidos.css';

// Ícones
const IconeCarrinho = () => (
  <img src="/icons/brancos/carrinho-compras-branco.png" className="carrinho-historico" alt="Ícone de carrinho" />
);
const IconeInfo = () => (
  <img src="/icons/brancos/lupa-branco.png" className="info-historico" alt="Ícone de lupa" />
);

// Função auxiliar para gerar nome descritivo do pedido
const gerarNomePedido = (pedido) => {
    if (!pedido || !pedido.itens || pedido.itens.length === 0) {
        return "Pedido Vazio";
    }

    if (pedido.itens.length === 1) {
        const item = pedido.itens[0];
        const nomeItem = item?.nome_item || "";
        let tamanho = "Tamanho Desconhecido";
        if (nomeItem.toLowerCase().includes("broto")) tamanho = "Broto";
        else if (nomeItem.toLowerCase().includes("média")) tamanho = "Média";
        else if (nomeItem.toLowerCase().includes("grande")) tamanho = "Grande";

        let tipo = "";
        // Inferência simplificada do tipo
        if (nomeItem.toLowerCase().includes("chocolate") || nomeItem.toLowerCase().includes("morango") || nomeItem.toLowerCase().includes("banana")) {
            tipo = "Doce";
        } else if (nomeItem.toLowerCase().includes("calabresa") || nomeItem.toLowerCase().includes("frango") || nomeItem.toLowerCase().includes("queijo")) {
             tipo = "Salgada";
        }
        return `Pizza ${tamanho} ${tipo}`.trim();
    }

    // Lógica para Combo
    let temDoce = false;
    let temSalgada = false;
    pedido.itens.forEach(item => {
        const nomeLower = item?.nome_item?.toLowerCase() || "";
        if (nomeLower.includes("chocolate") || nomeLower.includes("morango") || nomeLower.includes("banana")) {
            temDoce = true;
        } else if (nomeLower.includes("calabresa") || nomeLower.includes("frango") || nomeLower.includes("queijo") || nomeLower.includes("bacon")) {
            temSalgada = true;
        } else {
             if (!temDoce) temSalgada = true;
        }
    });

    if (temDoce && temSalgada) {
        return `Combo Misto com ${pedido.itens.length} pizzas`;
    } else if (temDoce) {
        return `Combo Doce com ${pedido.itens.length} pizzas`;
    } else {
        return `Combo Salgado com ${pedido.itens.length} pizzas`;
    }
};


function HistoricoPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [pedidoAberto, setPedidoAberto] = useState(null);
  const navigate = useNavigate();

  // Efeito para buscar os pedidos
  useEffect(() => {
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        navigate('/login');
        return;
    }
    const userId = JSON.parse(usuarioLogadoString).cliente_id;

    const buscarPedidos = async () => {
      try {
        const response = await fetch(`http://localhost:3002/api/pedidos/cliente/${userId}`);
        if (!response.ok) throw new Error('Erro ao buscar pedidos');
        const data = await response.json();
        setPedidos(data);
      } catch (err) {
        console.error(err);
        setErro('Não foi possível carregar os pedidos.');
      } finally {
        setCarregando(false);
      }
    };
    buscarPedidos();
  }, [navigate]);

  // Abrir/Fechar detalhes do pedido
  const toggleInfo = (id) => {
    setPedidoAberto(pedidoAberto === id ? null : id);
  };

  // Determina classe CSS do status
  const statusClasse = (status) => {
    if (!status) return '';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('entregue') || lowerStatus.includes('completed')) return 'status-entregue';
    if (lowerStatus.includes('cancelado') || lowerStatus.includes('erro')) return 'status-cancelado';
    return '';
  };

   // Lógica para adicionar itens de um pedido antigo ao carrinho
  const handlePedirNovamente = (pedidoParaRepetir) => {
    if (!pedidoParaRepetir || !pedidoParaRepetir.itens || pedidoParaRepetir.itens.length === 0) {
      alert("Não há itens neste pedido para adicionar ao carrinho.");
      return;
    }

    // Mapeia itens do histórico para formato simplificado
    const itensDoPedidoAntigo = pedidoParaRepetir.itens.map(item => ({
      id: `hist-${pedidoParaRepetir.pedido_id}-${item.item_id || Math.random()}`,
      nome: item.nome_item,
      preco: parseFloat(item.valor_unitario),
      origem: 'historico',
      quantidade: 1
    }));

    // Navega para o carrinho passando os itens (Carrinho.jsx precisa ser adaptado)
    navigate('/carrinho', { state: { carrinho: itensDoPedidoAntigo } });
  };


  return (
    <div className="pagina-historico-pedidos">
      <Header />
      <div className="container-historico-pedidos">
        <h1>Histórico de Pedidos</h1>

        <div className="botoes-navegacao-historico">
            <button className="btn-voltar-cardapio" onClick={() => navigate('/cardapio')}>
                Voltar ao Cardápio
            </button>
            <button className="btn-pedidos-andamento" onClick={() => navigate('/pedidosemandamento')}>
                Pedidos em Andamento
            </button>
        </div>

        {carregando && <p className="mensagem-info">Carregando histórico...</p>}
        {erro && <p className="mensagem-erro">{erro}</p>}
        {!carregando && pedidos.length === 0 && !erro && (
            <div className="sem-historico">
                <div className="sem-historico-icone">📜</div>
                <h2>Nenhum pedido encontrado</h2>
                <p>O seu histórico de compras aparecerá aqui.</p>
            </div>
        )}

        {/* Mapeia e renderiza cada card de pedido */}
        {pedidos.map(pedido => {
            const nomeDoPedido = gerarNomePedido(pedido);
            return (
                <div key={pedido.pedido_id} className="pedido-card">
                    <div className="pedido-card-header">
                        <h3>{nomeDoPedido} <span>- {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</span></h3>
                        <span className={`pedido-status ${statusClasse(pedido.status)}`}>{pedido.status || 'Status Desconhecido'}</span>
                    </div>
                    <div className="pedido-card-body">
                        <div className="pedido-info-resumo">
                             {pedido.itens && pedido.itens.length === 1 && ( <p>1 item neste pedido</p> )}
                             {pedido.itens && pedido.itens.length > 1 && ( <p>{pedido.itens.length} itens neste pedido</p> )}
                        </div>
                        <div className="pedido-acoes">
                            <strong className="pedido-valor">R$ {parseFloat(pedido.valor_total).toFixed(2)}</strong>
                            <button
                                className="btn-acao btn-pedir-novamente"
                                onClick={() => handlePedirNovamente(pedido)}
                            >
                                <IconeCarrinho /> Pedir Novamente
                            </button>
                            <button className="btn-acao btn-detalhes" onClick={() => toggleInfo(pedido.pedido_id)}><IconeInfo /> Detalhes</button>
                        </div>
                    </div>

                    {/* Detalhes expansíveis */}
                    <div className={`pedido-detalhes ${pedidoAberto === pedido.pedido_id ? "aberto" : ""}`}>
                        <h4>Itens do Pedido:</h4>
                        {pedido.itens && pedido.itens.length > 0 ? pedido.itens.map((item, idx) => (
                            <div key={item.item_id || idx} className="pedido-item-detalhe">
                                <span className="item-nome">{item.nome_item || 'Item sem nome'}</span>
                                <span className="item-preco">R$ {parseFloat(item.valor_unitario).toFixed(2)}</span>
                            </div>
                        )) : <p>Nenhum item detalhado encontrado.</p>}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}

export default HistoricoPedidos;

