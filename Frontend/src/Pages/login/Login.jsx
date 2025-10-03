import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import Header from '../../components/pastaheader/Header';

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [mensagem, setMensagem] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensagem('');

        if (!email || !senha) {
            setMensagem('Por favor, preencha o email e a senha.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });

            const data = await response.json();

            if (response.ok) {
                // SUCESSO NO LOGIN
                // 1. Salva os dados do usuário no localStorage para usar em outras partes do site
                localStorage.setItem('usuarioLogado', JSON.stringify(data));
                
                // 2. Redireciona o usuário para a página de cardápio
                navigate('/cardapio');
            } else {
                // ERRO DE LOGIN
                setMensagem(data.error || 'Falha no login. Verifique suas credenciais.');
            }
        } catch (err) {
            console.error('Erro de conexão:', err);
            setMensagem('Erro ao conectar com o servidor. Tente novamente mais tarde.');
        }
    };

    return (
        <div className='pagina-login'>
            <Header />
            <main className='container-login'>
                <div className='coluna-imagem-login'>
                    <img
                        className='imagem-login'
                        src="/imagens-de-fundo/pizza-doce-sem-fundo.png" 
                        alt="Pizza de chocolate com morangos"
                    />
                </div>
                <div className='coluna-formulario-login'>
                    <div className='container-info-form-login'>
                        <h1 className='titulo-form-login'>Login</h1>
                        <form className='form-login' onSubmit={handleSubmit}>
                            <div className='form-group-login'>
                                <label htmlFor="email">Email:</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    placeholder="seuemail@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='form-group-login'>
                                <label htmlFor="senha">Senha:</label>
                                <input 
                                    type="password" 
                                    id="senha" 
                                    placeholder="Senha:"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    required
                                />
                            </div>
                            <button className='botao-form-login' type="submit">Logar</button>
                        </form>
                        {mensagem && (
                            <p style={{ marginTop: '1rem', color: 'red', textAlign: 'center' }}>
                                {mensagem}
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Login;
