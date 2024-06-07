import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import { Provider } from "react-redux";
import store from "./redux/store";

import Login from "./components/Login";
import Home from "./components/Home";
import Profile from "./components/Profile";
import Members from "./components/Members";

function App() {
  return (
    <Provider store={store}>
      <Router>
        {/* <Header /> */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/members" element={<Members />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
