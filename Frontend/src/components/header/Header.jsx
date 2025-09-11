import React from 'react'
import "./Header.css";
import { Link } from 'react-router-dom';

function Header (){
  return (
     <div className="container-header">
      <div className="logo">
        <Link className="espaco-logo" to="/">
        <img className="Logo-preto" src="Logo-preto.png" alt="" />
        </Link>
        <span className="texto-logo">Panteão pizzaria</span>
      </div>

      <div className="header-links">
        <Link className="texto-header" to="/">Home</Link>
        <Link className="texto-header" to="/Cardapio">Cardapio</Link>
        <Link className="texto-header" to="/Contato">Contato</Link>
        <Link className="texto-header" to="/Login">Login</Link>
      </div>
    </div>
  )
}

export default Header