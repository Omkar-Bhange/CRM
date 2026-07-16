import { useState } from "react";
import {
    Building2,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    CreditCard,
    FileText,
    KeyRound,
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

const companyInformation = {
    clientCode: "CL-1001",
    companyName: "Shree Ganesh Industries",
    contactPerson: "Ramesh Patil",
    designation: "Accounts Manager",
    email: "ramesh@shreeganesh.com",
    alternateEmail: "accounts@shreeganesh.com",
    mobile: "9876543210",
    alternateMobile: "9823012456",
    gstNo: "27ABCDE1234F1Z5",
    panNo: "ABCDE1234F",
    addressLine1: "Plot No. 18, MIDC Industrial Area",
    addressLine2: "Bhosari",
    city: "Pune",
    state: "Maharashtra",
    pinCode: "411026",
    country: "India",
    clientSince: "12 Mar 2022",
    accountStatus: "Active",
    billingContact: "Ramesh Patil",
    billingEmail: "accounts@shreeganesh.com",
    preferredContact: "Phone",
    supportLanguage: "English",
};

const purchasedProducts = [
    {
        id: 1,
        name: "NexERP",
        version: "v4.2",
        licenceUsers: 12,
        supportPlan: "Annual AMC",
        status: "Active",
    },
];

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
            className={`rounded-xl border border-slate-200 bg-slate-50/70 p-4 ${
                fullWidth ? "sm:col-span-2" : ""
            }`}
        >
            <div className="flex items-center gap-2 text-slate-400">
                <Icon size={14} />

                <p className="text-[9px] font-semibold uppercase tracking-[0.13em]">
                    {label}
                </p>
            </div>

            <p className="mt-2 break-words text-xs font-semibold text-slate-800">
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
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={18} />
                </div>
            </div>

            <p className="mt-4 text-[10px] text-slate-500">
                {description}
            </p>
        </article>
    );
}

export default function ClientProfile() {
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

    const submitPasswordChange = (event) => {
        event.preventDefault();

        if (
            !passwordForm.currentPassword ||
            !passwordForm.newPassword ||
            !passwordForm.confirmPassword
        ) {
            alert("Please complete all password fields.");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            alert(
                "New password must contain at least 8 characters."
            );
            return;
        }

        if (
            passwordForm.newPassword !==
            passwordForm.confirmPassword
        ) {
            alert(
                "New password and confirm password do not match."
            );
            return;
        }

        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });

        setPasswordOpen(false);

        alert(
            "Password change will be completed after authentication API integration."
        );
    };

    return (
        <div>
            <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">
                        Client Account
                    </p>

                    <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                        Company Profile
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Review your company details, contacts,
                        billing information and account security.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setChangeRequestOpen(true)
                    }
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-4 text-xs font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-cyan-600"
                >
                    <Send size={16} />
                    Request Profile Change
                </button>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Client Code"
                    value={companyInformation.clientCode}
                    description="Unique client account reference"
                    icon={Building2}
                    iconClass="bg-cyan-100 text-cyan-700"
                />

                <SummaryCard
                    label="Client Since"
                    value="Mar 2022"
                    description={companyInformation.clientSince}
                    icon={CalendarDays}
                    iconClass="bg-violet-100 text-violet-700"
                />

                <SummaryCard
                    label="Purchased Products"
                    value={purchasedProducts.length}
                    description="NexERP licence currently active"
                    icon={PackageCheck}
                    iconClass="bg-emerald-100 text-emerald-700"
                />

                <SummaryCard
                    label="Account Status"
                    value={companyInformation.accountStatus}
                    description="Client portal access enabled"
                    icon={ShieldCheck}
                    iconClass="bg-amber-100 text-amber-700"
                />
            </section>

            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="border-b border-slate-200 px-5 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                                <Building2 size={22} />
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="truncate text-lg font-semibold text-slate-950">
                                        {
                                            companyInformation.companyName
                                        }
                                    </h2>

                                    <StatusBadge
                                        status={
                                            companyInformation.accountStatus
                                        }
                                    />
                                </div>

                                <p className="mt-1 text-[10px] text-slate-500">
                                    {
                                        companyInformation.clientCode
                                    }{" "}
                                    · Client since{" "}
                                    {
                                        companyInformation.clientSince
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
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
                                    className={`h-9 rounded-lg px-3 text-[10px] font-semibold transition ${
                                        activeSection ===
                                        section.id
                                            ? "bg-[#0f172a] text-white"
                                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    {section.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6">
                    {activeSection === "company" && (
                        <div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Company Information
                                </h3>

                                <p className="mt-1 text-[10px] text-slate-500">
                                    Registered business and tax
                                    information
                                </p>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                                    value={`${companyInformation.addressLine1}, ${companyInformation.addressLine2}, ${companyInformation.city}, ${companyInformation.state} - ${companyInformation.pinCode}, ${companyInformation.country}`}
                                    icon={MapPin}
                                    fullWidth
                                />
                            </div>

                            <section className="mt-5 rounded-2xl border border-slate-200 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            Purchased Software
                                        </h3>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            Products linked to your
                                            company account
                                        </p>
                                    </div>

                                    <PackageCheck
                                        size={18}
                                        className="text-cyan-600"
                                    />
                                </div>

                                <div className="mt-4 space-y-3">
                                    {purchasedProducts.map(
                                        (product) => (
                                            <div
                                                key={product.id}
                                                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                                                        <PackageCheck
                                                            size={
                                                                18
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {
                                                                product.name
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-[9px] text-slate-500">
                                                            {
                                                                product.version
                                                            }{" "}
                                                            ·{" "}
                                                            {
                                                                product.licenceUsers
                                                            }{" "}
                                                            licensed
                                                            users
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="text-[10px] font-medium text-slate-500">
                                                        {
                                                            product.supportPlan
                                                        }
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
                        <div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Contact Information
                                </h3>

                                <p className="mt-1 text-[10px] text-slate-500">
                                    Primary communication details
                                </p>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                        <div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Billing Information
                                </h3>

                                <p className="mt-1 text-[10px] text-slate-500">
                                    Contact details used for invoices
                                    and AMC reminders
                                </p>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                                    value={`${companyInformation.addressLine1}, ${companyInformation.addressLine2}, ${companyInformation.city}, ${companyInformation.state} - ${companyInformation.pinCode}`}
                                    icon={MapPin}
                                    fullWidth
                                />
                            </div>

                            <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            Profile Change Requests
                                        </h3>

                                        <p className="mt-1 text-[10px] text-slate-500">
                                            Requests submitted to the
                                            admin team
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setChangeRequestOpen(
                                                true
                                            )
                                        }
                                        className="flex h-9 items-center gap-2 rounded-lg bg-[#0f172a] px-3 text-[10px] font-semibold text-white transition hover:bg-cyan-600"
                                    >
                                        <Send size={14} />
                                        New Request
                                    </button>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {savedRequests.map(
                                        (request) => (
                                            <div
                                                key={request.id}
                                                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        {
                                                            request.subject
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-[9px] text-slate-500">
                                                        {
                                                            request.requestNo
                                                        }{" "}
                                                        ·{" "}
                                                        {
                                                            request.requestType
                                                        }{" "}
                                                        ·{" "}
                                                        {
                                                            request.createdAt
                                                        }
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
                        <div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Account Security
                                </h3>

                                <p className="mt-1 text-[10px] text-slate-500">
                                    Password and client portal access
                                </p>
                            </div>

                            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                <section className="rounded-2xl border border-slate-200 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-950">
                                                Password
                                            </h4>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                Last changed 62 days ago
                                            </p>
                                        </div>

                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                            <LockKeyhole
                                                size={18}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPasswordOpen(true)
                                        }
                                        className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                                    >
                                        <KeyRound size={15} />
                                        Change Password
                                    </button>
                                </section>

                                <section className="rounded-2xl border border-slate-200 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-950">
                                                Portal Access
                                            </h4>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                Your client account is
                                                active
                                            </p>
                                        </div>

                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                            <ShieldCheck
                                                size={18}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
                                        <CheckCircle2
                                            size={16}
                                            className="text-emerald-600"
                                        />

                                        <p className="text-xs font-semibold text-emerald-700">
                                            Client portal access
                                            enabled
                                        </p>
                                    </div>
                                </section>
                            </div>

                            <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck
                                        size={18}
                                        className="mt-0.5 shrink-0 text-amber-700"
                                    />

                                    <div>
                                        <h4 className="text-sm font-semibold text-amber-900">
                                            Security recommendation
                                        </h4>

                                        <p className="mt-1 text-xs leading-5 text-amber-800/80">
                                            Use a unique password and
                                            do not share your client
                                            portal credentials with
                                            unauthorised users.
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
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-600">
                                    Client Request
                                </p>

                                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                                    Request Profile Change
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setChangeRequestOpen(false)
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form
                            onSubmit={submitChangeRequest}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4">
                                    <p className="text-xs font-semibold text-cyan-900">
                                        Admin approval required
                                    </p>

                                    <p className="mt-1 text-[10px] leading-5 text-cyan-700">
                                        Company master details are not
                                        changed directly. Your request
                                        will be reviewed by the admin.
                                    </p>
                                </div>

                                <div className="mt-5">
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                                            className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-xs outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
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
                                            size={16}
                                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-xs outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                                        rows={8}
                                        placeholder="Explain the current information and the changes that should be made..."
                                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-xs leading-5 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-3 border-t border-slate-200 p-5 sm:grid-cols-2 sm:px-6">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setChangeRequestOpen(false)
                                    }
                                    className="h-11 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f172a] text-xs font-semibold text-white transition hover:bg-cyan-600"
                                >
                                    <Send size={15} />
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

                    <div className="fixed left-1/2 top-1/2 z-[80] w-[calc(100%-32px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-600">
                                    Account Security
                                </p>

                                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                                    Change Password
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setPasswordOpen(false)
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <form
                            onSubmit={submitPasswordChange}
                            className="p-5"
                        >
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-xs outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                />
                            </div>

                            <div className="mt-4">
                                <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-xs outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                />

                                <p className="mt-2 text-[9px] text-slate-500">
                                    Use at least 8 characters.
                                </p>
                            </div>

                            <div className="mt-4">
                                <label className="mb-2 block text-xs font-semibold text-slate-700">
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
                                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-xs outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                />
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPasswordOpen(false)
                                    }
                                    className="h-11 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0f172a] text-xs font-semibold text-white transition hover:bg-cyan-600"
                                >
                                    <Save size={15} />
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}