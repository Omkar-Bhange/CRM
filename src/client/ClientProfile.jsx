import { useState } from "react";
import API_URL from "../config/api";
import {
    AlertCircle,
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    CreditCard,
    FileText,
    KeyRound,
    Loader2,
    LockKeyhole,
    Mail,
    MapPin,
    PackageCheck,
    Phone,
    Save,
    Send,
    ShieldCheck,
    UserRound,
    Users,
    X,
} from "lucide-react";



const emptyChangeRequest = {
    requestType: "Contact Information",
    subject: "",
    description: "",
};

function StatusBadge({ status }) {
    const styles = {
        Active:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Pending:
            "bg-amber-50 text-amber-700 ring-amber-600/10",
        Inactive:
            "bg-slate-100 text-slate-600 ring-slate-500/10",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                styles[status] ||
                "bg-slate-100 text-slate-600 ring-slate-500/10"
            }`}
        >
            {status}
        </span>
    );
}

function InformationItem({
    label,
    value,
    icon: Icon,
    fullWidth = false,
}) {
    return (
        <div
            className={`rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5 ${
                fullWidth ? "sm:col-span-2" : ""
            }`}
        >
            <div className="flex items-center gap-1.5 text-slate-400">
                <Icon size={13} />

                <p className="text-[10px] font-bold uppercase tracking-wider">
                    {label}
                </p>
            </div>

            <p className="mt-1 break-words text-xs font-bold text-slate-800">
                {value || "Not available"}
            </p>
        </div>
    );
}

function SummaryCard({
    label,
    value,
    description,
    icon: Icon,
    iconClass,
}) {
    return (
        <article className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
                >
                    <Icon size={16} />
                </div>
            </div>

            <p className="mt-1.5 text-[11px] text-slate-500 truncate">
                {description}
            </p>
        </article>
    );
}

export default function ClientProfile({ client }) {
    const [activeSection, setActiveSection] =
        useState("company");

    const [changeRequestOpen, setChangeRequestOpen] =
        useState(false);

    const [passwordOpen, setPasswordOpen] =
        useState(false);

    const [changeRequest, setChangeRequest] =
        useState(emptyChangeRequest);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    const getAuthToken = () => {
        return (
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token") ||
            ""
        );
    };


    const [savedRequests, setSavedRequests] = useState([
        {
            id: 1,
            requestNo: "REQ-1007",
            requestType: "Billing Information",
            subject: "Update billing email",
            status: "Pending",
            createdAt: "14 Jul 2026",
        },
    ]);
    
    const companyInformation = {
  clientCode: client?.clientCode || "",
  companyName: client?.companyName || "",
  contactPerson: client?.contactPerson || "",
  designation: client?.designation || "",
  email: client?.email || "",
  alternateEmail: client?.alternateEmail || "",
  mobile: client?.mobile || "",
  alternateMobile: client?.alternateMobile || "",
  gstNo: client?.gstNo || "",
  panNo: client?.panNo || "",
  addressLine1: client?.addressLine1 || "",
  addressLine2: client?.addressLine2 || "",
  city: client?.city || "",
  state: client?.state || "",
  pinCode: client?.pinCode || "",
  country: client?.country || "India",
  clientSince: client?.createdAt
    ? new Date(client.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "",
  accountStatus: client?.status || "Active",
  billingContact: client?.billingContact || client?.contactPerson || "",
  billingEmail: client?.billingEmail || client?.email || "",
  preferredContact: client?.preferredContact || "Phone",
  supportLanguage: client?.supportLanguage || "English",
};

const purchasedProducts = (client?.products || []).map((product) => ({
  id: product._id || product.productId,
  name: product.productName,
  version: product.version || "v1.0.0",
  licenceUsers: product.licensedUsers || 0,
  supportPlan: product.supportType || "Standard",
  status:
    product.installationStatus === "Inactive"
      ? "Inactive"
      : "Active",
}));
    const handleChangeRequestInput = (event) => {
        const { name, value } = event.target;

        setChangeRequest((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handlePasswordInput = (event) => {
        const { name, value } = event.target;

        setPasswordForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const submitChangeRequest = (event) => {
        event.preventDefault();

        if (
            !changeRequest.subject.trim() ||
            !changeRequest.description.trim()
        ) {
            alert(
                "Please enter the request subject and description."
            );
            return;
        }

        const nextRequestNumber = `REQ-${1007 + savedRequests.length}`;

        const newRequest = {
            id: Date.now(),
            requestNo: nextRequestNumber,
            requestType: changeRequest.requestType,
            subject: changeRequest.subject.trim(),
            status: "Pending",
            createdAt: new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }),
        };

        setSavedRequests((current) => [
            newRequest,
            ...current,
        ]);

        setChangeRequest(emptyChangeRequest);
        setChangeRequestOpen(false);

        alert(
            "Your profile change request has been submitted."
        );
    };

    const submitPasswordChange = async (event) => {
        event.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        if (
            !passwordForm.currentPassword ||
            !passwordForm.newPassword ||
            !passwordForm.confirmPassword
        ) {
            setPasswordError("Please complete all password fields.");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError("New password must contain at least 6 characters.");
            return;
        }

        if (
            passwordForm.newPassword !==
            passwordForm.confirmPassword
        ) {
            setPasswordError("New password and confirm password do not match.");
            return;
        }

        try {
            setPasswordLoading(true);
            const token = getAuthToken();
            const response = await fetch(`${API_URL}/api/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setPasswordSuccess(data.message || "Password updated successfully.");
                setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
                setTimeout(() => {
                    setPasswordOpen(false);
                    setPasswordSuccess("");
                }, 1500);
            } else {
                setPasswordError(data.message || "Failed to update password. Please check your current password.");
            }
        } catch (err) {
            setPasswordError("Network error. Unable to change password right now.");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <section className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                            Client Account
                        </span>
                        <span className="text-xs text-slate-400">Total Solution Portal</span>
                    </div>

                    <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                        Company Profile
                    </h1>

                    <p className="mt-0.5 text-xs text-slate-500">
                        Review your company details, contacts, billing information and account security.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setChangeRequestOpen(true)
                    }
                    className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-3.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                >
                    <Send size={14} />
                    Request Profile Change
                </button>
            </section>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <SummaryCard
                    label="Client Code"
                    value={companyInformation.clientCode}
                    description="Unique client account reference"
                    icon={Building2}
                    iconClass="bg-blue-50 text-[#1B59F8]"
                />

                <SummaryCard
                    label="Client Since"
                    value={companyInformation.clientSince || "Mar 2022"}
                    description="Registered client on platform"
                    icon={CalendarDays}
                    iconClass="bg-indigo-50 text-indigo-600"
                />

                <SummaryCard
                    label="Purchased Products"
                    value={purchasedProducts.length}
                    description="Active software licences"
                    icon={PackageCheck}
                    iconClass="bg-emerald-50 text-emerald-600"
                />

                <SummaryCard
                    label="Account Status"
                    value={companyInformation.accountStatus}
                    description="Client portal access enabled"
                    icon={ShieldCheck}
                    iconClass="bg-amber-50 text-amber-600"
                />
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="border-b border-slate-200/90 p-3.5 sm:px-4 sm:py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1B59F8]">
                                <Building2 size={18} />
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="truncate text-sm font-bold text-slate-900">
                                        {companyInformation.companyName}
                                    </h2>

                                    <StatusBadge
                                        status={
                                            companyInformation.accountStatus
                                        }
                                    />
                                </div>

                                <p className="text-[11px] text-slate-400">
                                    {companyInformation.clientCode} · Client since {companyInformation.clientSince || "Mar 2022"}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {[
                                {
                                    id: "company",
                                    label: "Company",
                                },
                                {
                                    id: "contact",
                                    label: "Contacts",
                                },
                                {
                                    id: "billing",
                                    label: "Billing",
                                },
                                {
                                    id: "security",
                                    label: "Security",
                                },
                            ].map((section) => (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() =>
                                        setActiveSection(
                                            section.id
                                        )
                                    }
                                    className={`h-7.5 rounded-lg px-3 text-xs font-semibold transition ${
                                        activeSection ===
                                        section.id
                                            ? "bg-[#1B59F8] text-white shadow-2xs"
                                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    {section.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-3.5 sm:p-4">
                    {activeSection === "company" && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                    Company Information
                                </h3>

                                <p className="text-[11px] text-slate-400">
                                    Registered business and tax information
                                </p>
                            </div>

                            <div className="grid gap-2.5 sm:grid-cols-2">
                                <InformationItem
                                    label="Company Name"
                                    value={
                                        companyInformation.companyName
                                    }
                                    icon={Building2}
                                />

                                <InformationItem
                                    label="Client Code"
                                    value={
                                        companyInformation.clientCode
                                    }
                                    icon={FileText}
                                />

                                <InformationItem
                                    label="GST Number"
                                    value={
                                        companyInformation.gstNo
                                    }
                                    icon={CreditCard}
                                />

                                <InformationItem
                                    label="PAN Number"
                                    value={
                                        companyInformation.panNo
                                    }
                                    icon={FileText}
                                />

                                <InformationItem
                                    label="Registered Address"
                                    value={`${companyInformation.addressLine1 || ""}, ${companyInformation.addressLine2 || ""}, ${companyInformation.city || ""}, ${companyInformation.state || ""} - ${companyInformation.pinCode || ""}, ${companyInformation.country || "India"}`}
                                    icon={MapPin}
                                    fullWidth
                                />
                            </div>

                            <section className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                            Purchased Software
                                        </h3>

                                        <p className="text-[11px] text-slate-400">
                                            Products linked to your company account
                                        </p>
                                    </div>

                                    <PackageCheck
                                        size={16}
                                        className="text-[#1B59F8]"
                                    />
                                </div>

                                <div className="mt-3 space-y-2">
                                    {purchasedProducts.map(
                                        (product) => (
                                            <div
                                                key={product.id}
                                                className="flex flex-col gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#1B59F8]">
                                                        <PackageCheck
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900">
                                                            {product.name}
                                                        </p>

                                                        <p className="text-[10px] text-slate-500">
                                                            {product.version} · {product.licenceUsers} licensed users
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] font-medium text-slate-500">
                                                        {product.supportPlan}
                                                    </span>

                                                    <StatusBadge
                                                        status={
                                                            product.status
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeSection === "contact" && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                    Contact Information
                                </h3>

                                <p className="text-[11px] text-slate-400">
                                    Primary communication details
                                </p>
                            </div>

                            <div className="grid gap-2.5 sm:grid-cols-2">
                                <InformationItem
                                    label="Contact Person"
                                    value={
                                        companyInformation.contactPerson
                                    }
                                    icon={UserRound}
                                />

                                <InformationItem
                                    label="Designation"
                                    value={
                                        companyInformation.designation
                                    }
                                    icon={Users}
                                />

                                <InformationItem
                                    label="Primary Email"
                                    value={
                                        companyInformation.email
                                    }
                                    icon={Mail}
                                />

                                <InformationItem
                                    label="Alternate Email"
                                    value={
                                        companyInformation.alternateEmail
                                    }
                                    icon={Mail}
                                />

                                <InformationItem
                                    label="Primary Mobile"
                                    value={
                                        companyInformation.mobile
                                    }
                                    icon={Phone}
                                />

                                <InformationItem
                                    label="Alternate Mobile"
                                    value={
                                        companyInformation.alternateMobile
                                    }
                                    icon={Phone}
                                />

                                <InformationItem
                                    label="Preferred Contact"
                                    value={
                                        companyInformation.preferredContact
                                    }
                                    icon={Phone}
                                />

                                <InformationItem
                                    label="Support Language"
                                    value={
                                        companyInformation.supportLanguage
                                    }
                                    icon={UserRound}
                                />
                            </div>
                        </div>
                    )}

                    {activeSection === "billing" && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                    Billing Information
                                </h3>

                                <p className="text-[11px] text-slate-400">
                                    Contact details used for invoices and AMC reminders
                                </p>
                            </div>

                            <div className="grid gap-2.5 sm:grid-cols-2">
                                <InformationItem
                                    label="Billing Contact"
                                    value={
                                        companyInformation.billingContact
                                    }
                                    icon={UserRound}
                                />

                                <InformationItem
                                    label="Billing Email"
                                    value={
                                        companyInformation.billingEmail
                                    }
                                    icon={Mail}
                                />

                                <InformationItem
                                    label="GST Number"
                                    value={
                                        companyInformation.gstNo
                                    }
                                    icon={CreditCard}
                                />

                                <InformationItem
                                    label="PAN Number"
                                    value={
                                        companyInformation.panNo
                                    }
                                    icon={FileText}
                                />

                                <InformationItem
                                    label="Billing Address"
                                    value={`${companyInformation.addressLine1 || ""}, ${companyInformation.addressLine2 || ""}, ${companyInformation.city || ""}, ${companyInformation.state || ""} - ${companyInformation.pinCode || ""}`}
                                    icon={MapPin}
                                    fullWidth
                                />
                            </div>

                            <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs">
                                <div className="flex items-center justify-between border-b border-slate-200/90 bg-slate-50/50 p-3 sm:px-4">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                            Profile Change Requests
                                        </h3>

                                        <p className="text-[11px] text-slate-400">
                                            Requests submitted to the admin team
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setChangeRequestOpen(
                                                true
                                            )
                                        }
                                        className="flex h-7.5 items-center gap-1.5 rounded-lg bg-[#1B59F8] px-3 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                                    >
                                        <Send size={13} />
                                        New Request
                                    </button>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {savedRequests.map(
                                        (request) => (
                                            <div
                                                key={request.id}
                                                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">
                                                        {request.subject}
                                                    </p>

                                                    <p className="text-[10px] text-slate-400">
                                                        {request.requestNo} · {request.requestType} · {request.createdAt}
                                                    </p>
                                                </div>

                                                <StatusBadge
                                                    status={
                                                        request.status
                                                    }
                                                />
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeSection === "security" && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                    Account Security
                                </h3>

                                <p className="text-[11px] text-slate-400">
                                    Password and client portal access
                                </p>
                            </div>

                            <div className="grid gap-3 lg:grid-cols-2">
                                <section className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900">
                                                Password
                                            </h4>

                                            <p className="mt-0.5 text-[11px] text-slate-400">
                                                Last changed 62 days ago
                                            </p>
                                        </div>

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                            <LockKeyhole
                                                size={16}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPasswordOpen(true)
                                        }
                                        className="mt-3.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#1B59F8]"
                                    >
                                        <KeyRound size={13} />
                                        Change Password
                                    </button>
                                </section>

                                <section className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900">
                                                Portal Access
                                            </h4>

                                            <p className="mt-0.5 text-[11px] text-slate-400">
                                                Your client account is active
                                            </p>
                                        </div>

                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                            <ShieldCheck
                                                size={16}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3.5 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-100">
                                        <CheckCircle2
                                            size={14}
                                            className="text-emerald-600 shrink-0"
                                        />

                                        <p className="text-xs font-semibold text-emerald-800">
                                            Client portal access enabled
                                        </p>
                                    </div>
                                </section>
                            </div>

                            <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                                <div className="flex items-start gap-2.5">
                                    <ShieldCheck
                                        size={16}
                                        className="mt-0.5 shrink-0 text-amber-700"
                                    />

                                    <div>
                                        <h4 className="text-xs font-bold text-amber-900">
                                            Security recommendation
                                        </h4>

                                        <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800/90">
                                            Use a unique password and do not share your client portal credentials with unauthorised users.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </section>

            {changeRequestOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close profile change form"
                        onClick={() =>
                            setChangeRequestOpen(false)
                        }
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[620px] flex-col bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.18)]">
                        <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-3.5 sm:px-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                                    Client Request
                                </p>

                                <h2 className="mt-0.5 text-base font-bold text-slate-900">
                                    Request Profile Change
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setChangeRequestOpen(false)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form
                            onSubmit={submitChangeRequest}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                                    <p className="text-xs font-bold text-blue-950">
                                        Admin approval required
                                    </p>

                                    <p className="mt-0.5 text-[11px] leading-relaxed text-blue-700">
                                        Company master details are not changed directly. Your request will be reviewed and verified by the admin team.
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        Request Type
                                    </label>

                                    <div className="relative">
                                        <select
                                            name="requestType"
                                            value={
                                                changeRequest.requestType
                                            }
                                            onChange={
                                                handleChangeRequestInput
                                            }
                                            className="h-8.5 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="Contact Information">
                                                Contact Information
                                            </option>

                                            <option value="Billing Information">
                                                Billing Information
                                            </option>

                                            <option value="Registered Address">
                                                Registered Address
                                            </option>

                                            <option value="GST Information">
                                                GST Information
                                            </option>

                                            <option value="Authorised User">
                                                Authorised User
                                            </option>

                                            <option value="Other">
                                                Other
                                            </option>
                                        </select>

                                        <ChevronDown
                                            size={14}
                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        Subject
                                    </label>

                                    <input
                                        name="subject"
                                        value={
                                            changeRequest.subject
                                        }
                                        onChange={
                                            handleChangeRequestInput
                                        }
                                        placeholder="Example: Update primary contact number"
                                        className="h-8.5 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        Requested Changes
                                    </label>

                                    <textarea
                                        name="description"
                                        value={
                                            changeRequest.description
                                        }
                                        onChange={
                                            handleChangeRequestInput
                                        }
                                        rows={6}
                                        placeholder="Explain the current information and the changes that should be made..."
                                        className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs leading-relaxed text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 border-t border-slate-200/90 p-4 sm:px-6">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setChangeRequestOpen(false)
                                    }
                                    className="h-8.5 px-4 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700"
                                >
                                    <Send size={13} />
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </aside>
                </>
            )}

            {passwordOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close password form"
                        onClick={() =>
                            setPasswordOpen(false)
                        }
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm"
                    />

                    <div className="fixed left-1/2 top-1/2 z-[80] w-[calc(100%-32px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200/90 px-5 py-3.5">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1B59F8]">
                                    Account Security
                                </p>

                                <h2 className="mt-0.5 text-base font-bold text-slate-900">
                                    Change Password
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setPasswordOpen(false)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form
                            onSubmit={submitPasswordChange}
                            className="p-4 sm:p-5 space-y-3"
                        >
                            {passwordError && (
                                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                                    <span>{passwordSuccess}</span>
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    Current Password
                                </label>

                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={
                                        passwordForm.currentPassword
                                    }
                                    onChange={
                                        handlePasswordInput
                                    }
                                    className="h-8.5 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    New Password
                                </label>

                                <input
                                    type="password"
                                    name="newPassword"
                                    value={
                                        passwordForm.newPassword
                                    }
                                    onChange={
                                        handlePasswordInput
                                    }
                                    className="h-8.5 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                                />

                                <p className="mt-1 text-[10px] text-slate-400">
                                    Use at least 6 characters.
                                </p>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                    Confirm New Password
                                </label>

                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={
                                        passwordForm.confirmPassword
                                    }
                                    onChange={
                                        handlePasswordInput
                                    }
                                    className="h-8.5 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#1B59F8] focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    disabled={passwordLoading}
                                    onClick={() => {
                                        setPasswordOpen(false);
                                        setPasswordError("");
                                        setPasswordSuccess("");
                                    }}
                                    className="h-8.5 px-4 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-[#1B59F8] px-4 text-xs font-semibold text-white shadow-2xs transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {passwordLoading ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={13} />
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}