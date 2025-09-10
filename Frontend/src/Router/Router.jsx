import { createBrowserRouter } from "react-router-dom";
import Home from "../Pages/Home/Home";
import Cadastro from "../Pages/Cadastro/Cadastro";
import Login from "../Pages/Login/Login";
import Pedidos from "../Pages/Pedidos/Pedidos";
import Cardapio from "../Pages/cardapio/Cardapio";
import Crie from "../Pages/crie_sua_pizza/Crie_Pizza";
import Carrinho from "../Pages/Carrinho/Carrinho";

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