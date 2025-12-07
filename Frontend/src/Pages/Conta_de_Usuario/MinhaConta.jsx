import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MinhaConta.css'; 
import Header from '../../components/pastaheader/Header';
import { FiEye, FiEyeOff } from 'react-icons/fi';



// ############################################################################################################################
// ############################################################################################################################

//                                                COMPONENTE ViewDados 

// ############################################################################################################################
// ############################################################################################################################

const ViewDados = () => {
    const [formData, setFormData] = useState({ id: '', nome: '', email: '', telefone: '' });
    const [mensagemDados, setMensagemDados] = useState({ tipo: '', texto: '' });
    const [senhaData, setSenhaData] = useState({ atual: '', nova: '', confirma: '' });
    const [mensagemSenha, setMensagemSenha] = useState({ tipo: '', texto: '' });
    const [showAtual, setShowAtual] = useState(false);
    const [showNova, setShowNova] = useState(false);
    const [showConfirma, setShowConfirma] = useState(false);

    useEffect(() => {
        const usuarioStorage = localStorage.getItem('usuarioLogado');
        if (usuarioStorage) {
            const usuario = JSON.parse(usuarioStorage);
            setFormData({
                // --- CORREÇÃO AQUI ---
                id: usuario.cliente_id || '', // Busca 'cliente_id' ao invés de 'id'
                // ---------------------
                nome: usuario.nome || '',
                email: usuario.email || '',
                telefone: usuario.telefone || ''
            });
        }
    }, []);

    const handleDadosChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSenhaChange = (e) => setSenhaData({ ...senhaData, [e.target.name]: e.target.value });

    const handleDadosSubmit = async (e) => {
        e.preventDefault();
        setMensagemDados({ tipo: 'info', texto: 'Salvando...' });
        try {
            const response = await fetch(`http://localhost:3001/api/users/${formData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: formData.nome, telefone: formData.telefone })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro ao atualizar dados.');

            const usuarioAtualizado = { ...JSON.parse(localStorage.getItem('usuarioLogado')), ...formData };
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));
            setMensagemDados({ tipo: 'sucesso', texto: 'Dados atualizados com sucesso!' });
        } catch (err) {
            setMensagemDados({ tipo: 'erro', texto: err.message });
        }
    };

    const handleSenhaSubmit = async (e) => {
        e.preventDefault();
        if (senhaData.nova !== senhaData.confirma) {
            setMensagemSenha({ tipo: 'erro', texto: 'A nova senha e a confirmação não batem.' });
            return;
        }
        if (senhaData.nova.length < 8) {
             setMensagemSenha({ tipo: 'erro', texto: 'A nova senha deve ter pelo menos 8 caracteres.' });
            return;
        }
        setMensagemSenha({ tipo: 'info', texto: 'Alterando...' });
        try {
             const response = await fetch(`http://localhost:3001/api/users/password/${formData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senhaAtual: senhaData.atual, novaSenha: senhaData.nova })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Senha atual incorreta ou erro no servidor.');
            setMensagemSenha({ tipo: 'sucesso', texto: 'Senha alterada com sucesso!' });
            setSenhaData({ atual: '', nova: '', confirma: '' });
        } catch (err) {
            setMensagemSenha({ tipo: 'erro', texto: err.message });
        }
    };

    return (
        <>
            <div className="form-card">
                <h3>Meus Dados Pessoais</h3>
                <form className="form-conta" onSubmit={handleDadosSubmit}>
                    <div className="form-grupo-conta">
                        <label htmlFor="nome">Nome:</label>
                        <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleDadosChange} />
                    </div>
                    <div className="form-grupo-conta">
                        <label htmlFor="email">Email (não pode ser alterado):</label>
                        <input type="email" id="email" name="email" value={formData.email} readOnly disabled className="input-disabled" />
                    </div>
                    <div className="form-grupo-conta">
                        <label htmlFor="telefone">Telefone:</label>
                        <input type="tel" id="telefone" name="telefone" value={formData.telefone} onChange={handleDadosChange} />
                    </div>
                    <button type="submit" className="btn-salvar-conta">Salvar Dados</button>
                    {mensagemDados.texto && <p className={`form-mensagem ${mensagemDados.tipo}`}>{mensagemDados.texto}</p>}
                </form>
            </div>

            <div className="form-card">
                <h3>Alterar Senha</h3>
                <form className="form-conta" onSubmit={handleSenhaSubmit}>
                    <div className="form-grupo-conta input-com-icone">
                        <label htmlFor="atual">Senha Atual:</label>
                        <input type={showAtual ? "text" : "password"} id="atual" name="atual" value={senhaData.atual} onChange={handleSenhaChange} />
                        <span className="password-toggle-icon" onClick={() => setShowAtual(!showAtual)}>{showAtual ? <FiEyeOff /> : <FiEye />}</span>
                    </div>
                    <div className="form-grupo-conta input-com-icone">
                        <label htmlFor="nova">Nova Senha:</label>
                        <input type={showNova ? "text" : "password"} id="nova" name="nova" value={senhaData.nova} onChange={handleSenhaChange} />
                        <span className="password-toggle-icon" onClick={() => setShowNova(!showNova)}>{showNova ? <FiEyeOff /> : <FiEye />}</span>
                    </div>
                    <div className="form-grupo-conta input-com-icone">
                        <label htmlFor="confirma">Confirmar Nova Senha:</label>
                        <input type={showConfirma ? "text" : "password"} id="confirma" name="confirma" value={senhaData.confirma} onChange={handleSenhaChange} />
                         <span className="password-toggle-icon" onClick={() => setShowConfirma(!showConfirma)}>{showConfirma ? <FiEyeOff /> : <FiEye />}</span>
                    </div>
                    <button type="submit" className="btn-salvar-conta">Alterar Senha</button>
                    {mensagemSenha.texto && <p className={`form-mensagem ${mensagemSenha.tipo}`}>{mensagemSenha.texto}</p>}
                </form>
            </div>
        </>
    );
};





// ############################################################################################################################
// ############################################################################################################################

//                                                OMPONENTE ViewEnderecos 

// ############################################################################################################################
// ############################################################################################################################

const ViewEnderecos = () => {
    const [enderecos, setEnderecos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [editandoId, setEditandoId] = useState(null);
    const [formData, setFormData] = useState({ rua: '', numero: '', bairro: '', cep: '', complemento: '' });
    const [usuarioId, setUsuarioId] = useState(null);

    const limparForm = () => {
        setFormData({ rua: '', numero: '', bairro: '', cep: '', complemento: '' });
        setEditandoId(null);
    };

    const buscarEnderecos = async (idDoUsuario) => {
        if (!idDoUsuario) return;
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/enderecos/${idDoUsuario}`);
            if (!response.ok) throw new Error('Falha ao buscar endereços.');
            const data = await response.json();
            setEnderecos(data);
            setErro(null);
        } catch (err) {
            setErro(err.message);
            setEnderecos([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const usuarioStorage = localStorage.getItem('usuarioLogado');
        if (usuarioStorage) {
            const usuario = JSON.parse(usuarioStorage);
            setUsuarioId(usuario.cliente_id); // CORREÇÃO AQUI
            buscarEnderecos(usuario.cliente_id); // CORREÇÃO AQUI
        } else {
            setIsLoading(false);
            setErro("Utilizador não encontrado. Faça login novamente.");
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro(null);
        const url = editandoId ? `http://localhost:3001/api/enderecos/${editandoId}` : `http://localhost:3001/api/enderecos`;
        const method = editandoId ? 'PUT' : 'POST';
        const body = editandoId ? formData : { ...formData, usuario_id: usuarioId };

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao salvar endereço.');
            }
            limparForm();
            await buscarEnderecos(usuarioId);
        } catch (err) {
            setErro(err.message);
        }
    };

    const handleEditarClick = (endereco) => {
        setEditandoId(endereco.id);
        setFormData({
            rua: endereco.rua,
            numero: endereco.numero,
            bairro: endereco.bairro,
            cep: endereco.cep,
            complemento: endereco.complemento || ''
        });
        window.scrollTo(0, 0);
    };

    const handleRemoverClick = async (enderecoId) => {
        if (!window.confirm("Tem certeza que deseja remover este endereço?")) return;
        try {
            const response = await fetch(`http://localhost:3001/api/enderecos/${enderecoId}`, { method: 'DELETE' });
            if (!response.ok) {
                 const data = await response.json();
                throw new Error(data.error || 'Erro ao remover endereço.');
            }
            await buscarEnderecos(usuarioId);
        } catch (err) {
            setErro(err.message);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <>
            <div className="form-card">
                <h3>{editandoId ? 'Editar Endereço' : 'Adicionar Novo Endereço'}</h3>
                <form className="form-conta-grid" onSubmit={handleSubmit}>
                    <div className="form-grupo-conta" style={{ gridArea: 'rua' }}>
                        <label htmlFor="rua">Rua / Logradouro:</label>
                        <input type="text" id="rua" name="rua" value={formData.rua} onChange={handleChange} required />
                    </div>
                    <div className="form-grupo-conta" style={{ gridArea: 'numero' }}>
                        <label htmlFor="numero">Número:</label>
                        <input type="text" id="numero" name="numero" value={formData.numero} onChange={handleChange} required />
                    </div>
                    <div className="form-grupo-conta" style={{ gridArea: 'bairro' }}>
                        <label htmlFor="bairro">Bairro:</label>
                        <input type="text" id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} required />
                    </div>
                     <div className="form-grupo-conta" style={{ gridArea: 'cep' }}>
                        <label htmlFor="cep">CEP:</label>
                        <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} required />
                    </div>
                    <div className="form-grupo-conta" style={{ gridArea: 'complemento' }}>
                        <label htmlFor="complemento">Complemento (Opcional):</label>
                        <input type="text" id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} />
                    </div>
                    <div className="form-botoes-endereco" style={{ gridArea: 'botoes' }}>
                        <button type="submit" className="btn-salvar-conta">
                            {editandoId ? 'Salvar Alterações' : 'Adicionar Endereço'}
                        </button>
                        {editandoId && (
                            <button type="button" className="btn-cancelar-conta" onClick={limparForm}>
                                Cancelar Edição
                            </button>
                        )}
                    </div>
                </form>
            </div>
            <div className="form-card">
                <h3>Meus Endereços Salvos</h3>
                {isLoading && <p>Carregando endereços...</p>}
                {erro && <p className="form-mensagem erro">{erro}</p>}
                {!isLoading && enderecos.length === 0 && <p>Nenhum endereço cadastrado.</p>}
                <ul className="lista-enderecos">
                    {enderecos.map(end => (
                        <li key={end.id} className="item-endereco">
                            <div className="endereco-info">
                                <strong>{end.rua}, {end.numero}</strong>
                                <span>{end.bairro} - CEP: {end.cep}</span>
                                {end.complemento && <span>{end.complemento}</span>}
                            </div>
                            <div className="endereco-acoes">
                                <button className="btn-acao-editar" onClick={() => handleEditarClick(end)}>Editar</button>
                                <button className="btn-acao-remover" onClick={() => handleRemoverClick(end.id)}>Remover</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};





// ############################################################################################################################
// ############################################################################################################################

//                                                OMPONENTE ViewPagamentos 

// ############################################################################################################################
// ############################################################################################################################

const ViewPagamentos = () => {
    const [cartoes, setCartoes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [formData, setFormData] = useState({ nome_titular: '', numero_cartao: '', validade: '', cvv: '' });
    const [usuarioId, setUsuarioId] = useState(null);

  const buscarCartoes = async (idDoUsuario) => {
    if (!idDoUsuario) return;
    setIsLoading(true);

    try {
        const response = await fetch(`http://localhost:3001/api/pagamentos/${idDoUsuario}`);
        if (!response.ok) throw new Error('Falha ao buscar cartões.');
        const data = await response.json();

        const usuarioString = localStorage.getItem("usuarioLogado");

        if (usuarioString) {
            const usuario = JSON.parse(usuarioString);

            usuario.possuiCartao = data.length > 0; // true ou false automaticamente

            localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
        }

        setCartoes(data);
        setErro(null);

    } catch (err) {
        setErro(err.message);
        setCartoes([]);
    } finally {
        setIsLoading(false);
    }
};




    useEffect(() => {
        const usuarioStorage = localStorage.getItem('usuarioLogado');
        if (usuarioStorage) {
            const usuario = JSON.parse(usuarioStorage);
            setUsuarioId(usuario.cliente_id); 
            buscarCartoes(usuario.cliente_id); 
        } else {
            setIsLoading(false);
            setErro("Utilizador não encontrado. Faça login novamente.");
        }
    }, []);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    if (formData.numero_cartao.length < 15 || formData.cvv.length < 3 
        || !formData.validade.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
        setErro("Dados do cartão inválidos. Use formato MM/AA para validade.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3001/api/pagamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, usuario_id: usuarioId })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao salvar cartão.');
        }

        
        const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
        usuario.possuiCartao = true;
        localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
       

        setFormData({ nome_titular: '', numero_cartao: '', validade: '', cvv: '' });
        await buscarCartoes(usuarioId);

    } catch (err) {
        setErro(err.message);
    }
};


    const handleRemoverClick = async (cartaoId) => {
        if (!window.confirm("Tem certeza que deseja remover este cartão?")) return;
        try {
            const response = await fetch(`http://localhost:3001/api/pagamentos/${cartaoId}`, { method: 'DELETE' });
            if (!response.ok) {
                 const data = await response.json();
                throw new Error(data.error || 'Erro ao remover cartão.');
            }
            await buscarCartoes(usuarioId);
        } catch (err) {
            setErro(err.message);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const getIconeBandeira = (brand) => {
        if (brand?.toLowerCase().includes('visa')) return "/icons/visa.png";
        if (brand?.toLowerCase().includes('master')) return "/icons/mastercard.png";
        return "/icons/cartao.png";
    }

    return (
        <>
            <div className="form-card">
                <h3>Adicionar Novo Cartão</h3>
                <div className="aviso-seguranca">
                    <strong>Atenção:</strong> Esta é uma simulação. Nunca insira dados de cartão de crédito reais em ambientes de teste.
                </div>
                <form className="form-conta-grid-pagamento" onSubmit={handleSubmit}>
                    <div className="form-grupo-conta" style={{ gridArea: 'nome' }}>
                        <label htmlFor="nome_titular">Nome no Cartão:</label>
                        <input type="text" id="nome_titular" name="nome_titular" value={formData.nome_titular} onChange={handleChange} required />
                    </div>
                    <div className="form-grupo-conta" style={{ gridArea: 'numero' }}>
                        <label htmlFor="numero_cartao">Número do Cartão:</label>
                        <input type="text" id="numero_cartao" name="numero_cartao" value={formData.numero_cartao} onChange={handleChange} maxLength="19" required />
                    </div>
                    <div className="form-grupo-conta" style={{ gridArea: 'validade' }}>
                        <label htmlFor="validade">Validade (MM/AA):</label>
                        <input type="text" id="validade" name="validade" value={formData.validade} onChange={handleChange} placeholder="MM/AA" maxLength="5" required />
                    </div>
                    <div className="form-grupo-conta" style={{ gridArea: 'cvv' }}>
                        <label htmlFor="cvv">CVV:</label>
                        <input type="text" id="cvv" name="cvv" value={formData.cvv} onChange={handleChange} maxLength="4" required />
                    </div>
                    <div className="form-botoes-endereco" style={{ gridArea: 'botoes' }}>
                        <button type="submit" className="btn-salvar-conta">Adicionar Cartão</button>
                    </div>
                </form>
                {erro && <p className="form-mensagem erro">{erro}</p>}
            </div>

            <div className="form-card">
                <h3>Meus Cartões Salvos</h3>
                {isLoading && <p>Carregando cartões...</p>}
                {!isLoading && cartoes.length === 0 && !erro && <p>Nenhum cartão cadastrado.</p>}
                <ul className="lista-cartoes">
                    {cartoes.map(cartao => (
                        <li key={cartao.id} className="item-cartao">
                            <img src={getIconeBandeira(cartao.brand)} alt={cartao.brand} className="cartao-icone-bandeira" />
                            <div className="cartao-info">
                                <strong>{cartao.brand || 'Cartão'} **** {cartao.last4}</strong>
                                <span>Expira em: {cartao.validade || 'N/D'}</span>
                            </div>
                            <div className="cartao-acoes">
                                <button className="btn-acao-remover" onClick={() => handleRemoverClick(cartao.id)}>Remover</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};





// ############################################################################################################################
// ############################################################################################################################

//                                                OMPONENTE ViewPedidos 

// ############################################################################################################################
// ############################################################################################################################

const ViewPedidos = () => {
    const [pedidos, setPedidos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [usuarioId, setUsuarioId] = useState(null);

    // Dentro de MinhaConta.jsx -> ViewPedidos

    const buscarPedidos = async (idDoUsuario) => {
        if (!idDoUsuario) return;
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:3002/api/pedidos/cliente/${idDoUsuario}`);
            if (!response.ok) throw new Error('Falha ao buscar histórico de pedidos.');
            const data = await response.json();
            setPedidos(data);
            setErro(null);
        } catch (err) {
            setErro(err.message);
            setPedidos([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const usuarioStorage = localStorage.getItem('usuarioLogado');
        if (usuarioStorage) {
            const usuario = JSON.parse(usuarioStorage);
            setUsuarioId(usuario.cliente_id); 
            buscarPedidos(usuario.cliente_id);
        } else {
            setIsLoading(false);
            setErro("Utilizador não encontrado. Faça login novamente.");
        }
    }, []);

    const formatarData = (dataString) => {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    };

    const formatarValor = (valor) => {
        return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="form-card">
            <h3>Meus Pedidos</h3>
            
            {isLoading && <p>Carregando histórico de pedidos...</p>}
            {erro && <p className="form-mensagem erro">{erro}</p>}
            
            {!isLoading && pedidos.length === 0 && !erro && (
                <p>Você ainda não fez nenhum pedido.</p>
            )}

            <ul className="lista-pedidos">
                {pedidos.map(pedido => (
                    <li key={pedido.pedido_id} className="item-pedido">
                        <div className="pedido-cabecalho">
                            <div className="pedido-info">
                                <strong>Pedido #{pedido.pedido_id}</strong>
                                <span>Realizado em: {formatarData(pedido.data_pedido)}</span>
                            </div>
                            <div className="pedido-status">
                                <strong>{pedido.status}</strong>
                                <span>{formatarValor(pedido.valor_total)}</span>
                            </div>
                        </div>
                        <ul className="pedido-lista-itens">
                            {pedido.itens.map(item => (
                                <li key={item.item_id}>{item.nome_item}</li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};



// ############################################################################################################################
// ############################################################################################################################

//                                                OMPONENTE  PRINCIPAL (MinhaConta) 

// ############################################################################################################################
// ############################################################################################################################

function MinhaConta() {
    const [view, setView] = useState('dados');
    const navigate = useNavigate();

    const renderView = () => {
        switch (view) {
            case 'dados':
                return <ViewDados />; 
            case 'enderecos':
                return <ViewEnderecos />;
            case 'pagamentos':
                return <ViewPagamentos />;
            case 'pedidos':
                return <ViewPedidos />;
            default:
                return <ViewDados />;
        }
    };

    return (
        <div className="pagina-conta">
            <Header />
            <main className="container-conta">
                {/* Menu Lateral */}
                <nav className="conta-nav">
                    <h1>Minha Conta</h1>
                    <button 
                        className={`nav-item ${view === 'dados' ? 'active' : ''}`}
                        onClick={() => setView('dados')}
                    >
                        <img src="/icons/dados.png" alt="" className="nav-icon" /> 
                        Meus Dados
                    </button>
                    <button 
                        className={`nav-item ${view === 'enderecos' ? 'active' : ''}`}
                        onClick={() => setView('enderecos')}
                    >
                        <img src="/icons/local-preto.png" alt="" className="nav-icon" /> 
                        Endereços
                    </button>
                    <button 
                        className={`nav-item ${view === 'pagamentos' ? 'active' : ''}`}
                        onClick={() => setView('pagamentos')}
                    >
                        <img src="/icons/cartao.png" alt="" className="nav-icon" /> 
                        Pagamentos
                    </button>
                    <button 
                        className={`nav-item ${view === 'pedidos' ? 'active' : ''}`}
                        onClick={() => setView('pedidos')}
                    >
                        <img src="/icons/carrinho-compras-preto.png" alt="" className="nav-icon" /> 
                        Meus Pedidos
                    </button>
                    <button 
                        className="nav-item nav-item-sair" 
                        onClick={() => navigate('/')} // Ação de Logout
                    >
                        <img src="/icons/sair.png" alt="" className="nav-icon" /> 
                        Sair
                    </button>
                </nav>

                {/* Conteúdo da Aba Selecionada */}
                <section className="conta-conteudo">
                    {renderView()}
                </section>
            </main>
        </div>
    );
}

export default MinhaConta;