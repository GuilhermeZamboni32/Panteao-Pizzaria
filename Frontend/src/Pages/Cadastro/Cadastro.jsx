import React from 'react'
import './Cadastro.css' 
import Header from '../../components/pastaheader/Header';

function Cadastro() {
  return (
    <div className='pagina-cadastro'>
      <Header />
      <main className='container-cadastro'>
        <div className='coluna-imagem-cadastro'>
          <img
            className='imagem-cadastro'
            src="/imagens-de-fundo/pizza-doce-sem-fundo.png" 
            alt="Pizza de chocolate com morangos"
          />
        </div>

        <div className='coluna-formulario-cadastro'>
          <div className='container-info-form-cadastro'>
            <h1 className='titulo-form-cadastro'>Cadastro</h1>
            
            <form className='form-cadastro'>
              <div className='form-group-cadastro'>
                <label htmlFor="nome">Nome:</label>
                <input type="text" id="nome" placeholder="Nome:" />
              </div>

              <div className='form-group-cadastro'>
                <label htmlFor="telefone">Telefone:</label>
                <input type="tel" id="telefone" placeholder="Telefone:" />
              </div>

              <div className='form-group-cadastro'>
                <label htmlFor="endereco">Endereço:</label>
                <input type="text" id="endereco" placeholder="Endereço:" />
              </div>
              
              <div className='form-group-cadastro'>
                <label htmlFor="senha">Senha:</label>
                <input type="password" id="senha" placeholder="Senha:" />
              </div>
              
              <button className='botao-form-cadastro' type="submit">Cadastrar</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Cadastro;