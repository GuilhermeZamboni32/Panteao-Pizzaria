import './App.css';
import GlobalContextProvider from './Context/GlobalContext';
import { RouterProvider } from 'react-router-dom';
import router from './Router/Router';

function App() {
  return (
    <>
      <GlobalContextProvider>
        <RouterProvider router={router} />
      </GlobalContextProvider>
    </>
  );
}

export default App;