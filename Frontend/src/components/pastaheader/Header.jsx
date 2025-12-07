import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./Header.css";

function Header() {
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const usuarioStorage = localStorage.getItem('usuarioLogado');
        if (usuarioStorage) {
            setUsuarioLogado(JSON.parse(usuarioStorage));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('usuarioLogado');
        setUsuarioLogado(null);
        navigate('/'); 
    };

     const handleCardapioClick = () => {
        if (!usuarioLogado) {
            navigate('/login');  // redireciona para login se não estiver logado
        } else {
            navigate('/cardapio'); // usuário logado → vai pro cardápio
        }
    };

    return (
        <div className="container-header">
            <div className="logo">
                <Link className="espaco-logo" to="/">
                    <img className="Logo-Preto-P" src="/logos/Logo-preto-sem-nome.png" alt="Logo Panteão Pizzaria" />
                </Link>
                <span className="texto-logo">Panteão pizzaria</span>
            </div>

            <div className="header-links">
                <Link className="texto-header" to="/">Home</Link>

                <Link
                    className="texto-header"
                    to={usuarioLogado ? "/cardapio" : "/login"}
                    onClick={(e) => {
                        if (!usuarioLogado) {
                            e.preventDefault();
                            navigate('/login');
                        }
                    }}>
                    Cardápio
                </Link>

                <Link className="texto-header" to="/contato">Contato</Link>
                
                {usuarioLogado && (
                    <Link className="texto-header" to="/Crie_pizza">Crie a sua pizza</Link>
                )}

                {/* Link EXCLUSIVO para ADMINISTRADORES/FUNCIONÁRIOS */}
                {/* Verifica se está logado E se isAdmin é verdadeiro */}
                {usuarioLogado && usuarioLogado.isAdmin === true && (
                    <Link className="texto-header" to="/gestao_estoque">Gestão de Estoque</Link>,
                    <Link className="texto-header" to="/funcionario">funcionario</Link>
                )}

                <div className="header-user-actions">
                    
                    {/* Ícone de Perfil */}
                    <Link 
                        className="header-icon-link" 
                        to={usuarioLogado ? "/minhaconta" : "/Login"} 
                        title={usuarioLogado ? "Minha Conta" : "Fazer Login"}
                    >
                        <img src="/icons/user.png" alt="Perfil" className="header-icon" />
                    </Link>

                    {/* Botão de Logout */}
                    {usuarioLogado && (
                        <button className="header-icon-link" onClick={handleLogout} title="Sair">
                            <img src="/icons/sair.png" alt="Sair" className="header-icon" />
                        </button>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Header;