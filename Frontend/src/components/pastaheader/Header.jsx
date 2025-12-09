import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./Header.css";

function Header() {
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const usuarioStorage = localStorage.getItem('usuarioLogado');
        if (usuarioStorage) {
            setUsuarioLogado(JSON.parse(usuarioStorage));
        }
    }, []);

    useEffect(() => {
        function handleOutsideClick(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('usuarioLogado');
        setUsuarioLogado(null);
        setIsDropdownOpen(false);
        navigate('/');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

    const handleNavigate = (path, state = undefined) => {
        setIsDropdownOpen(false);
        if (state) navigate(path, { state });
        else navigate(path);
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

                <Link className="texto-header" to="/cardapio">Cardápio</Link>

                <Link className="texto-header" to="/contato">Contato</Link>
                
                {usuarioLogado && (
                    <Link className="texto-header" to="/Crie_pizza">Crie a sua pizza</Link>
                )}

                {usuarioLogado && usuarioLogado.isAdmin === true && (
                    <>
                        <Link key="gestao" className="texto-header" to="/gestao_estoque">Gestão de Estoque</Link>
                        <Link key="func" className="texto-header" to="/funcionario">Funcionario</Link>
                    </>
                )}

                <div className="header-user-actions" ref={dropdownRef}>
                    <button
                        className="profile-button header-icon-link"
                        onClick={toggleDropdown}
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen}
                        title={usuarioLogado ? "Minha Conta" : "Fazer Login"}
                    >
                        <img src="/icons/user.png" alt="Perfil" className="header-icon" />
                    </button>

                    <div className={`header-dropdown ${isDropdownOpen ? 'open' : ''}`} role="menu" aria-hidden={!isDropdownOpen}>
                        {!usuarioLogado ? (
                            <ul>
                                <li>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => handleNavigate('/login', { redirectTo: '/cardapio' })}
                                    >
                                        Entrar
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" onClick={() => handleNavigate('/cadastro')}>
                                        Cadastrar
                                    </button>
                                </li>
                            </ul>
                        ) : (
                            <ul>
                                <li>
                                    <button className="dropdown-item" onClick={() => handleNavigate('/minhaconta')}>
                                        Minha Conta
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" onClick={handleLogout}>
                                        Sair
                                    </button>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Header;