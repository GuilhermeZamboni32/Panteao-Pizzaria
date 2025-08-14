import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import Cadastro from "../pages/Cadastro";
const router = createBrowserRouter([
    {path: "/", element: <Home/>},
    {path: "/home", element: <Home/>},
    {path: "/cadastro", element: <Cadastro/>},
])

export default router;