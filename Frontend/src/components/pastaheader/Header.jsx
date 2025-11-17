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

    return (
        <div className="container-header">
            <div className="logo">
                <Link className="espaco-logo" to="/">
                    <img className="Logo-Preto-P" src="/logos/Logo-preto-sem-nome.png" alt="" />
                </Link>
                <span className="texto-logo">Panteão pizzaria</span>
            </div>

            <div className="header-links">
                {/* Links de Navegação */}
                <Link className="texto-header" to="/">Home</Link>
                <Link className="texto-header" to="/Cardapio">Cardapio</Link>
                <Link className="texto-header" to="/contato">Contato</Link>
                <Link className="texto-header" to="/Crie_pizza">Crie a sua pizza</Link>
                <Link className="texto-header" to="/gestao_estoque">Gestão de Estoque</Link>

                {/* === INÍCIO DA MUDANÇA === */}
                {/* Agrupamos a lógica de utilizador nesta div */}
                <div className="header-user-actions">
                    {usuarioLogado ? (
                        // ---- Se estiver LOGADO ----
                        <>
                            <Link className="header-icon-link" to="/minhaconta" title="Minha Conta">
                                <img src="/icons/user.png" alt="Minha Conta" className="header-icon" />
                            </Link>
                            
                            <button className="header-icon-link" onClick={handleLogout} title="Sair">
                                <img src="/icons/sair.png" alt="Sair" className="header-icon" />
                            </button>
                        </>
                    ) : (
                        // ---- Se estiver DESLOGADO ----
                        <>
                            <Link className="texto-header" to="/Login">Login</Link>
                            <Link className="texto-header" to="/cadastro">Cadastro</Link>
                        </>
                    )}
                </div>
                {/* === FIM DA MUDANÇA === */}
            </div>
        </div>
    );
}

export default Header;