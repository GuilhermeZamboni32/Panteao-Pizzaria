import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importa o Link
import './Login.css';
import Header from '../../components/pastaheader/Header';
import { FiEye, FiEyeOff } from 'react-icons/fi';

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                localStorage.setItem('usuarioLogado', JSON.stringify(data));
                navigate('/cardapio'); // Redireciona para o cardápio
            } else {
                setMensagem(data.error || 'Falha no login. Verifique suas credenciais.');
            }
        } catch (err) {
            console.error('Erro de conexão:', err);
            setMensagem('Erro ao conectar com o servidor. Tente novamente.');
        }
    };

    return (
        // A 'pagina-login' agora tem a imagem de fundo
        <div className='pagina-login'>
            <Header />
            {/* O 'container-login' agora tem o gradiente e alinha o form à direita */}
            <main className='container-login'>
                {/* O 'form-container' é o card bege que segura o formulário */}
                <div className='form-container'>
                    <h1 className='titulo-form'>Login</h1>
                    <form className='form-auth' onSubmit={handleSubmit}>
                        <div className='form-group'>
                            <label htmlFor="email">Email:</label>
                            <input 
                                type="email" 
                                id="email" 
                                placeholder="Seu email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                         <div className='form-group form-group-password'>
                            <label htmlFor="senha">Senha:</label>
                            <input 
                                // Muda o tipo baseado no estado 'showPassword'
                                type={showPassword ? "text" : "password"} 
                                id="senha" 
                                placeholder="Sua senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                required
                            />
                            {/* Ícone que muda ao clicar */}
                            <span 
                                className="password-toggle-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </span>
                        </div>
                        <button className='botao-form' type="submit">Entrar</button>
                    </form>
                    
                    {mensagem && (
                        <p className="mensagem-form-erro">
                            {mensagem}
                        </p>
                    )}

                    {/* Link para a página de Cadastro */}
                    <p className="auth-link">
                        Não tem uma conta?{' '}
                        <Link to="/cadastro">Cadastre-se</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}

export default Login;
