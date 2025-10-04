import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/pastaheader/Header';
import './Cadastro.css';

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

 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    
    // Validação dos campos
    if (!emailRegex.test(form.email)) {
      setMensagem('Email inválido.');
      return;
    }
    if (!senhaRegex.test(form.senha)) {
      setMensagem('A senha deve ter pelo menos 8 caracteres, incluindo letras e números.');
      return;
    }
    if (!numeroCartaoRegex.test(form.numero_cartao)) {
      setMensagem('O número do cartão deve ter 16 dígitos.');
      return;
    }
    if (!telefoneRegex.test(form.telefone)) {
      setMensagem('O telefone deve ter 10 ou 11 dígitos.');
      return;
    }
    if (!enderecoRegex.test(form.endereco)) {
      setMensagem('O endereço deve ter pelo menos 5 caracteres.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        setMensagem('Usuário cadastrado com sucesso! Redirecionando...');
        
       
        setTimeout(() => {
            navigate('/login');
        }, 1500); // 1.5 segundos
        
      } else if (data.errors) {
        const mensagens = data.errors.map(e => e.message).join(', ');
        setMensagem(mensagens);
      } else {
        setMensagem(data.error || 'Erro ao cadastrar usuário.');
      }
    } catch (err) {
      setMensagem('Erro ao conectar com o servidor.');
    }
  };

  //regex para validar email, senha e numero do cartao
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  const numeroCartaoRegex = /^\d{16}$/;
  const telefoneRegex = /^\d{10,11}$/;
  const enderecoRegex = /^.{5,}$/;

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
              {/* Seus inputs aqui... */}
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
              <button className='botao-form-cadastro' type="submit" >Cadastrar</button>
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
