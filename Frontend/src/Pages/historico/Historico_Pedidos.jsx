import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Header from "../../components/pastaheader/Header";
import './Historico_Pedidos.css';

// --- Ícones em SVG ---
const IconeCarrinho = () => (
  <img src="./icons/brancos/carrinho-compras-branco.png" className="carrinho-historico" alt="" />
);

const IconeInfo = () => (
  <img src="./icons/brancos/lupa-branco.png" className="info-historico" alt="" />
);

function HistoricoPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [pedidoAberto, setPedidoAberto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const usuarioLogadoString = localStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) return navigate('/login');

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

  const toggleInfo = (id) => {
    setPedidoAberto(pedidoAberto === id ? null : id);
  };

  const statusClasse = (status) => {
    switch (status.toLowerCase()) {
      case 'entregue': return 'status-entregue';
      case 'cancelado': return 'status-cancelado';
      default: return '';
    }
  };

  return (
    <div className="pagina-historico-pedidos">
      <Header />
      <div className="container-historico-pedidos">
        <h1>Histórico de Pedidos</h1>
        
        <button className="btn-voltar-cardapio" onClick={() => navigate('/cardapio')}>
          Voltar ao Cardápio
        </button>

         <button className="btn-pedidos-andamento" onClick={() => navigate('/pedidosemandamento')}>
          Pedidos em Andamento
        </button>

       

        {carregando && <p className="mensagem-info">Carregando...</p>}
        {erro && <p className="mensagem-erro">{erro}</p>}
        {!carregando && pedidos.length === 0 && !erro && <p className="mensagem-info">Nenhum pedido encontrado.</p>}
        
        {pedidos.map(pedido => (
          <div key={pedido.pedido_id} className="pedido-card">
            <div className="pedido-card-header">
              <h3>Pedido #{pedido.pedido_id} <span>- {new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</span></h3>
              <span className={`pedido-status ${statusClasse(pedido.status)}`}>{pedido.status}</span>
            </div>
            <div className="pedido-card-body">
              <div className="pedido-info-resumo">
                <p><strong>{pedido.itens.length} item(ns)</strong> neste pedido</p>
              </div>
              <div className="pedido-acoes">
                <strong className="pedido-valor">R$ {parseFloat(pedido.valor_total).toFixed(2)}</strong>
                <button className="btn-acao btn-pedir-novamente"><IconeCarrinho /> Pedir Novamente</button>
                <button className="btn-acao btn-detalhes" onClick={() => toggleInfo(pedido.pedido_id)}><IconeInfo /> Detalhes</button>
              </div>
            </div>
            <div className={`pedido-detalhes ${pedidoAberto === pedido.pedido_id ? "aberto" : ""}`}>
              {pedido.itens.map((item, idx) => (
                <div key={idx} className="pedido-item">
                  <div className="pedido-item-info">
                    <h4>{item.nome}</h4>
                    <ul>{item.ingredientes.map((ing, i) => <li key={i}>{ing.nome}</li>)}</ul>
                  </div>
                  <span className="pedido-item-preco">R$ {parseFloat(item.preco).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoricoPedidos;