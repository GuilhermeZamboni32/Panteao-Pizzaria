import { createBrowserRouter } from "react-router-dom";
import Home from "../Pages/home/Home";
import Cadastro from "../Pages/cadastro/Cadastro";
import Login from "../Pages/login/Login";
import Pedidos from "../Pages/pedidos/Pedidos";
import Cardapio from "../Pages/cardapio/Cardapio";
import Crie from "../Pages/crie_sua_pizza/Crie_Pizza";
import Carrinho from "../Pages/carrinho/Carrinho";

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