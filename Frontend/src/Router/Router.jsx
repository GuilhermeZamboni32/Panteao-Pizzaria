import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/home/Home";
import Cadastro from "../pages/cadastro/Cadastro";
import Login from "../Pages/login/Login";
import Historico_Pedidos from "../Pages/historico/Historico_Pedidos";
import Cardapio from "../Pages/cardapios/Cardapio";
import Crie from "../Pages/crie_sua_pizza/Crie_Pizza";
import Carrinho from "../pages/carrinho/Carrinho";
import PedidosEmAndamento from "../Pages/pedidos_andamento/PedidosEmAndamento";
import Contato from "../Pages/contato/Contato";
import Gestao_Estoque from "../Pages/gestao_do_estoque/Gestao_Estoque";

const router = createBrowserRouter([
    { path: "/", element: <Home/> },
    { path: "/cadastro", element: <Cadastro/> },
    { path: "/Login", element: <Login/> },
    { path: "/Historico_Pedidos", element: <Historico_Pedidos/> },
    { path: "/Cardapio", element: <Cardapio/> },
    { path: "/Crie_pizza", element: <Crie/> },
    { path: "/Carrinho", element: <Carrinho/> },
    { path: "/PedidosEmAndamento", element: <PedidosEmAndamento/> },
    {path: "/Contato", element: <Contato/> },
    { path: "gestao_estoque", element: <Gestao_Estoque/> },
]);

export default router;