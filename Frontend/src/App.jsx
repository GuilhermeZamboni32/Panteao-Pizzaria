import './App.css';
import { GlobalProvider } from './context/GlobalContext';
import { RouterProvider } from 'react-router-dom';
import router from './router/Router';

function App() {
  return (
    <>
      <GlobalProvider>
        <RouterProvider router={router} />
      </GlobalProvider>
    </>
  );
}

export default App;