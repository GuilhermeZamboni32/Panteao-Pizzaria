import React from 'react';
import './login.css'; // Importa o novo CSS
import Header from '../../components/pastaheader/Header';

function Login() {
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

            <form className='form-login'>
              <div className='form-group-login'>
                <label htmlFor="nome">Nome:</label>
                <input type="text" id="nome" placeholder="Nome:" />
              </div>

              <div className='form-group-login'>
                <label htmlFor="senha">Senha:</label>
                <input type="password" id="senha" placeholder="Senha:" />
              </div>

              <button className='botao-form-login' type="submit">Logar</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;