import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Gestao_Estoque.css';
import Header from '../../components/pastaheader/Header';

const IconeBloco = ({ corClasse }) => (
    <svg className={`item-icone ${corClasse}`} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="10"/>
    </svg>
);

function GestaoEstoque() {
    const [estoque, setEstoque] = useState({
        massas: null, // null é o estado inicial
        molhoSalgado: null,
        molhoDoce: null,
    });
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const buscarEstoque = async () => {
            setCarregando(true);
            setErro(null);
            try {
                // Chama a API do backend para obter o estoque
                const response = await fetch('http://localhost:3002/api/estoque');
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: Não foi possível buscar o estoque.`);
                }
                const data = await response.json();

                setEstoque({
                    massas: data.massas ?? 0,
                    molhoSalgado: data.molhoSalgado ?? 0,
                    molhoDoce: data.molhoDoce ?? 0,
                });

            } catch (err) {
                console.error("Erro ao buscar estoque:", err);
                setErro(err.message || "Falha ao conectar com o servidor de estoque.");
                setEstoque({ massas: null, molhoSalgado: null, molhoDoce: null });
            } finally {
                setCarregando(false);
            }
        };
        buscarEstoque();
    }, []);

    const renderizarQuantidade = (quantidade) => {
        if (carregando) return <span className="quantidade-carregando">Verificando...</span>;
        if (erro) return <span className="quantidade-erro">Erro!</span>;
        if (quantidade === null) return <span className="quantidade-erro">Indisponível</span>;
        return <span className="quantidade-valor">{quantidade}</span>;
    };

    return (
        <div className="pagina-estoque">
            <Header />
            <main className="container-estoque">
                <h1>Gestão de Estoque</h1>

                 <button className="btn-voltar-estoque" onClick={() => navigate('/')}>
                     Voltar para Home
                 </button>

                {erro && <p className="mensagem-erro-geral">{erro}</p>}

                <div className="prateleiras">
                    <div className="secao-estoque">
                        <div className="item-info">
                            <IconeBloco corClasse="cor-massa" />
                            <h2 className="item-titulo">Tamanhos de Massa</h2>
                        </div>
                        <div className="item-quantidade">
                            {renderizarQuantidade(estoque.massas)}
                            <span>unidades</span>
                        </div>
                    </div>

                    <div className="secao-estoque">
                        <div className="item-info">
                            <IconeBloco corClasse="cor-molho-salgado" />
                            <h2 className="item-titulo">Molhos Salgados</h2>
                        </div>
                        <div className="item-quantidade">
                            {renderizarQuantidade(estoque.molhoSalgado)}
                            <span>unidades</span>
                        </div>
                    </div>

                    <div className="secao-estoque">
                        <div className="item-info">
                            <IconeBloco corClasse="cor-molho-doce" />
                            <h2 className="item-titulo">Molhos Doces</h2>
                        </div>
                        <div className="item-quantidade">
                            {renderizarQuantidade(estoque.molhoDoce)}
                            <span>unidades</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default GestaoEstoque;

