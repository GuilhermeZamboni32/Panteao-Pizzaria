import React from 'react';
import Header from '../../components/pastaheader/Header'; 
import './Home.css'; 

// --- IMPORTANTE: Substitua os caminhos pelas suas imagens ---
const imagemFundoHero = '/imagens-de-fundo/pizza-salgada-fundo.png';
const imagemDoLocal = '/imagens-de-fundo/local-fundo.jfif'; 

function Home() {
    return (
        <div className="pagina-home">
            <Header />

            <main className="home-container">
                {/* =========== SEÇÃO HERO =========== */}
                <section 
                    className="hero-section" 
                    style={{ backgroundImage: `url(${imagemFundoHero})` }}
                >
                    <div className="hero-overlay"></div>
                    <div className="hero-content">
                        <h1 className="hero-titulo">Pantano Pizzaria</h1>
                        <p className="hero-subtitulo">
                            Inspirada nas mais tradicionais Pizzarias Paulistanas, a Pantano é a escolha certa 
                            para quem busca uma pizza com massa de longa fermentação, borda crocante e, claro, 
                            muito sabor.
                        </p>
                        <button className="hero-botao">PEDIR ONLINE</button>
                    </div>
                </section>

                {/* =========== SEÇÃO INFORMAÇÕES DA LOJA =========== */}
                <section className="secao-loja">
                    <div className="secao-loja-container">
                        <div className="texto-intro">
                            <h2 className="secao-titulo-maior">Conheça nossas casas</h2>
                            <p>Estamos com nossas unidades abertas diariamente, nos bairros Centro e Santa Mônica.</p>
                            <p>Das 18:00 às 23:30.</p>
                        </div>

                        <div className="card-unidade">
                            <div className="card-unidade-imagem">
                                <img src={imagemDoLocal} alt="Interior da Pantano Pizzaria" />
                            </div>
                            <div className="card-unidade-info">
                                <h3 className="unidade-nome">Pantano Pizzaria - Centro</h3>
                                <ul className="unidade-contatos">
                                    <li>
                                        <i className="icone-local"></i> {/* Substitua <i> por <img> se preferir */}
                                        <span>Rua Esteves Júnior, 604, Centro, Florianópolis, SC</span>
                                    </li>
                                    <li>
                                        <i className="icone-whatsapp"></i>
                                        <span>(48) 99120-2209</span>
                                    </li>
                                    <li>
                                        <i className="icone-telefone"></i>
                                        <span>(48) 3333-0707</span>
                                    </li>
                                     <li>
                                        <i className="icone-email"></i>
                                        <span>contato@pantanopizzaria.com.br</span>
                                    </li>
                                </ul>
                                <div className="unidade-botoes">
                                    <a href="#mapa" className="link-mapa">Ver como chegar</a>
                                    <button className="botao-reserva">Reservas</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* =========== OUTRAS SEÇÕES (Exemplo) =========== */}
                <section className="secao-outras-coisas">
                    {/* Aqui você pode adicionar mais conteúdo, como a seção "Nonnonapo" da referência */}
                    <h2>Nossas Especialidades</h2>
                    <p>Descubra mais sobre nossos sabores únicos.</p>
                </section>
            </main>
        </div>
    );
}

export default Home;