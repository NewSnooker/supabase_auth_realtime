import { useAuth } from "../contexts/AuthContext";
import { LogOut } from "lucide-react";
function Navbar() {
  const { user, signOut } = useAuth();
  return (
    <div>
      <nav className="bg-white px-2 sm:px-4 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="w-full flex items-center justify-between h-16">
            <h1 className="text-xl font-bold "> Realtime Chat</h1>
            {user ? (
              <div className="flex items-center flex-shrink-0">
                <span className="mr-4"> {user.email}</span>
                <button onClick={signOut} className="btn btn-ghost btn-circle">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
