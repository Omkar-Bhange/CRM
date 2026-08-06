import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

const API_URL = "http://localhost:5000";

const roles = [
  {
    id: "admin",
    label: "Admin",
    description: "Manage clients, billing, tickets and team",
    icon: ShieldCheck,
  },
  {
    id: "employee",
    label: "Employee",
    description: "View tasks, tickets and work activity",
    icon: Users,
  },
  {
    id: "client",
    label: "Client",
    description: "Raise issues and manage your software",
    icon: Building2,
  },
];

const features = [
  "Track client software and AMC renewals",
  "Manage support tickets from one workspace",
  "Monitor employee tasks and working time",
];

export default function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState(
    "admin@totalsolution.com"
  );

  const [password, setPassword] = useState("Admin@123");
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setLoginError("Please enter your email address.");
      return;
    }

    if (!password) {
      setLoginError("Please enter your password.");
      return;
    }

    if (!selectedRole) {
      setLoginError("Please select your role.");
      return;
    }

    try {
      setIsSubmitting(true);
      setLoginError("");

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
            role: selectedRole,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to sign in."
        );
      }

      const storage = keepSignedIn
        ? localStorage
        : sessionStorage;

      localStorage.removeItem("client-connect-token");
      localStorage.removeItem("client-connect-user");

      sessionStorage.removeItem("client-connect-token");
      sessionStorage.removeItem("client-connect-user");

      storage.setItem(
        "client-connect-token",
        result.token
      );

      storage.setItem(
  "client-connect-user",
  JSON.stringify(result.user)
);

onLogin(result.user.role, result.user);
    } catch (error) {
      console.error("Login error:", error);

      setLoginError(
        error.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6fb] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1500px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:min-h-[calc(100vh-40px)] lg:grid-cols-[1.08fr_0.92fr]">
        {/* Left Branding Section */}
        <section className="relative hidden overflow-hidden bg-[#111827] px-12 py-11 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

          <div className="absolute -right-20 bottom-12 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-950/30">
                <Sparkles size={21} />
              </div>

              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Client Connect
                </h1>

                <p className="text-xs text-slate-400">
                  Support and Work Management
                </p>
              </div>
            </div>

            <div className="mt-24 max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                <Headphones
                  size={14}
                  className="text-cyan-300"
                />

                One workspace for your entire company
              </div>

              <h2 className="text-5xl font-semibold leading-[1.12] tracking-[-0.04em]">
                Clients, support and employee work in one
                place.
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                Manage software clients, AMC payments,
                support issues, employee tasks and working
                time from a single professional platform.
              </p>

              <div className="mt-10 space-y-4">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm text-slate-300"
                  >
                    <CheckCircle2
                      size={19}
                      className="shrink-0 text-cyan-300"
                    />

                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-7 text-xs text-slate-500">
            <span>
              Built for growing software companies
            </span>

            <span>Secure workspace</span>
          </div>
        </section>

        {/* Right Login Section */}
        <section className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[520px]">
            <div className="mb-9 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-400 text-white">
                  <Sparkles size={21} />
                </div>

                <div>
                  <h1 className="font-semibold text-slate-900">
                    Client Connect
                  </h1>

                  <p className="text-xs text-slate-500">
                    Support and Work Management
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-violet-600">
                Welcome back
              </p>

              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                Sign in to your workspace
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Select your role and enter your account
                information.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-9"
            >
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-800">
                  Select role
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected =
                      selectedRole === role.id;

                    return (
                      <button
                        key={role.id}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setLoginError("");
                        }}
                        className={`group rounded-2xl border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                          isSelected
                            ? "border-violet-500 bg-violet-50 shadow-[0_8px_25px_rgba(109,40,217,0.10)]"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-violet-600 text-white"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          }`}
                        >
                          <Icon size={18} />
                        </div>

                        <p
                          className={`text-sm font-semibold ${
                            isSelected
                              ? "text-violet-700"
                              : "text-slate-800"
                          }`}
                        >
                          {role.label}
                        </p>

                        <p className="mt-1 hidden text-[11px] leading-4 text-slate-500 xl:block">
                          {role.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-7">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    disabled={isSubmitting}
                    autoComplete="email"
                    placeholder="name@company.com"
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setLoginError("");
                    }}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    value={password}
                    disabled={isSubmitting}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setLoginError("");
                    }}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    required
                  />

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {loginError}
                </div>
              )}

              <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setKeepSignedIn(
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                />

                Keep me signed in
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-violet-600 hover:shadow-violet-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-[#111827]"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to workspace
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <UserRound size={14} />

              <span>
                Access is controlled according to your
                selected role.
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
