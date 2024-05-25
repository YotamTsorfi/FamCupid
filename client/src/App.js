import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import { Provider } from "react-redux";
import store from "./redux/store";

import Login from "./components/Login";
import Home from "./components/Home";

function App() {
  return (
    <Provider store={store}>
      <Router>
        {/* <Header /> */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
