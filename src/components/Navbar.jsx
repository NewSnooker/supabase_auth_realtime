import { useAuth } from "../contexts/AuthContext";
import { LogOut } from "lucide";
function Navbar() {
  const { user, signOut } = useAuth();
  return (
    <div>
      <nav className="bg-white px-2 sm:px-4 py-2.5 ">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold "> Realtime Chat</h1>
              {user && (
                <div className="flex items-center">
                  <span className="mr-4"> {user.email}</span>
                  <button
                    onClick={signOut}
                    className="btn btn-ghost btn-circle"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
