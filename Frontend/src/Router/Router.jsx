import { createBrowserRouter } from "react-router-dom";
import Home from "../Pages/Home/Home";
import Cadastro from "../Pages/Cadastro/Cadastro";
import Login from "../Pages/Login/Login";
import Historico_Pedidos from "../Pages/Historico/Historico_Pedidos";
import Cardapio from "../Pages/Cardapios/Cardapio";
import Crie from "../Pages/Crie_sua_pizza/Crie_Pizza";
import Carrinho from "../Pages/Carrinho/Carrinho";
import PedidosEmAndamento from "../Pages/pedidos_andamento/PedidosEmAndamento";
import Contato from "../Pages/Contato/Contato";
import Gestao_Estoque from "../Pages/Gestao_do_estoque/Gestao_Estoque";

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