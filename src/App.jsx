import {
  useEffect,
  useState,
} from "react";

import Login from "./Login";
import Admin from "./admin/Admin";
import EmployeeLayout from "./employee/EmployeeLayout";
import ClientLayout from "./client/ClientLayout";

import {
  clearAuthStorage,
  logoutAuthSession,
  validateCurrentSession,
} from "./auth/authClient";

const PAGE_STORAGE_KEY =
  "client-connect-current-page";

const CURRENT_USER_KEY =
  "client-connect-current-user";

const VALID_ROLES = [
  "admin",
  "employee",
  "client",
];

export default function App() {
  const [
    currentPage,
    setCurrentPage,
  ] = useState("loading");

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  /* =====================================================
     RESTORE + VALIDATE AUTHENTICATION
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    const restoreSession =
      async () => {
        try {
          const user =
            await validateCurrentSession();

          if (!mounted) {
            return;
          }

          if (
            !user ||
            !VALID_ROLES.includes(
              user.role
            )
          ) {
            clearAuthStorage();

            setCurrentUser(null);
            setCurrentPage(
              "login"
            );

            return;
          }

          setCurrentUser(user);

          setCurrentPage(
            user.role
          );

          localStorage.setItem(
            PAGE_STORAGE_KEY,
            user.role
          );

          localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify(
              user
            )
          );
        } catch (error) {
          console.error(
            "Restore session error:",
            error
          );

          if (!mounted) {
            return;
          }

          clearAuthStorage();

          setCurrentUser(null);
          setCurrentPage(
            "login"
          );
        }
      };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  /* =====================================================
     SESSION EXPIRED EVENT

     authClient dispatches this when:
     - refresh token is invalid
     - session was revoked
     - password changed
     - user no longer exists
  ===================================================== */

  useEffect(() => {
    const handleAuthExpired =
      () => {
        clearAuthStorage();

        setCurrentUser(null);
        setCurrentPage(
          "login"
        );
      };

    window.addEventListener(
      "client-connect-auth-expired",
      handleAuthExpired
    );

    return () => {
      window.removeEventListener(
        "client-connect-auth-expired",
        handleAuthExpired
      );
    };
  }, []);

  /* =====================================================
     LOGIN
  ===================================================== */

  const handleLogin = (
    role,
    user
  ) => {
    if (
      !VALID_ROLES.includes(
        role
      )
    ) {
      alert(
        "Invalid user role."
      );
      return;
    }

    setCurrentUser(
      user || null
    );

    localStorage.setItem(
      PAGE_STORAGE_KEY,
      role
    );

    if (user) {
      localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(user)
      );
    }

    setCurrentPage(role);
  };

  /* =====================================================
     LOGOUT

     IMPORTANT:
     This signs out of Client Connect ONLY.

     Employee attendance/workday continues to be controlled
     by the explicit End Workday action.
  ===================================================== */

  const handleLogout =
    async () => {
      /*
        Change UI immediately so logout feels instant.
      */
      setCurrentUser(null);
      setCurrentPage(
        "login"
      );

      await logoutAuthSession();
    };

  /* =====================================================
     AUTH BOOTSTRAP SCREEN
  ===================================================== */

  if (
    currentPage ===
    "loading"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f6fb]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  /* =====================================================
     ROLE WORKSPACES
  ===================================================== */

  if (
    currentPage ===
    "admin"
  ) {
    return (
      <Admin
        user={currentUser}
        onLogout={
          handleLogout
        }
      />
    );
  }

  if (
    currentPage ===
    "employee"
  ) {
    return (
      <EmployeeLayout
        user={
          currentUser
        }
        onLogout={
          handleLogout
        }
      />
    );
  }

  if (
    currentPage ===
    "client"
  ) {
    return (
      <ClientLayout
        user={
          currentUser
        }
        onLogout={
          handleLogout
        }
      />
    );
  }

  return (
    <Login
      onLogin={
        handleLogin
      }
    />
  );
}