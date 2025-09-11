import React from 'react';
import './Home.css';
import { Link , NavLink} from 'react-router-dom';
import Header from '../../components/header/Header';
import Crie_Pizza from '../crie_sua_pizza/Crie_Pizza';
import Carrinho from '../carrinho/Carrinho';

function Home() {
  return (
    <div>
      <Header />
      <div className='container-home'>
        <div className='imagem-fundo-home'>
          <img src="imagem-fundo-home.png" alt="" />
        </div>

        {/**APENAS PARA FACILITAR NA SPRINT01 */}
        <div className='divide-telas'></div>
        <Crie_Pizza />
        <div className='divide-telas'></div>
        <Carrinho />
        
      </div>
    </div>
  )
}

export default Home