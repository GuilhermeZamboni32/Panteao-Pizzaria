import React, { useState } from "react";
import "./Historico_Pedidos.css"; 
import { useNavigate } from 'react-router-dom';
import Header from '../../components/pastaheader/Header';

// --- Ícones em SVG ---
const IconeCarrinho = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
  </svg>
);

const IconeInfo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.055.492.342.38.619l-.975 2.228.988.426.975-2.228c.11-.252.01-.548-.28-.619l-.45-.083.082-.38 2.29-.287zM8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-13.588.01-.002.002-.002.002-.002.003-.002.003-.002.003-.002.003-.002.004-.001.004-.001c.092-.026.195-.042.308-.042s.216.016.308.042l.004.001.004.001.003.002.003.002.003.002.003.002.002.002.002.002.001.002H9.93zm-.835 5.034a.25.25 0 0 1 .248-.215l.248.062.082.38-1.158.29a.25.25 0 0 1-.316-.316l1.158-.29zm.25-3.322a.25.25 0 0 1 .248-.215l.248.062.082.38-1.158.29a.25.25 0 0 1-.316-.316l1.158-.29z"/>
  </svg>
);

function HistoricoPedidos() {
  const [pedidoAberto, setPedidoAberto] = useState(null);
   const navigate = useNavigate();

  const pedidos = [
    { id: 1, data: "01/10/2025", valor: 70.0, status: "Entregue", itens: [
        { nome: "Pizza Média salgada", preco: 40.0, ingredientes: ["Queijo", "Presunto", "Milho", "Cebola", "Orégano"] },
        { nome: "Pizza Broto doce", preco: 30.0, ingredientes: ["Chocolate branco", "Morango", "Coco ralado"] }
      ]},
    { id: 2, data: "24/05/2025", valor: 50.0, status: "Entregue", itens: [
        { nome: "Pizza Média salgada", preco: 25.0, ingredientes: ["Queijo", "Calabresa", "Orégano"] },
        { nome: "Pizza Média salgada", preco: 25.0, ingredientes: ["Queijo", "Frango", "Catupiry"] }
      ]},
    { id: 3, data: "14/05/2025", valor: 60.0, status: "Cancelado", itens: [
        { nome: "Pizza Grande salgada", preco: 60.0, ingredientes: ["Queijo", "Bacon", "Milho", "Orégano"] }
      ]},
  ];

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

        {pedidos.map((pedido) => (
          <div key={pedido.id} className="pedido-card">
            <div className="pedido-card-header">
              <h3>Pedido #{pedido.id} <span>- {pedido.data}</span></h3>
              <span className={`pedido-status ${statusClasse(pedido.status)}`}>
                {pedido.status}
              </span>
            </div>
            
            <div className="pedido-card-body">
              <div className="pedido-info-resumo">
                <p><strong>{pedido.itens.length} item(ns)</strong> neste pedido</p>
                <strong className="pedido-valor">R$ {pedido.valor.toFixed(2)}</strong>
              </div>
              
              <div className="pedido-acoes">
                <button className="btn-acao btn-pedir-novamente">
                  <IconeCarrinho /> Pedir Novamente
                </button>
                <button
                  className="btn-acao btn-detalhes"
                  onClick={() => toggleInfo(pedido.id)}
                >
                  <IconeInfo /> Detalhes
                </button>
              </div>
            </div>

            <div className={`pedido-detalhes ${pedidoAberto === pedido.id ? "aberto" : ""}`}>
              {pedido.itens.map((item, idx) => (
                <div key={idx} className="pedido-item">
                  <div className="pedido-item-info">
                    <h4>{item.nome}</h4>
                    <ul>
                      {item.ingredientes.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>
                  </div>
                  <span className="pedido-item-preco">R$ {item.preco.toFixed(2)}</span>
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
