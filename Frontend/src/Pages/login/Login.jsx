import React from 'react'
import './Login.css'
import Header from '../../components/header/Header';

function Login() {
  return (
     <div className='pagina-login'>
      <Header />
      <div className='container-login'>
          <div className='coluna-login-esquerda'>
           {/* <img className='IMAGEM_TESTE' src="imagens-de-fundo/IMAGEM-TESTE.png" alt="" />*/}
          aaaaaaaaaaaaaaa
          
          </div>

          <div className='coluna-login-direita'>
            <div className='container-info-login'>
              <div className='container-titulo-login'>
                <h1 className='titulo-login'>Login</h1>
              </div>

              <div className='container-label-login'>
              <label className='label-login' htmlFor="">Nome:</label>
              <label className='label-login' htmlFor="">senha:</label>
              </div>

              <div className='container-botton-login'>
              <button className='botton-login'>Logar</button>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}

export default Login