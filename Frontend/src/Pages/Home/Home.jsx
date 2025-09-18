import React from 'react';
import './Home.css';
import { Link , NavLink} from 'react-router-dom';
import Header from '../../components/pastaheader/Header';
import Crie_Pizza from '../crie_sua_pizza/Crie_Pizza';
import Teste from '../testeapi/Teste';


function Home() {
  return (
    <div>
      <Header />
      <div className='container-home'>
        <div className='imagem-fundo-home'>
           {/**<img src="imagem-fundo-home.png" alt="" />*/}
        </div>

        <Teste />
        
      </div>
    </div>
  )
}

export default Home