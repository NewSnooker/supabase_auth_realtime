import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Login from "../pages/Login";
import Chat from "../pages/Chat.";
import LayOut from "../components/LayOut";

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={<LayOut />}>
        <Route index element={<Navigate to="/chat" />} />
        <Route
          path="/chat"
          element={user ? <Chat /> : <Navigate to="/login" />}
        />
      </Route>
      <Route
        path="/chat"
        element={user ? <Chat /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

export default AppRoutes;
