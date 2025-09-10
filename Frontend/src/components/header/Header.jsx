import React from 'react'
import "./Header .css";

function Header() {
  return (
     <div className="container-header">
      <div className="logo">
        <Link className="espaco-logo" to="/"><img className="#####" src="######" alt="" /></Link>
        <span className="logo-texto">Panteão pizzaria</span>
      </div>

      <div className="header-links">
        <Link className="texto" to="/home">Home</Link>
        <Link className="texto" to="/Cardapio">Cardapio</Link>
        <Link className="texto" to="/Contato">Contato</Link>
        <Link className="texto" to="/Login">Login</Link>
      </div>
    </div>
  )
}

export default Header