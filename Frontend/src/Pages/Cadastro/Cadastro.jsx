import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importa o Link
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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        const numeroCartaoRegex = /^\d{16}$/;
        const telefoneRegex = /^\d{10,11}$/;
        const enderecoRegex = /^.{5,}$/;

        if (!emailRegex.test(form.email)) {
            setMensagem('Email inválido.');
            return;
        }
        if (!senhaRegex.test(form.senha)) {
            setMensagem('A senha deve ter pelo menos 8 caracteres, incluindo letras e números.');
            return;
        }
        // Os campos de cartão e CVV podem não ser obrigatórios no cadastro inicial
        // Deixei a validação comentada caso queira ativá-la
        // if (form.numero_cartao && !numeroCartaoRegex.test(form.numero_cartao)) {
        //     setMensagem('O número do cartão deve ter 16 dígitos.');
        //     return;
        // }
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
                setMensagem(data.error || mensagens || 'Erro ao cadastrar usuário.');
            } else {
                setMensagem(data.error || 'Erro ao cadastrar usuário.');
            }
        } catch (err) {
            setMensagem('Erro ao conectar com o servidor.');
            console.error('Erro de conexão:', err);
        }
    };

    return (
        <div className='pagina-cadastro'>
            <Header />
            <main className='container-cadastro'>
                <div className='form-container'> {/* Card do formulário */}
                    <h1 className='titulo-form'>Cadastro</h1>

                    <form className='form-auth' onSubmit={handleSubmit}>
                        <div className='form-group'>
                            <label htmlFor="nome">Nome:</label>
                            <input
                                type="text"
                                id="nome"
                                value={form.nome}
                                onChange={handleChange}
                                placeholder="Seu nome completo"
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label htmlFor="email">Email:</label>
                            <input
                                type="email"
                                id="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="seuemail@exemplo.com"
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label htmlFor="telefone">Telefone:</label>
                            <input
                                type="tel"
                                id="telefone"
                                value={form.telefone}
                                onChange={handleChange}
                                placeholder="99 99999-9999"
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label htmlFor="endereco">Endereço:</label>
                            <input
                                type="text"
                                id="endereco"
                                value={form.endereco}
                                onChange={handleChange}
                                placeholder="Rua 123"
                                required
                            />
                        </div>
                        
                        {/* Informações de Pagamento - Sugestão: podem ser opcionais no cadastro inicial 
                        <h2 className="subtitulo-form">Informações de Pagamento </h2>
                        <div className='form-group'>
                            <label htmlFor="numero_cartao">Número do Cartão:</label>
                            <input
                                type="text"
                                id="numero_cartao"
                                value={form.numero_cartao}
                                onChange={handleChange}
                                placeholder="Número do Cartão (16 dígitos)"
                            />
                        </div>

                        <div className='form-group-inline'> 
                            <div className='form-group'>
                                <label htmlFor="validade_cartao">Validade:</label>
                                <input
                                    type="text"
                                    id="validade_cartao"
                                    value={form.validade_cartao}
                                    onChange={handleChange}
                                    placeholder="MM/AA"
                                    maxLength="5" // MM/AA
                                />
                            </div>
                            <div className='form-group'>
                                <label htmlFor="cvv">CVV:</label>
                                <input
                                    type="text"
                                    id="cvv"
                                    value={form.cvv}
                                    onChange={handleChange}
                                    placeholder="CVV"
                                    maxLength="4"
                                />
                            </div>
                        </div>*/}

                        <div className='form-group'>
                            <label htmlFor="senha">Senha:</label>
                            <input
                                type="password"
                                id="senha"
                                value={form.senha}
                                onChange={handleChange}
                                placeholder="Mínimo 8 caracteres"
                                required
                            />
                        </div>
                        <button className='botao-form' type="submit">Cadastrar</button>
                    </form>

                    {mensagem && (
                        <p className={mensagem.includes('sucesso') ? 'mensagem-form-sucesso' : 'mensagem-form-erro'}>
                            {mensagem}
                        </p>
                    )}

                    {/* Link para a página de Login */}
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
