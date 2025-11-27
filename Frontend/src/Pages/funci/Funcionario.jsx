import React, { useState, useEffect } from 'react';
import Header from '../../components/pastaheader/Header';
import './Funcionario.css';

function Funcionario() {
    const [funcionarios, setFuncionarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFuncionarios();
    }, []);

    const fetchFuncionarios = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/users');

            if (!response.ok) throw new Error('Erro ao buscar dados.');

            const data = await response.json();

            const listaAdmins = data.filter(user =>
                user.is_admin === true ||
                user.email.endsWith('@funcionario.com')
            );

            setFuncionarios(listaAdmins);
        } catch (err) {
            setError('Não foi possível carregar a lista de funcionários.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='pagina-funcionario'>
            <Header />
            <main className='container-funcionario'>
                <div className="painel-admin">

                    <h1 className="titulo-painel">Painel Administrativo</h1>
                    <p className="subtitulo-painel">Lista de Funcionários</p>

                    {loading && <p className="loading">Carregando dados...</p>}
                    {error && <p className="erro-msg">{error}</p>}

                    {!loading && !error && funcionarios.length === 0 && (
                        <p className="vazio-msg">Nenhum funcionário encontrado.</p>
                    )}

                    {!loading && !error && funcionarios.length > 0 && (
                        <div className="tabela-responsiva">
                            <table className="tabela-funcionarios">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Telefone</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {funcionarios.map((func) => (
                                        <tr key={func.cliente_id}>
                                            <td>#{func.cliente_id}</td>
                                            <td>{func.nome}</td>
                                            <td>{func.email}</td>
                                            <td>{func.telefone}</td>
                                            <td>
                                                <span className="badge-admin">Admin</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Funcionario;
