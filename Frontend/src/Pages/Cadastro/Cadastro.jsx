import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/pastaheader/Header';
import './Cadastro.css';
import { FiEye, FiEyeOff } from 'react-icons/fi';

function Cadastro() {
    // Estado simplificado, sem dados de pagamento
    const [form, setForm] = useState({
        nome: '',
        email: '',
        senha: '',
        telefone: '',
        endereco: ''
    });
    const [mensagem, setMensagem] = useState('');
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensagem('');
        
        // Regex de validação (sem cartão)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        const telefoneRegex = /^\d{10,11}$/;
        const enderecoRegex = /^.{5,}$/;

        // Validação (sem cartão)
        if (!form.nome || form.nome.length < 3) {
            setMensagem('Nome inválido (mínimo 3 caracteres).');
            return;
        }
        if (!emailRegex.test(form.email)) {
            setMensagem('Email inválido.');
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
        if (!senhaRegex.test(form.senha)) {
            setMensagem('A senha deve ter pelo menos 8 caracteres, letras e números.');
            return;
        }

        try {
            // Envia o formulário simplificado para o backend
            const response = await fetch('http://localhost:3001/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form) // Envia apenas nome, email, senha, tel, endereco
            });

            const data = await response.json();

            if (response.ok) {
                setMensagem('Usuário cadastrado com sucesso! Redirecionando para o login...');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                setMensagem(data.error || 'Erro ao cadastrar usuário.');
            }
        } catch (err) {
            console.error('Erro de conexão:', err);
            setMensagem('Erro ao conectar com o servidor.');
        }
    };

    return (
        // Layout de fundo de ecrã inteiro
        <div className='pagina-cadastro'>
            <Header />
            {/* Container com gradiente */}
            <main className='container-cadastro'>
                {/* Card do formulário */}
                <div className='form-container'>
                    <h1 className='titulo-form'>Cadastro</h1>

                    <form className='form-auth' onSubmit={handleSubmit}>
                        <div className='form-group'>
                            <label htmlFor="nome">Nome:</label>
                            <input type="text" id="nome" value={form.nome} onChange={handleChange} placeholder="Nome completo" required />
                        </div>
                        <div className='form-group'>
                            <label htmlFor="email">Email:</label>
                            <input type="email" id="email" value={form.email} onChange={handleChange} placeholder="Seu email" required />
                        </div>
                        <div className='form-group'>
                            <label htmlFor="telefone">Telefone:</label>
                            <input type="tel" id="telefone" value={form.telefone} onChange={handleChange} placeholder="Telefone (só números)" required />
                        </div>
                        <div className='form-group'>
                            <label htmlFor="endereco">Endereço:</label>
                            <input type="text" id="endereco" value={form.endereco} onChange={handleChange} placeholder="Rua, Número, Bairro" required />
                        </div>
                        <div className='form-group senha-group'>
                          <label htmlFor="senha">Senha:</label>
                          
                          <div className="input-com-icone">
                            <input 
                              type={showPassword ? "text" : "password"} 
                              id="senha" 
                              placeholder="Sua senha"
                              value={form.senha}
                              onChange={handleChange}
                              required
                            />
                                <span 
                                  className="password-toggle-icon"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <FiEyeOff /> : <FiEye />}
                                </span>
                          </div>
                        </div>
                        
                        <button className='botao-form' type="submit">Cadastrar</button>
                    </form>

                    {/* Mensagem de status */}
                    {mensagem && (
                        <p className={mensagem.includes('sucesso') ? 'mensagem-form-sucesso' : 'mensagem-form-erro'}>
                            {mensagem}
                        </p>
                    )}

                    {/* Link para Login */}
                    <p className="auth-link">
                        Já tem uma conta?{' '}
                        <Link to="/login">Faça Login</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}

export default Cadastro;

