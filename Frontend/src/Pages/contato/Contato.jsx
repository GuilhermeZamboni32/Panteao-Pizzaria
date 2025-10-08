import React, { useState } from 'react';
import './Contato.css';
import Header from '../../components/pastaheader/Header'; // Verifique se o caminho do seu Header está correto

// --- DADOS DOS MEMBROS ---
const membros = [
    {
        nome: "Guilherme Zamboni",
        cargo: "Desenvolvedor Full-Stack",
        bio: "Responsável principal pelo desenvolvimento visual e funcional da interface Front-End, além da coleta, tratamento e filtragem de dados provenientes do banco de dados do projeto.",
        foto: "/carrossel/gui.png",
        github: "https://github.com/GuilhermeZamboni32",
        linkedin: "https://www.linkedin.com/in/seu-linkedin-aqui",
        instagram: "https://www.instagram.com/seu-instagram-aqui"
    },
    {
        nome: "Jonathan Stülp",
        cargo: "Desenvolvedor Back-End",
        bio: " Responsável secundário pelas funcionalidades do Back-End, atuando também como colaborador em outras áreas do projeto.",
        foto: "/carrossel/jojo.png",
        github: "https://github.com/Jow-Sky",
        linkedin: "https://www.linkedin.com/in/seu-linkedin-aqui",
        instagram: "https://www.instagram.com/seu-instagram-aqui"
    },
    {
        nome: "Théo Pereira",
        cargo: "Designer Front-End",
        bio: "Responsável secundário pelo design e pela estrutura visual da interface Front-End.",
        foto: "/carrossel/theo.png",
        github: "https://github.com/theojouki",
        linkedin: "https://www.linkedin.com/in/seu-linkedin-aqui",
        instagram: "https://www.instagram.com/seu-instagram-aqui"
    },
    {
        nome: "Thiago Quadra",
        cargo: "Pesquisador",
        bio: "Responsável pelo suporte na concepção visual do Front-End e pela realização de pesquisas para aprimoramento do projeto.",
        foto: "/carrossel/th.png",
        github: "https://github.com/thpixel-dev",
        linkedin: "https://www.linkedin.com/in/seu-linkedin-aqui",
        instagram: "https://www.instagram.com/seu-instagram-aqui"
    },
    {
        nome: "Vitor Danielli",
        cargo: "Desenvolvedor Back-End",
        bio: "Responsável principal pelas funcionalidades do Back-End, incluindo a implementação de processos lógicos e a criptografia de dados sensíveis dos usuários.",
        foto: "/carrossel/cafe.png",
        github: "https://github.com/CafeinaC4",
        linkedin: "https://www.linkedin.com/in/seu-linkedin-aqui",
        instagram: "https://www.instagram.com/seu-instagram-aqui"
    }
];


// --- DADOS PARA A DEMONSTRAÇÃO ---
const iconesCategoria = {
  Carnes: "/icons/carne-preto.png",
  Queijos: "/icons/queijo-preto.png",
  Saladas: "/icons/alface-preto.png",
  Frutas: "/icons/frutas-preto.png",
  Chocolates: "/icons/barra-chocolate-preto.png",
  Complementos: "/icons/amendoim-preto.png",
};

const ingredientesPorCategoria = {
  Carnes: ["Bacon", "Frango", "Calabresa", "Camarão"],
  Queijos: ["Mussarela", "Cheddar", "Parmesão", "Gorgonzola"],
  Saladas: ["Tomate", "Brócolis", "Rúcula", "Cebola"],
  Frutas: ["Uva", "Morango", "Banana", "Cereja"],
  Chocolates: ["Chocolate Preto", "Chocolate Branco", "Nutella", "Ovomaltine"],
  Complementos: ["Milho", "Orégano", "M&M", "Coco ralado"]
};

const iconesIngrediente = {
  "Bacon": "/icons/bacon-preto.png", "Frango": "/icons/frango-preto.png", "Calabresa": "/icons/calabresa-preto.png", "Camarão": "/icons/camarao-preto.png",
  "Mussarela": "/icons/mussarela-preto.png", "Cheddar": "/icons/cheddar-preto.png", "Parmesão": "/icons/parmesao-preto.png", "Gorgonzola": "/icons/gorgonzola-preto.png",
  "Tomate": "/icons/tomate-preto.png", "Brócolis": "/icons/brocolis-preto.png", "Rúcula": "/icons/rucula-preto.png", "Cebola": "/icons/cebola-preto.png",
  "Uva": "/icons/uva-preto.png", "Morango": "/icons/morango-preto.png", "Banana": "/icons/banana-preto.png", "Cereja": "/icons/cereja-preto.png",
  "Chocolate Preto": "/icons/chocolate-preto.png", "Chocolate Branco": "/icons/chocolate-branco-preto.png", "Nutella": "/icons/nutella-preto.png", "Ovomaltine": "/icons/ovomaltine-preto.png",
  "Milho": "/icons/milho-preto.png", "Orégano": "/icons/oregano-preto.png", "M&M": "/icons/mm-preto.png", "Coco ralado": "/icons/coco-ralado-preto.png"
};

// --- COMPONENTE DE DEMONSTRAÇÃO INTERATIVA (AQUI ESTÁ A CORREÇÃO) ---
const DemonstracaoIngredientes = () => {
  // AQUI criamos o estado que estava faltando
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Carnes');
  const [ingredientesSelecionados, setIngredientesSelecionados] = useState({});

  const toggleIngrediente = (ingrediente) => {
    setIngredientesSelecionados(prev => ({
      ...prev,
      [ingrediente]: !prev[ingrediente]
    }));
  };

  return (
    <>
      <h4>2. Explorando e Adicionando Ingredientes</h4>
      <p>Clique nas categorias para ver como os ingredientes mudam. A seleção é interativa!</p>
      <div className="demonstracao-container">
        {/* Coluna de Categorias */}
        <div className="secao-demonstracao">
          <h5 className="subtitulo-demonstracao">Categorias</h5>
          <div className="opcoes-demonstracao">
            {Object.keys(ingredientesPorCategoria).map((categoria) => (
              <button
                key={categoria}
                className={`card-demo card-categoria ${categoriaSelecionada === categoria ? 'selecionado' : ''}`}
                onClick={() => setCategoriaSelecionada(categoria)}>
                <img src={iconesCategoria[categoria]} alt={categoria} className="icone-demo" />
                <span>{categoria}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Coluna de Ingredientes */}
        <div className="secao-demonstracao">
          <h5 className="subtitulo-demonstracao">Ingredientes de {categoriaSelecionada}</h5>
          <div className="opcoes-demonstracao">
            {ingredientesPorCategoria[categoriaSelecionada].map((nomeIngrediente) => (
              <button
                key={nomeIngrediente}
                className={`card-demo card-ingrediente ${ingredientesSelecionados[nomeIngrediente] ? 'selecionado' : ''}`}
                onClick={() => toggleIngrediente(nomeIngrediente)}
              >
                <img src={iconesIngrediente[nomeIngrediente]} alt={nomeIngrediente} className="icone-demo" />
                {nomeIngrediente}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};


// --- COMPONENTE DO CARD DE MEMBRO ---
const MemberCard = ({ membro, className }) => (
    <div className={`card-membro ${className}`}>
        <img src={membro.foto} alt={membro.nome} className="foto-membro" />
        <h3 className="nome-membro">{membro.nome}</h3>
        <p className="cargo-membro">{membro.cargo}</p>
        <p className="bio-membro">{membro.bio}</p>
        <div className="redes-sociais">
            <a href={membro.github} target="_blank" rel="noopener noreferrer">
                <img src="/carrossel/github.png" alt="GitHub" />
            </a>
            <a href={membro.linkedin} target="_blank" rel="noopener noreferrer">
                <img src="/carrossel/linkedin.png" alt="LinkedIn" />
            </a>
            <a href={membro.instagram} target="_blank" rel="noopener noreferrer">
                <img src="/carrossel/instagram.png" alt="Instagram" />
            </a>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
function Contato() {
    const [index, setIndex] = useState(0);

    const proximo = () => setIndex((prev) => (prev + 1) % membros.length);
    const anterior = () => setIndex((prev) => (prev - 1 + membros.length) % membros.length);

    const membroAtual = membros[index];
    const membroAnterior = membros[(index - 1 + membros.length) % membros.length];
    const membroProximo = membros[(index + 1) % membros.length];

    return (
        <div className='pagina-contato'>
            <Header />

            <section className="secao-equipe">
                <h1 className="titulo-secao">Sobre a nossa Equipe</h1>
                <div className="carrossel-container">
                    <button className="seta" onClick={anterior}>&lt;</button>
                    <div className="carrossel-cards">
                        <MemberCard membro={membroAnterior} className="anterior" />
                        <MemberCard membro={membroAtual} className="atual" />
                        <MemberCard membro={membroProximo} className="proximo" />
                    </div>
                    <button className="seta" onClick={proximo}>&gt;</button>
                </div>
            </section>

            <section className="secao-projeto">
                <h2 className="titulo-secao">Sobre o nosso Projeto</h2>
                <div className="conteudo-projeto">
                    <p>
                        O <strong>Panteão Pizzaria</strong> é uma plataforma de e-commerce que revoluciona a forma como você pede pizza. Nosso sistema interativo permite que cada cliente seja o mestre-cuca de sua própria pizza, com uma interface visual e intuitiva para personalizar cada detalhe.
                    </p>

                    <h3> Como Criar Sua Pizza Perfeita</h3>
                    
                    <h4>1. Definindo a Base: Tamanho e Molho</h4>
                    <p>
                        Comece escolhendo o alicerce da sua criação. Você tem controle total sobre o tamanho da pizza e o tipo de molho que irá compor a base:
                    </p>
                    <ul>
                        <li><strong>Tamanho da Pizza:</strong>
                            <ul>
                                <li><strong>20cm (Broto):</strong> Ideal para porções individuais, permitindo de 0 a 3 ingredientes.</li>
                                <li><strong>30cm (Média):</strong> Uma opção versátil, com capacidade para 0 a 6 ingredientes.</li>
                                <li><strong>45cm (Grande):</strong> Para compartilhar, oferecendo espaço para 0 a 9 ingredientes.</li>
                            </ul>
                        </li>
                        <li><strong>Tipo de Molho:</strong>
                            <ul>
                                <li><strong>Molho de Tomate:</strong> A escolha clássica para pizzas salgadas.</li>
                                <li><strong>Molho Doce:</strong> Perfeito para inovar com pizzas de sobremesa.</li>
                            </ul>
                        </li>
                    </ul>
                    
                    {/* AQUI USAMOS O COMPONENTE CORRIGIDO */}
                    <DemonstracaoIngredientes />

                    <h3>💻 Arquitetura e Tecnologia</h3>
                    <p>
                        Para entregar essa experiência de usuário fluida e responsiva, o Panteão Pizzaria foi desenvolvido com 
                        <strong>React.js</strong> no front-end, garantindo uma interface dinâmica e de fácil interação. 
                        <p />
                        <p></p>
                        A lógica complexa por trás da montagem da pizza e a gestão dos pedidos são suportadas por um back-end robusto, 
                        enquanto um banco de dados otimizado armazena todas as informações de forma segura. 
                      <p />
                        Esta combinação tecnológica assegura um sistema eficiente e escalável, pronto para atender à demanda da sua pizzaria.
                    </p>
                </div>
            </section>
        </div>
    );
}

export default Contato;