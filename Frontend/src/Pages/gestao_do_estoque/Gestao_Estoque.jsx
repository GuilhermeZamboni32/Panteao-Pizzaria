import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Gestao_Estoque.css'; // O CSS (ficheiro 4) será atualizado
import Header from '../../components/pastaheader/Header';

// Ícone SVG para os blocos
const IconeBloco = ({ corClasse }) => (
    <svg className={`item-icone ${corClasse}`} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="10"/>
    </svg>
);

function GestaoEstoque() {
    // Estado para o Resumo (contagem)
    const [estoqueResumo, setEstoqueResumo] = useState({ massas: null, molhoSalgado: null, molhoDoce: null });
    // Estado para a Lista Detalhada (slots ocupados)
    const [listaSlots, setListaSlots] = useState([]);
    // Estado para o formulário de reposição
    const [formData, setFormData] = useState({ pos: '1', cor: 'preto', op: '' });
    
    const [carregandoResumo, setCarregandoResumo] = useState(true);
    const [carregandoLista, setCarregandoLista] = useState(true);
    const [erro, setErro] = useState(null);
    const [mensagemForm, setMensagemForm] = useState(''); // Mensagem de sucesso/erro do form
    const navigate = useNavigate();

    // Função para buscar o Resumo (contagem)
    const buscarEstoqueResumo = async () => {
        setCarregandoResumo(true);
        try {
            const response = await fetch('http://localhost:3002/api/estoque');
            if (!response.ok) throw new Error('Falha ao buscar resumo do estoque');
            const data = await response.json();
            setEstoqueResumo({
                massas: data.massas ?? 0,
                molhoSalgado: data.molhoSalgado ?? 0,
                molhoDoce: data.molhoDoce ?? 0,
            });
        } catch (err) {
            setErro(err.message);
            setEstoqueResumo({ massas: null, molhoSalgado: null, molhoDoce: null });
        } finally {
            setCarregandoResumo(false);
        }
    };

    // Função para buscar a Lista Detalhada (slots)
    const buscarEstoqueDetalhes = async () => {
        setCarregandoLista(true);
        try {
            const response = await fetch('http://localhost:3002/api/estoque/detalhes');
            if (!response.ok) throw new Error('Falha ao buscar detalhes do estoque');
            const data = await response.json(); // Espera um array
            // Filtra apenas slots que têm cor ou estão ocupados
            setListaSlots(data.filter(slot => slot.cor || slot.op));
        } catch (err) {
            setErro(err.message);
            setListaSlots([]);
        } finally {
            setCarregandoLista(false);
        }
    };

    // Efeito para carregar ambos os dados ao montar
    useEffect(() => {
        buscarEstoqueResumo();
        buscarEstoqueDetalhes();
    }, []);

    // Atualiza o estado do formulário
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Submete o formulário (PUT para adicionar/atualizar)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setMensagemForm('Salvando...');
        
        const { pos, cor, op } = formData;
        if (!pos || !cor) {
            setMensagemForm('Posição e Cor são obrigatórias.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3002/api/estoque/${pos}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cor, op: op || null }) // Envia null se 'op' estiver vazio
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Erro ${response.status}`);
            }
            
            setMensagemForm(`Posição ${pos} atualizada com sucesso!`);
            setFormData({ pos: '1', cor: 'preto', op: '' }); // Reseta o form
            
            // Recarrega ambos os dados
            buscarEstoqueResumo();
            buscarEstoqueDetalhes();
            
        } catch (err) {
            console.error("Erro ao salvar posição:", err);
            setMensagemForm(`Erro: ${err.message}`);
        }
    };
    
    // Libera um slot (DELETE)
    const handleLiberarSlot = async (pos) => {
        if (!window.confirm(`Tem certeza que deseja liberar a Posição ${pos}? A peça será removida.`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3002/api/estoque/${pos}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                 const errData = await response.json();
                throw new Error(errData.error || `Erro ${response.status}`);
            }

            // Recarrega ambos os dados
            buscarEstoqueResumo();
            buscarEstoqueDetalhes();
            
        } catch (err) {
            console.error("Erro ao liberar posição:", err);
            setErro(err.message); // Mostra erro geral na página
        }
    };


    // Função auxiliar para renderizar a quantidade ou mensagem de status
    const renderizarQuantidade = (quantidade, carregando) => {
        if (carregando) return <span className="quantidade-carregando">...</span>;
        if (quantidade === null) return <span className="quantidade-erro">Erro!</span>;
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

                {/* 1. SEÇÃO RESUMO (O que já tínhamos) */}
                <div className="prateleiras">
                    <h2 className="titulo-secao-estoque">Resumo (Peças Disponíveis)</h2>
                    <div className="secao-estoque">
                        <div className="item-info">
                            <IconeBloco corClasse="cor-massa" />
                            <h3 className="item-titulo">Tamanhos de Massa</h3>
                        </div>
                        <div className="item-quantidade">
                            {renderizarQuantidade(estoqueResumo.massas, carregandoResumo)}
                            <span>unidades</span>
                        </div>
                    </div>
                    <div className="secao-estoque">
                        <div className="item-info">
                            <IconeBloco corClasse="cor-molho-salgado" />
                            <h3 className="item-titulo">Molhos Salgados</h3>
                        </div>
                        <div className="item-quantidade">
                            {renderizarQuantidade(estoqueResumo.molhoSalgado, carregandoResumo)}
                            <span>unidades</span>
                        </div>
                    </div>
                    <div className="secao-estoque">
                        <div className="item-info">
                            <IconeBloco corClasse="cor-molho-doce" />
                            <h3 className="item-titulo">Molhos Doces</h3>
                        </div>
                        <div className="item-quantidade">
                            {renderizarQuantidade(estoqueResumo.molhoDoce, carregandoResumo)}
                            <span>unidades</span>
                        </div>
                    </div>
                </div>

                {/* 2. NOVA SEÇÃO: REPOSIÇÃO (PUT) */}
                <div className="reposicao-container">
                    <h2 className="titulo-secao-estoque">Adicionar / Repor Peça</h2>
                    <form className="reposicao-form" onSubmit={handleFormSubmit}>
                        <div className="form-grupo-reposicao">
                            <label htmlFor="pos">Posição (1-26):</label>
                            <input
                                type="number"
                                id="pos"
                                name="pos"
                                min="1"
                                max="26"
                                value={formData.pos}
                                onChange={handleFormChange}
                                required
                            />
                        </div>
                        <div className="form-grupo-reposicao">
                            <label htmlFor="cor">Cor (Base):</label>
                            <select
                                id="cor"
                                name="cor"
                                value={formData.cor}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="preto">Massa (preto)</option>
                                <option value="vermelho">Molho Salgado (vermelho)</option>
                                <option value="azul">Molho Doce (azul)</option>
                            </select>
                        </div>
                       
                        <button type="submit" className="btn-salvar-posicao">Salvar</button>
                    </form>
                    {mensagemForm && <p className="mensagem-form-estoque">{mensagemForm}</p>}
                </div>

                {/* 3. NOVA SEÇÃO: LISTA DETALHADA (GET/DELETE) */}
                <div className="lista-detalhada-container">
                    <h2 className="titulo-secao-estoque">Slots Ocupados / Cadastrados</h2>
                    {carregandoLista ? (
                        <p>Carregando slots...</p>
                    ) : (
                        <ul className="lista-detalhada-slots">
                            {listaSlots.map((slot) => (
                                <li key={slot.pos} className="slot-item">
                                    <span className="slot-pos">Posição: <strong>{slot.pos}</strong></span>
                                    <span className="slot-cor">Cor: <strong>{slot.cor || 'N/A'}</strong></span>
                                    <span className="slot-op">Pedido (OP): <strong>{slot.op || 'LIVRE'}</strong></span>
                                    <button 
                                        className="btn-liberar-slot" 
                                        onClick={() => handleLiberarSlot(slot.pos)}
                                        title="Liberar este slot (remove a peça)"
                                    >
                                        &times;
                                    </button>
                                </li>
                            ))}
                            {listaSlots.length === 0 && !carregandoLista && (
                                <p>Nenhum slot cadastrado ou ocupado na máquina.</p>
                            )}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
}

export default GestaoEstoque;