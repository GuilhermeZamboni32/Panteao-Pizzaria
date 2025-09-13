import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/home/Home";
import Cadastro from "../pages/cadastro/Cadastro";
import Login from "../pages/login/Login";
import Pedidos from "../pages/pedidos/Pedidos";
import Cardapio from "../pages/cardapio/Cardapio";
import Crie from "../pages/crie_sua_pizza/Crie_Pizza";
import Carrinho from "../pages/carrinho/Carrinho";

const router = createBrowserRouter([
    { path: "/", element: <Home/> },
    { path: "/cadastro", element: <Cadastro/> },
    { path: "/Login", element: <Login/> },
    { path: "/pedidos", element: <Pedidos/> },
    { path: "/Cardapio", element: <Cardapio/> },
    { path: "/Crie_pizza", element: <Crie/> },
    { path: "/Carrinho", element: <Carrinho/> }
]);

export default router;