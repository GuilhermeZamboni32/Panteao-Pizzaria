import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Header from '../../components/pastaheader/Header'; 
import './Home.css'; 

function Home() {
// --- IMPORTANTE: Substitua os caminhos pelas suas imagens ---
const imagemFundoHero = '/imagens-de-fundo/pizza-salgada-fundo.png';
const imagemDoLocal = '/imagens-de-fundo/local-fundo-3.png'; 

 const location = useLocation();
    const navigate = useNavigate();

// --- INFORMAÇÕES DO RESTAURANTE ---
const infoRestaurante = {
    nome: "Panteão Pizzaria",
    endereco: "Rod. José Carlos Daux, 5500 - Saco Grande, Florianópolis - SC, 88032-005",
    linkGoogleMaps: "https://maps.app.goo.gl/fsktMQHtunkKQ2Jf8",
    telefone: "(48) 933003929",
    linkWhatsApp: "https://wa.me/5548933003929", 
    pagamentos: "Cartão, Dinheiro, Pix .",
    opcoesServico: "Uma infinidade de sabores de Pizzas · Música ao vivo · Wi-Fi",
    horarios: {
        // new Date().getDay() -> Domingo: 0, Segunda: 1, ..., Sábado: 6
        0: [{ abre: "12:00", fecha: "16:00" }, { abre: "19:00", fecha: "23:00" }], // Domingo
        1: [{ abre: "11:45", fecha: "14:30" }, { abre: "19:00", fecha: "23:00" }], // Segunda
        2: [{ abre: "11:45", fecha: "14:30" }, { abre: "19:00", fecha: "23:00" }], // Terça
        3: [{ abre: "11:45", fecha: "14:30" }, { abre: "19:00", fecha: "23:00" }], // Quarta
        4: [{ abre: "11:45", fecha: "14:30" }, { abre: "19:00", fecha: "00:00" }], // Quinta
        5: [{ abre: "11:45", fecha: "14:30" }, { abre: "19:00", fecha: "00:00" }], // Sexta
        6: [{ abre: "12:00", fecha: "16:00" }, { abre: "19:00", fecha: "23:00" }], // Sábado
    }
};

const RotaCardapio =() => {
     const user = localStorage.getItem("usuarioLogado"); // ou "token"
    
    if (!user) {
      // Usuário não logado → manda para login
      return navigate("/login");
    }

    // Usuário logado → manda para cardápio
    navigate("/cardapio");
  };
// --- FUNÇÃO PARA VERIFICAR O STATUS DE FUNCIONAMENTO ---
const getStatusFuncionamento = () => {
    const agora = new Date();
    const diaDaSemana = agora.getDay();
    const horariosDoDia = infoRestaurante.horarios[diaDaSemana];

    if (!horariosDoDia) {
        return { status: "Fechado", proximaAbertura: "Fechado hoje" };
    }
    
    // Converte a hora atual para minutos desde o início do dia
    const horaAtualEmMinutos = agora.getHours() * 60 + agora.getMinutes();

    for (const turno of horariosDoDia) {
        const [horaAbre, minAbre] = turno.abre.split(':').map(Number);
        let [horaFecha, minFecha] = turno.fecha.split(':').map(Number);
        
        let aberturaEmMinutos = horaAbre * 60 + minAbre;
        let fechamentoEmMinutos = horaFecha * 60 + minFecha;
        
        // Lógica para horários que passam da meia-noite (ex: fecha às 00:00)
        if (fechamentoEmMinutos < aberturaEmMinutos) {
            fechamentoEmMinutos += 24 * 60; // Adiciona 24 horas
        }

        // Se estiver dentro de um turno, está aberto
        if (horaAtualEmMinutos >= aberturaEmMinutos && horaAtualEmMinutos < fechamentoEmMinutos) {
             return { status: `Aberto · Fecha às ${turno.fecha}` };
        }
        
        // Se a hora atual for antes do próximo turno, informa a próxima abertura
        if (horaAtualEmMinutos < aberturaEmMinutos) {
            return { status: `Fechado · Abre às ${turno.abre}` };
        }
    }

    // Se passou por todos os turnos e não está aberto, está fechado pelo resto do dia
    return { status: "Fechado" };
};


    const [statusLoja, setStatusLoja] = useState({ status: "Carregando..." });
    
    useEffect(() => {
        // Define o status inicial
        setStatusLoja(getStatusFuncionamento());
        
        // Atualiza a cada 30 segundos para manter o status correto
        const intervalId = setInterval(() => {
            setStatusLoja(getStatusFuncionamento());
        }, 30000); 

        return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar o componente
    }, []);
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
                        <h1 className="hero-titulo">{infoRestaurante.nome}</h1>
                        <p className="hero-subtitulo">
                            Inspirada nas mais tradicionais Pizzarias Paulistanas, a Pantano é a escolha certa 
                            para quem busca uma pizza com massa de longa fermentação, borda crocante e, claro, 
                            muito sabor.
                       </p>
                        <button  onClick={RotaCardapio} target="_blank" rel="noopener noreferrer" className="hero-botao">
                            VER CARDÁPIO
                        </button>
                    </div>
                </section>

                {/* =========== SEÇÃO INFORMAÇÕES DA LOJA =========== */}
                <section className="secao-loja">
                    <div className="secao-loja-container">
                        <div className="texto-intro">
                            <h2 className="secao-titulo-maior">Nossa Casa</h2>
                            <p>Confira nossos horários, faça sua reserva e venha nos visitar!</p>
                        </div>

                        <div className="card-unidade">
                            <div className="card-unidade-imagem">
                                <img src={imagemDoLocal} alt={`Interior da ${infoRestaurante.nome}`} />
                            </div>
                            <div className="card-unidade-info">
                                <h3 className="unidade-nome">{infoRestaurante.nome} - Saco Grande</h3>
                                <ul className="unidade-contatos">
                                    <li>
                                        <i className="icone-horario"></i>
                                        {/* Status dinâmico */}
                                        <span className={statusLoja.status.includes('Aberto') ? 'status-aberto' : 'status-fechado'}>
                                          <strong>{statusLoja.status}</strong>
                                        </span>
                                    </li>
                                    <li>
                                        <i className="icone-local"></i>
                                        <span>{infoRestaurante.endereco}</span>
                                    </li>
                                    <li>
                                        <i className="icone-telefone"></i>
                                        <span>{infoRestaurante.telefone}</span>
                                    </li>
                                    <li>
                                        <i className="icone-pagamento"></i>
                                        <span>Pagamentos: {infoRestaurante.pagamentos}</span>
                                    </li>
                                    <li>
                                        <i className="icone-servico"></i>
                                        <span>{infoRestaurante.opcoesServico}</span>
                                    </li>
                                </ul>
                                <div className="unidade-botoes">
                                    <a href={infoRestaurante.linkGoogleMaps} target="_blank" rel="noopener noreferrer" className="link-mapa">
                                        Ver como chegar
                                    </a>
                                    <a href={infoRestaurante.linkWhatsApp} target="_blank" rel="noopener noreferrer" className="botao-reserva">
                                        Reservas
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
export default Home;