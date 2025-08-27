import { createBrowserRouter } from "react-router-dom";
import Home from "../Pages/Home/Home";
import Cadastro from "../Pages/Cadastro/Cadastro";
import Pedidos from "../Pages/Pedidos/Pedidos";

const router = createBrowserRouter([
    { path: "/", element: <Home /> },
    { path: "/cadastro", element: <Cadastro /> },
    { path: "/pedidos", element: <Pedidos /> }
]);

export default router;