import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/home/Home";
import Cadastro from "../pages/cadastro/Cadastro";
import Login from "../Pages/login/Login";
import Pedidos from "../Pages/Pedidos/Pedidos";
import Cardapio from "../pages/cardapio/Cardapio";
import Crie from "../Pages/crie_sua_pizza/Crie_Pizza";
import Carrinho from "../pages/carrinho/Carrinho";
//import Contato from "../pages/contato/Contato";

const router = createBrowserRouter([
    { path: "/", element: <Home/> },
    { path: "/cadastro", element: <Cadastro/> },
    { path: "/Login", element: <Login/> },
    { path: "/Pedidos", element: <Pedidos/> },
    { path: "/Cardapio", element: <Cardapio/> },
    { path: "/Crie_pizza", element: <Crie/> },
    { path: "/Carrinho", element: <Carrinho/> },
    {/* path: "/Contato", element: <Contato/>*/ }
]);

export default router;