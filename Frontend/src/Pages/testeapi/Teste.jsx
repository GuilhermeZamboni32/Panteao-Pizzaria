import { useState } from 'react';
import './Teste.css';

function App() {
  // Estado para os campos do formulário
  const [orderId, setOrderId] = useState('ABC-123');
  const [sku, setSku] = useState('KIT-01');

  // Estado para armazenar a resposta da API
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    const payload = {
      payload: {
        orderId: orderId,
        sku: sku,
      },
      callbackUrl: 'http://localhost:3333/callback',
    };

    try {
      // Fazendo a requisição POST
      const res = await fetch('http://52.1.197.112:3000/queue/items', {
      // const res = await fetch('https://52.1.197.112:3000/queue/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Erro na requisição: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Fazendo a requisição GET
      // const res = await fetch('http://52.1.197.112:3000/queue/items');
      const res = await fetch('http://52.1.197.112:3000/queue/items?limit=99');

      if (!res.ok) {
        throw new Error(`Erro na requisição: ${res.status}`);
      }

      const data = await res.json();
      // O parse do array já é feito por res.json(), apenas o logamos.
      console.log('Resposta da API (GET):', data);
      setResponse(data); // Opcional: para exibir a resposta na UI
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Teste de Requisição POST</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="orderId">Order ID:</label>
          <input
            id="orderId"
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="sku">SKU:</label>
          <input
            id="sku"
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar POST'}
        </button>
      </form>

      <button onClick={handleGetRequest} disabled={loading} style={{ marginTop: '10px' }}>
        {loading ? 'Buscando...' : 'Fazer GET'}
      </button>

      {/* Exibe a resposta ou erro */}
      <div className="response-area">
        {loading && <p>Carregando...</p>}
        {error && <p className="error">Erro: {error}</p>}
        {response && (
          <div>
            <h2>Resposta da API:</h2>
            {console.log(response)}
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
