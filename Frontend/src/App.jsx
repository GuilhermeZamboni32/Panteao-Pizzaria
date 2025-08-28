import './App.css';
import { GlobalProvider } from './Context/GlobalContext';
import { RouterProvider } from 'react-router-dom';
import router from './Router/Router';

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