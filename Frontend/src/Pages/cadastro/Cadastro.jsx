import React, { useState } from 'react';
import './Cadastro.css';
import Header from '../../components/pastaheader/Header';

function Cadastro() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    endereco: '',
    numero_cartao: '',
    validade_cartao: '',
    cvv: ''
  });

  const [mensagem, setMensagem] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        setMensagem('Usuário cadastrado com sucesso!');
        setForm({
          nome: '',
          email: '',
          senha: '',
          telefone: '',
          endereco: '',
          numero_cartao: '',
          validade_cartao: '',
          cvv: ''
        });
      } else if (data.errors) {
        // Caso seja erro de validação do Zod
        const mensagens = data.errors.map(e => e.message).join(', ');
        setMensagem(mensagens);
      } else {
        setMensagem(data.error || 'Erro ao cadastrar usuário.');
      }
    } catch (err) {
      setMensagem('Erro ao conectar com o servidor.');
    }
  };

  return (
    <div className='pagina-cadastro'>
      <Header />
      <main className='container-cadastro'>
        <div className='coluna-imagem-cadastro'>
          <img
            className='imagem-cadastro'
            src="/imagens-de-fundo/pizza-doce-sem-fundo.png"
            alt="Pizza de chocolate com morangos"
          />
        </div>

        <div className='coluna-formulario-cadastro'>
          <div className='container-info-form-cadastro'>
            <h1 className='titulo-form-cadastro'>Cadastro</h1>

            <form className='form-cadastro' onSubmit={handleSubmit}>
              <div className='form-group-cadastro'>
                <label htmlFor="nome">Nome:</label>
                <input
                  type="text"
                  id="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Nome:"
                  required
                />
              </div>

              <div className='form-group-cadastro'>
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email:"
                  required
                />
              </div>

              <div className='form-group-cadastro'>
                <label htmlFor="telefone">Telefone:</label>
                <input
                  type="tel"
                  id="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  placeholder="Telefone:"
                  required
                />
              </div>

              <div className='form-group-cadastro'>
                <label htmlFor="endereco">Endereço:</label>
                <input
                  type="text"
                  id="endereco"
                  value={form.endereco}
                  onChange={handleChange}
                  placeholder="Endereço:"
                  required
                />
              </div>

              <div className='form-group-cadastro'>
                <label htmlFor="numero_cartao">Número do Cartão:</label>
                <input
                  type="text"
                  id="numero_cartao"
                  value={form.numero_cartao}
                  onChange={handleChange}
                  placeholder="Número do Cartão:"
                  required
                />
              </div>

              <div className='form-group-cadastro'>
                <label htmlFor="validade_cartao">Validade do Cartão:</label>
                <input
                  type="text"
                  id="validade_cartao"
                  value={form.validade_cartao}
                  onChange={handleChange}
                  placeholder="MM/YY"
                  required
                />
              </div>

              <div className='form-group-cadastro'>
                <label htmlFor="cvv">CVV:</label>
                <input
                  type="text"
                  id="cvv"
                  value={form.cvv}
                  onChange={handleChange}
                  placeholder="CVV:"
                  required
                />
              </div>

              <div className='form-group-cadastro'>
                <label htmlFor="senha">Senha:</label>
                <input
                  type="password"
                  id="senha"
                  value={form.senha}
                  onChange={handleChange}
                  placeholder="Senha:"
                  required
                />
              </div>

              <button className='botao-form-cadastro' type="submit">Cadastrar</button>
            </form>

            {mensagem && (
              <p style={{ marginTop: '1rem', color: mensagem.includes('sucesso') ? 'green' : 'red' }}>
                {mensagem}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Cadastro;
