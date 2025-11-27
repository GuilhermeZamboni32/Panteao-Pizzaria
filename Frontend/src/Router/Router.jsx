import { createBrowserRouter } from "react-router-dom";
import Home from "../Pages/Home/Home";
import Cadastro from "../Pages/Cadastro/Cadastro";
import Login from "../Pages/Login/Login";
import Historico_Pedidos from "../Pages/Historico/Historico_Pedidos";
import Cardapio from "../Pages/Cardapios/Cardapio";
import Crie from "../Pages/Crie_sua_pizza/Crie_Pizza";
import Carrinho from "../Pages/Carrinho/Carrinho";
import PedidosEmAndamento from "../Pages/Pedidos_andamento/PedidosEmAndamento";
import Contato from "../Pages/Contato/Contato";
import Gestao_Estoque from "../Pages/gestao_do_estoque/Gestao_Estoque";
import MinhaConta from "../Pages/Conta_de_Usuario/MinhaConta";
import Funcionario from "../Pages/funci/Funcionario";

const router = createBrowserRouter([
    { path: "/", element: <Home/> },
    { path: "/cadastro", element: <Cadastro/> },
    { path: "/Login", element: <Login/> },
    { path: "/Historico_Pedidos", element: <Historico_Pedidos/> },
    { path: "/Cardapio", element: <Cardapio/> },
    { path: "/Crie_pizza", element: <Crie/> },
    { path: "/Carrinho", element: <Carrinho/> },
    { path: "/PedidosEmAndamento", element: <PedidosEmAndamento/> },
    { path: "/Contato", element: <Contato/> },
    { path: "/Gestao_estoque", element: <Gestao_Estoque/> },
    { path: "/minhaconta", element: <MinhaConta/> },
    { path: "/Funcionario", element: <Funcionario/> }
]);

export default router;