import React from 'react'
import './Carrinho.css';


function Carrinho() {
    const [cartItems, setCartItems] = useState([
        {
          id: 1,
          name: 'Pizza de Azeitona Preta',
          price: 45.00,
          quantity: 1,
          image: 'pizza-azeitona.jpg', // Substitua com o caminho real da imagem
        },
        {
          id: 2,
          name: 'Pizza de Calabresa',
          price: 45.00,
          quantity: 1,
          image: 'pizza-calabresa.jpg', // Substitua com o caminho real da imagem
        },
        {
          id: 3,
          name: 'Pizza de Couve Flor',
          price: 45.00,
          quantity: 1,
          image: 'pizza-couve-flor.jpg', // Substitua com o caminho real da imagem
        },
      ]);
    
      const deliveryFee = 12.00;
    
      const handleQuantityChange = (id, delta) => {
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
          )
        );
      };
    
      const handleRemoveItem = (id) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
      };
    
      const handleAlterItem = (id) => {
        alert(`Funcionalidade "Alterar" para o item ${id} seria implementada aqui.`);
        // Em uma aplicação real, isso poderia abrir um modal para customização, etc.
      };
    
      const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
      };
    
      const totalToPay = calculateSubtotal() + deliveryFee;

  return (
   <>
    <div className="App">
      <header className="header">
        <div className="logo">
        <div className="logo"><img className='logo-img' src="/Logo-Preto_1.png" alt="" /></div>
          <h1>PANTÃO</h1>
        </div>
        <nav className="navigation">
          <a href="#inicio">Início</a>
          <a href="#cardapio">Cardápio</a>
          <a href="#promocoes">Promoções</a>
          <a href="#login">Login</a>
        </nav>
      </header>

      <main className="main-content">
        <div className="cart-items-section">
          {cartItems.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={item.image} alt={item.name} className="item-image" />
              <div className="item-details">
                <h3>{item.name}</h3>
                <div className="item-actions">
                  <button className="exclude-btn" onClick={() => handleRemoveItem(item.id)}>
                    Excluir
                  </button>
                  <button className="alter-btn" onClick={() => handleAlterItem(item.id)}>
                    Alterar
                  </button>
                </div>
              </div>
              <div className="item-quantity-control">
                <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
              </div>
              <div className="item-price">R${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="purchase-summary-section">
          <h2>Resumo da Compra</h2>
          <div className="summary-row">
            <span>Produto</span>
            <span>R${calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Frete</span>
            <span>R${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <h3>Total a Pagar</h3>
            <h3>R${totalToPay.toFixed(2)}</h3>
          </div>
          <button className="buy-button">Comprar</button>
        </div>
      </main>
    </div>
   </>
  )
}

export default Carrinho;