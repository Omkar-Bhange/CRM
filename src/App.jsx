import { useState } from "react";
import Login from "./Login";
import Admin from "./admin/Admin";
import EmployeeLayout from "./employee/EmployeeLayout";
import ClientLayout from "./client/ClientLayout";

const PAGE_STORAGE_KEY = "client-connect-current-page";

function getInitialPage() {
    const savedPage = localStorage.getItem(PAGE_STORAGE_KEY);

    if (["admin", "employee", "client"].includes(savedPage)) {
        return savedPage;
    }

    return "login";
}

export default function App() {
    const [currentPage, setCurrentPage] = useState(getInitialPage);

    const handleLogin = (role, user) => {
        if (!["admin", "employee", "client"].includes(role)) {
            alert("Invalid user role.");
            return;
        }

        localStorage.setItem(PAGE_STORAGE_KEY, role);

        if (user) {
            localStorage.setItem(
                "client-connect-current-user",
                JSON.stringify(user)
            );
        }

        setCurrentPage(role);
    };

const handleLogout = () => {
  // Signing out only clears the CRM session. Attendance is closed exclusively
  // through the employee's explicit End Workday action.
  localStorage.removeItem(PAGE_STORAGE_KEY);
  localStorage.removeItem("client-connect-token");
  localStorage.removeItem("client-connect-user");
  localStorage.removeItem(
    "client-connect-current-user"
  );

  sessionStorage.removeItem("client-connect-token");
  sessionStorage.removeItem("client-connect-user");

  setCurrentPage("login");
};

    if (currentPage === "admin") {
        return <Admin onLogout={handleLogout} />;
    }

    if (currentPage === "employee") {
        return <EmployeeLayout onLogout={handleLogout} />;
    }

    if (currentPage === "client") {
        return <ClientLayout onLogout={handleLogout} />;
    }

    return <Login onLogin={handleLogin} />;
}
