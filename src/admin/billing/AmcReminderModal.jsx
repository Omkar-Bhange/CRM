import { useMemo, useState } from "react";
import {
    BellRing,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Mail,
    MessageCircleMore,
    Phone,
    Send,
    Smartphone,
    UserRound,
    X,
} from "lucide-react";

const reminderChannels = [
    {
        id: "WhatsApp",
        label: "WhatsApp",
        description: "Send payment reminder through WhatsApp.",
        icon: MessageCircleMore,
    },
    {
        id: "Email",
        label: "Email",
        description: "Send a formal AMC payment reminder by email.",
        icon: Mail,
    },
    {
        id: "SMS",
        label: "SMS",
        description: "Send a short reminder to the registered mobile number.",
        icon: Smartphone,
    },
    {
        id: "Phone Call",
        label: "Phone Call",
        description: "Record a manual payment follow-up call.",
        icon: Phone,
    },
];


function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));
}

function getDefaultMessage(record) {
    return `Dear ${record?.contactPerson || "Customer"
        }, this is a reminder that AMC payment of ${formatCurrency(
            record?.pendingAmount
        )} for ${record?.product || "your software"} is pending. Invoice ${record?.invoiceNo || "is available"
        } and the due date is ${record?.dueDate || "approaching"
        }. Kindly arrange payment at the earliest.`;
}

export default function AmcReminderModal({
    record,
    employees = [],
    onClose,
    onSubmit,
    saving = false,
}) {
    const [channel, setChannel] = useState("WhatsApp");
    const [message, setMessage] = useState(() =>
        getDefaultMessage(record)
    );
    const [followUpDate, setFollowUpDate] = useState("");
   const [
    assignedEmployeeId,
    setAssignedEmployeeId,
] = useState(
    record?.assignedEmployeeId || ""
);

    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");

    const selectedChannel = useMemo(
        () =>
            reminderChannels.find((item) => item.id === channel) ||
            reminderChannels[0],
        [channel]
    );

    if (!record) return null;

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!message.trim()) {
            setError("Please enter the reminder message.");
            return;
        }

        if (!followUpDate) {
            setError("Please select the next follow-up date.");
            return;
        }

       onSubmit({
    channel,

    message:
        message.trim(),

    followUpDate,

    assignedEmployeeId:
        assignedEmployeeId || "",

    notes:
        notes.trim(),
});
    };

    return (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Close reminder modal"
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            />

            <form
                onSubmit={handleSubmit}
                className="relative flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.32)]"
            >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                            <BellRing size={20} />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-slate-950">
                                Send AMC Reminder
                            </h2>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                Record a payment follow-up for {record.client}.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto p-6">
                    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Client
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-800">
                                {record.client}
                            </p>
                        </div>

                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Pending Amount
                            </p>

                            <p className="mt-1 text-xs font-semibold text-rose-700">
                                {formatCurrency(record.pendingAmount)}
                            </p>
                        </div>

                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                Due Date
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-800">
                                {record.dueDate}
                            </p>
                        </div>
                    </section>

                    <section>
                        <div className="mb-3">
                            <h3 className="text-sm font-semibold text-slate-950">
                                Reminder Channel
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Select how the client should be contacted.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {reminderChannels.map((item) => {
                                const Icon = item.icon;
                                const active = channel === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            setChannel(item.id);
                                            setError("");
                                        }}
                                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${active
                                                ? "border-violet-300 bg-violet-50 ring-4 ring-violet-50"
                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active
                                                    ? "bg-violet-600 text-white"
                                                    : "bg-slate-100 text-slate-500"
                                                }`}
                                        >
                                            <Icon size={18} />
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold text-slate-900">
                                                {item.label}
                                            </p>

                                            <p className="mt-1 text-[10px] leading-5 text-slate-500">
                                                {item.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-xs font-semibold text-slate-700">
                                Reminder message
                            </label>

                            <span className="text-[10px] text-slate-400">
                                {message.length} characters
                            </span>
                        </div>

                        <textarea
                            value={message}
                            onChange={(event) => {
                                setMessage(event.target.value);
                                if (error) setError("");
                            }}
                            rows={7}
                            placeholder="Enter reminder message..."
                            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />

                        <div className="mt-3 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            {(() => {
                                const SelectedChannelIcon = selectedChannel.icon;

                                return (
                                    <SelectedChannelIcon
                                        size={16}
                                        className="mt-0.5 shrink-0 text-violet-600"
                                    />
                                );
                            })()}

                            <p className="text-[10px] leading-5 text-slate-500">
                                This version records the reminder activity in the AMC
                                history. Actual WhatsApp, email and SMS delivery will be
                                connected later through backend services.
                            </p>
                        </div>
                    </section>

                    <section className="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                Next follow-up date <span className="text-rose-500">*</span>
                            </label>

                            <div className="relative">
                                <CalendarDays
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="date"
                                    value={followUpDate}
                                    onChange={(event) => {
                                        setFollowUpDate(event.target.value);
                                        if (error) setError("");
                                    }}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold text-slate-700">
                                Assigned employee
                            </label>

                            <div className="relative">
                                <UserRound
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                               <select
    value={assignedEmployeeId}
    onChange={(event) =>
        setAssignedEmployeeId(
            event.target.value
        )
    }
    disabled={saving}
    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
>
    <option value="">
        Keep current assignment
    </option>

    {employees.map(
        (employee) => (
            <option
                key={employee.id}
                value={employee.id}
            >
                {employee.name}

                {employee.employeeCode
                    ? ` (${employee.employeeCode})`
                    : ""}
            </option>
        )
    )}
</select>

                                <ChevronDown
                                    size={15}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                            Internal notes
                        </label>

                        <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            rows={3}
                            placeholder="Add call notes, customer response or follow-up instructions..."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </section>

                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Cancel
                    </button>

                   <button
    type="submit"
    disabled={saving}
    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
>
    <Send size={15} />

    {saving
        ? "Saving..."
        : channel === "Phone Call"
            ? "Save Call"
            : "Send Reminder"}
</button>
                </div>
            </form>
        </div>
    );
}