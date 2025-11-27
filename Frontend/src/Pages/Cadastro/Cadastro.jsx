import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/pastaheader/Header';
import './Cadastro.css';
import { FiEye, FiEyeOff } from 'react-icons/fi';

function Cadastro() {
    // Estado simplificado
    const [form, setForm] = useState({
        nome: '',
        email: '',
        senha: '',
        telefone: ''
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
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        const telefoneRegex = /^\d{10,11}$/;

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
        if (!senhaRegex.test(form.senha)) {
            setMensagem('A senha deve ter pelo menos 8 caracteres, letras e números.');
            return;
        }

        //  LÓGICA DE FUNCIONÁRIO 
        // Verifica se o email termina com o domínio de funcionário
        const isFuncionario = form.email.endsWith('@funcionariopanteao.com');

        // Prepara os dados adicionando a flag 'isAdmin' 
        const dadosParaEnviar = {
            ...form,
            isAdmin: isFuncionario // true se for funcionário, false se não for
        };

        try {
            const response = await fetch('http://localhost:3001/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosParaEnviar) // Envia o objeto modificado
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
        <div className='pagina-cadastro'>
            <Header />
            <main className='container-cadastro'>
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

                    {mensagem && (
                        <p className={mensagem.includes('sucesso') ? 'mensagem-form-sucesso' : 'mensagem-form-erro'}>
                            {mensagem}
                        </p>
                    )}

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