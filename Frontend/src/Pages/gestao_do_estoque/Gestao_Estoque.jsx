import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Gestao_Estoque.css';
import Header from '../../components/pastaheader/Header';


const TOTAL_SLOTS_MAQUINA = 26;
const MAPA_CORES = {
    preto: "Massas",
    vermelho: "Molho Salgado",
    azul: "Molho Doce"
};

function GestaoEstoque() {
    // Estado para controlar as abas de disponibilidade, adicionar, remover.
    const [view, setView] = useState('disponibilidade');

    const [estoqueResumo, setEstoqueResumo] = useState({ massas: 0, molhoSalgado: 0, molhoDoce: 0 });
    const [listaSlots, setListaSlots] = useState([]);
    const [formData, setFormData] = useState({ pos: '1', cor: 'preto', op: '' });
    
    const [carregandoResumo, setCarregandoResumo] = useState(true);
    const [carregandoLista, setCarregandoLista] = useState(true);
    const [erro, setErro] = useState(null);
    const [mensagemForm, setMensagemForm] = useState('');
    const navigate = useNavigate();


    const { massas, molhoSalgado, molhoDoce } = estoqueResumo; // Ex: { massas: 10, molhoSalgado: 5, molhoDoce: 3 }
    
    const percMassa = (massas / TOTAL_SLOTS_MAQUINA) * 100;
    const percMolhoSalgado = (molhoSalgado / TOTAL_SLOTS_MAQUINA) * 100;
    const percMolhoDoce = (molhoDoce / TOTAL_SLOTS_MAQUINA) * 100;

    // Percentuais ACUMULADOS
    const p1_end = percMassa;
    const p2_end = percMassa + percMolhoSalgado;
    const p3_end = percMassa + percMolhoSalgado + percMolhoDoce;

    // Objeto de estilo para o gráfico de ESTOQUE
    const estiloGraficoEstoque = {
    '--percent-massa': `${p1_end}%`,
    '--percent-molhoSalgado': `${p2_end}%`,
    '--percent-molhoDoce': `${p3_end}%`
    };
    
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

    const buscarEstoqueDetalhes = async () => {
        setCarregandoLista(true);
        try {
            const response = await fetch('http://localhost:3002/api/estoque/detalhes');
            if (!response.ok) throw new Error('Falha ao buscar detalhes do estoque');
            const data = await response.json();
            
            if (Array.isArray(data)) { 
                setListaSlots(data.filter(slot => slot.cor || slot.op));
            } else {
                setListaSlots([]); 
            }
        } catch (err) {
            setErro(err.message);
            setListaSlots([]);
        } finally {
            setCarregandoLista(false);
        }
    };

    useEffect(() => {
        buscarEstoqueResumo();
        buscarEstoqueDetalhes();
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
                body: JSON.stringify({ cor, op: op || null }) 
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Erro ${response.status}`);
            }
            
            setMensagemForm(`Posição ${pos} atualizada com sucesso!`);
            setFormData({ pos: '1', cor: 'preto', op: '' });
            
            buscarEstoqueResumo();
            buscarEstoqueDetalhes();
            
        } catch (err) {
            console.error("Erro ao salvar posição:", err);
            setMensagemForm(`Erro: ${err.message}`);
        }
    };
    
    const handleLiberarSlot = async (pos) => {
        if (!window.confirm(`Tem certeza que deseja liberar a Posição ${pos}? A peça será removida.`)) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:3002/api/estoque/${pos}`, { method: 'DELETE' });
            if (!response.ok) {
                 const errData = await response.json();
                throw new Error(errData.error || `Erro ${response.status}`);
            }
            buscarEstoqueResumo();
            buscarEstoqueDetalhes();
        } catch (err) {
            console.error("Erro ao liberar posição:", err);
            setErro(err.message);
        }
    };

    // Renderiza a tela de Disponibilidade
    const renderDisponibilidade = () => {
        const totalOcupado = listaSlots.length;
        const percentualOcupacao = (totalOcupado / TOTAL_SLOTS_MAQUINA) * 100;
        
        // Mockado, não temos esses dados da API
        const percentualExpedicao = 0; 
        const totalExpedicao = 0;

        const renderQtde = (q) => carregandoResumo ? '...' : (q ?? 0);

        return (
            <div className="view-disponibilidade">
                <div className="resumo-cards-container">
                    <div className="resumo-card cor-preto">
                        <h3>{MAPA_CORES.preto}</h3>
                        <div className="card-conteudo">
                            <span className="card-valor">{renderQtde(estoqueResumo.massas)}</span>
                            <span>unidades</span>
                        </div>
                    </div>
                    <div className="resumo-card cor-vermelho">
                        <h3>{MAPA_CORES.vermelho}</h3>
                        <div className="card-conteudo">
                            <span className="card-valor">{renderQtde(estoqueResumo.molhoSalgado)}</span>
                            <span>unidades</span>
                        </div>
                    </div>
                    <div className="resumo-card cor-azul">
                        <h3>{MAPA_CORES.azul}</h3>
                        <div className="card-conteudo">
                            <span className="card-valor">{renderQtde(estoqueResumo.molhoDoce)}</span>
                            <span>unidades</span>
                        </div>
                    </div>
                </div>

                <div className="graficos-container">
                    <div className="grafico-card">
                        <h3><i className="icone-box"></i>Estoque</h3>
                        <div className="grafico-donut">
                            <span className="grafico-percentual">{percentualOcupacao.toFixed(0)}%</span>
                            <div className="donut-chart" style={{'--percent': percentualOcupacao}}></div>
                        </div>
                        <span className="grafico-total">Total Ocupado: {totalOcupado} / {TOTAL_SLOTS_MAQUINA}</span>
                    </div>
                    
                    <div className="grafico-card">
                        <h3><i className="icone-truck"></i>Expedição</h3>
                        <div className="grafico-donut">
                            <span className="grafico-percentual">{percentualExpedicao.toFixed(0)}%</span>
                             <div className="donut-chart" style={estiloGraficoEstoque}></div>
                        </div>
                        <span className="grafico-total">Total Ocupado: {totalExpedicao} / ???</span>
                    </div>
                </div>
            </div>
        );
    };

    // Renderiza a tela de Adicionar 
    const renderAdicionar = () => (
        <div className="view-adicionar">
            <div className="form-card">
                <h3><i className="icone-box"></i>Adicionar Peça no Estoque</h3>
                <form className="reposicao-form" onSubmit={handleFormSubmit}>
                    <div className="form-grupo-reposicao">
                        <label htmlFor="pos">Posição (1-{TOTAL_SLOTS_MAQUINA}):</label>
                        <input
                            type="number"
                            id="pos"
                            name="pos"
                            min="1"
                            max={TOTAL_SLOTS_MAQUINA}
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
                            <option value="preto">{MAPA_CORES.preto} (preto)</option>
                            <option value="vermelho">{MAPA_CORES.vermelho} (vermelho)</option>
                            <option value="azul">{MAPA_CORES.azul} (azul)</option>
                        </select>
                    </div>

                    <div className="form-grupo-reposicao">
                        <label htmlFor="op">Pedido (OP) (Opcional):</label>
                        <input
                            type="text"
                            id="op"
                            name="op"
                            value={formData.op}
                            onChange={handleFormChange}
                            placeholder="OP1234"
                        />
                    </div>
                    
                    <button type="submit" className="btn-salvar-posicao">Adicionar</button>
                </form>
                {mensagemForm && <p className="mensagem-form-estoque">{mensagemForm}</p>}
            </div>
        </div>
    );

    // Renderiza a tela de Remover
    const renderRemover = () => (
        <div className="view-remover">
            <div className="lista-card">
                <h3>Selecione o bloco que deseja remover</h3>
                {carregandoLista ? (
                    <p>Carregando slots...</p>
                ) : (
                    <div className="tabela-container">
                        <div className="lista-header">
                            <span>Posição</span>
                            <span>Cor (Base)</span>
                            <span>Pedido (OP)</span>
                            <span>Ação</span>
                        </div>
                        <ul className="lista-detalhada-slots">
                            {listaSlots.map((slot) => (
                                <li key={slot.pos} className="slot-item">
                                    <span><strong>{slot.pos}</strong></span>
                                    <span>{MAPA_CORES[slot.cor] || slot.cor || 'N/A'}</span>
                                    <span>{slot.op || '---'}</span>
                                    <button 
                                        className="btn-liberar-slot" 
                                        onClick={() => handleLiberarSlot(slot.pos)}
                                        title="Liberar este slot (remove a peça)"
                                    >
                                        Remover
                                    </button>
                                </li>
                            ))}
                            {listaSlots.length === 0 && !carregandoLista && (
                                <p className="lista-vazia">Nenhum slot cadastrado ou ocupado na máquina.</p>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="pagina-estoque">
            <Header />
            <main className="container-gestao">
                {/* Menu Lateral */}
                <nav className="gestao-nav">
                    <h1>Gestão</h1>
                    <button className={`nav-item ${view === 'disponibilidade' ? 'active' : ''}`} onClick={() => setView('disponibilidade')}>
                         <img src="/icons/disponibilidade.png" alt="" className="nav-icon" /> 
                         Disponibilidade
                    </button>
                    <button className={`nav-item ${view === 'adicionar' ? 'active' : ''}`} onClick={() => setView('adicionar')}>
                        <img src="/icons/mais.png" alt="" className="nav-icon" /> 
                        Adicionar
                    </button>
                    <button className={`nav-item ${view === 'remover' ? 'active' : ''}`} onClick={() => setView('remover')}>
                        <img src="/icons/menos.png" alt="" className="nav-icon" /> 
                        Remover
                    </button>
                </nav>

                <section className="gestao-conteudo">
                    {erro && <p className="mensagem-erro-geral">{erro}</p>}
                    
                    {view === 'disponibilidade' && renderDisponibilidade()}
                    {view === 'adicionar' && renderAdicionar()}
                    {view === 'remover' && renderRemover()}
                </section>
            </main>
        </div>
    );
}

export default GestaoEstoque;