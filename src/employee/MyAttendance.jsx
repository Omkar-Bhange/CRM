import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Coffee,
    FileText,
    LogIn,
    LogOut,
    Plus,
    Timer,
    UserCheck,
    X,
    XCircle,
} from "lucide-react";

const initialAttendanceHistory = [
    {
        id: 1,
        date: "2026-07-14",
        loginTime: "09:02",
        logoutTime: "",
        breakMinutes: 35,
        workedMinutes: 422,
        status: "Present",
    },
    {
        id: 2,
        date: "2026-07-13",
        loginTime: "08:58",
        logoutTime: "18:05",
        breakMinutes: 45,
        workedMinutes: 502,
        status: "Present",
    },
    {
        id: 3,
        date: "2026-07-11",
        loginTime: "09:18",
        logoutTime: "18:10",
        breakMinutes: 42,
        workedMinutes: 490,
        status: "Late",
    },
    {
        id: 4,
        date: "2026-07-10",
        loginTime: "09:01",
        logoutTime: "18:00",
        breakMinutes: 50,
        workedMinutes: 489,
        status: "Present",
    },
    {
        id: 5,
        date: "2026-07-09",
        loginTime: "09:05",
        logoutTime: "14:05",
        breakMinutes: 25,
        workedMinutes: 275,
        status: "Half Day",
    },
    {
        id: 6,
        date: "2026-07-08",
        loginTime: "09:00",
        logoutTime: "18:08",
        breakMinutes: 45,
        workedMinutes: 503,
        status: "Present",
    },
];

const monthlyAttendance = {
    "2026-07-01": "Present",
    "2026-07-02": "Present",
    "2026-07-03": "Present",
    "2026-07-04": "Half Day",
    "2026-07-06": "Present",
    "2026-07-07": "Present",
    "2026-07-08": "Present",
    "2026-07-09": "Half Day",
    "2026-07-10": "Present",
    "2026-07-11": "Late",
    "2026-07-13": "Present",
    "2026-07-14": "Present",
};

const leaveBalances = [
    {
        id: 1,
        name: "Casual Leave",
        code: "CL",
        total: 12,
        used: 3,
        colorClass: "bg-violet-500",
        badgeClass: "bg-violet-50 text-violet-700",
    },
    {
        id: 2,
        name: "Sick Leave",
        code: "SL",
        total: 8,
        used: 1,
        colorClass: "bg-blue-500",
        badgeClass: "bg-blue-50 text-blue-700",
    },
    {
        id: 3,
        name: "Earned Leave",
        code: "EL",
        total: 15,
        used: 4,
        colorClass: "bg-emerald-500",
        badgeClass: "bg-emerald-50 text-emerald-700",
    },
];

const initialLeaveRequests = [
    {
        id: 1,
        leaveType: "Casual Leave",
        fromDate: "2026-07-21",
        toDate: "2026-07-22",
        days: 2,
        reason: "Family function",
        appliedOn: "2026-07-13",
        status: "Pending",
        reviewNote: "",
    },
    {
        id: 2,
        leaveType: "Sick Leave",
        fromDate: "2026-06-18",
        toDate: "2026-06-18",
        days: 1,
        reason: "Medical appointment",
        appliedOn: "2026-06-16",
        status: "Approved",
        reviewNote: "Approved by administrator.",
    },
    {
        id: 3,
        leaveType: "Casual Leave",
        fromDate: "2026-05-10",
        toDate: "2026-05-10",
        days: 1,
        reason: "Personal work",
        appliedOn: "2026-05-08",
        status: "Rejected",
        reviewNote: "Client deployment was scheduled on the same date.",
    },
];

const officeSettings = {
    startTime: "09:00",
    endTime: "18:00",
    lateAfter: "09:10",
    fullDayMinutes: 480,
};

const emptyLeaveForm = {
    leaveType: "Casual Leave",
    fromDate: "",
    toDate: "",
    reason: "",
    contactDuringLeave: "",
};

function parseDate(value) {
    if (!value) return null;

    const date = new Date(`${value}T00:00:00`);

    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
    const date = parseDate(value);

    if (!date) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatTime(value) {
    if (!value) return "—";

    const [hours, minutes] = value.split(":").map(Number);
    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDuration(minutes) {
    const safeMinutes = Math.max(Number(minutes || 0), 0);
    const hours = Math.floor(safeMinutes / 60);
    const remainingMinutes = safeMinutes % 60;

    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;

    return `${hours}h ${remainingMinutes}m`;
}

function calculateLeaveDays(fromDate, toDate) {
    const from = parseDate(fromDate);
    const to = parseDate(toDate);

    if (!from || !to || to < from) return 0;

    const difference = to.getTime() - from.getTime();

    return Math.floor(difference / 86400000) + 1;
}

function getCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let index = 0; index < firstDay.getDay(); index += 1) {
        days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
        days.push(new Date(year, month, day));
    }

    return days;
}

function getAttendanceStatusClasses(status) {
    const styles = {
        Present: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Late: "bg-amber-50 text-amber-700 ring-amber-600/10",
        "Half Day": "bg-blue-50 text-blue-700 ring-blue-600/10",
        Absent: "bg-rose-50 text-rose-700 ring-rose-600/10",
        "On Leave": "bg-violet-50 text-violet-700 ring-violet-600/10",
    };

    return (
        styles[status] ||
        "bg-slate-100 text-slate-600 ring-slate-500/10"
    );
}

function getLeaveStatusClasses(status) {
    const styles = {
        Pending: "bg-amber-50 text-amber-700 ring-amber-600/10",
        Approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Rejected: "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return (
        styles[status] ||
        "bg-slate-100 text-slate-600 ring-slate-500/10"
    );
}

function SummaryCard({
    label,
    value,
    description,
    icon: Icon,
    iconClass,
    descriptionClass = "text-slate-500",
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

            <p className={`mt-4 text-xs ${descriptionClass}`}>
                {description}
            </p>
        </div>
    );
}

export default function MyAttendance() {
    const API_URL = "http://localhost:5000";
    const getAuthToken = () =>
        localStorage.getItem("client-connect-token") ||
        sessionStorage.getItem("client-connect-token") ||
        "";
    const toTimeInput = (value) => {
        if (!value) return "";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? String(value).slice(0, 5) : date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    };
    const normalizeAttendance = (record) => ({
        ...record,
        id: record._id,
        loginTime: toTimeInput(record.loginTime),
        logoutTime: toTimeInput(record.logoutTime),
        workedMinutes: Number(record.workingMinutes || 0),
    });
    const [activeTab, setActiveTab] = useState("today");
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);

    const [attendanceStatus, setAttendanceStatus] =
        useState("Absent");
    const [loginTime, setLoginTime] = useState("");
    const [logoutTime, setLogoutTime] = useState("");
    const [breakActive, setBreakActive] = useState(false);
    const [breakMinutes, setBreakMinutes] = useState(0);

    const [calendarDate, setCalendarDate] = useState(
        new Date()
    );

    const [leaveDrawerOpen, setLeaveDrawerOpen] = useState(false);
    const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);

    const workedMinutes = useMemo(() => {
        const today = attendanceHistory.find(
            (record) => record.date === new Date().toISOString().slice(0, 10)
        );
        return Number(today?.workedMinutes || 0);
    }, [attendanceHistory]);

    const monthlySummary = useMemo(() => {
        const monthKey = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}`;
        const statuses = attendanceHistory
            .filter((record) => record.date?.startsWith(monthKey))
            .map((record) => record.status);

        return {
            present: statuses.filter(
                (status) => status === "Present"
            ).length,
            late: statuses.filter((status) => status === "Late")
                .length,
            halfDay: statuses.filter(
                (status) => status === "Half Day"
            ).length,
            absent: statuses.filter(
                (status) => status === "Absent"
            ).length,
            leave: statuses.filter(
                (status) => status === "On Leave"
            ).length,
        };
    }, [attendanceHistory, calendarDate]);

    const averageHours = useMemo(() => {
        const completedRecords = attendanceHistory.filter(
            (record) => record.logoutTime
        );

        if (completedRecords.length === 0) return "0h";

        const total = completedRecords.reduce(
            (sum, record) => sum + record.workedMinutes,
            0
        );

        return formatDuration(
            Math.round(total / completedRecords.length)
        );
    }, [attendanceHistory]);

    const calendarDays = getCalendarDays(
        calendarDate.getFullYear(),
        calendarDate.getMonth()
    );

    const requestedLeaveDays = calculateLeaveDays(
        leaveForm.fromDate,
        leaveForm.toDate
    );

    const loadData = async () => {
        const headers = { Authorization: `Bearer ${getAuthToken()}` };
        const [todayResponse, historyResponse, leaveResponse] = await Promise.all([
            fetch(`${API_URL}/api/admin/attendance/today`, { headers }),
            fetch(`${API_URL}/api/admin/attendance/me`, { headers }),
            fetch(`${API_URL}/api/admin/leave/my`, { headers }),
        ]);
        const [today, history, leaves] = await Promise.all([todayResponse.json(), historyResponse.json(), leaveResponse.json()]);
        if (!todayResponse.ok || !historyResponse.ok || !leaveResponse.ok) {
            throw new Error(today.message || history.message || leaves.message || "Unable to load attendance.");
        }
        const current = today.data ? normalizeAttendance(today.data) : null;
        setAttendanceHistory((history.data || []).map(normalizeAttendance));
        setLeaveRequests((leaves.data || []).map((leave) => ({ ...leave, id: leave._id, appliedOn: leave.appliedAt?.slice(0, 10) })));
        setAttendanceStatus(current?.workStatus || "Absent");
        setLoginTime(current?.loginTime || "");
        setLogoutTime(current?.logoutTime || "");
        setBreakMinutes(Number(current?.breakMinutes || 0));
    };

    useEffect(() => {
        loadData().catch((error) => console.error("Attendance:", error));
    }, []);

    const handleAttendanceToggle = async () => {
        const endpoint = attendanceStatus === "Working" ? "check-out" : "check-in";
        try {
            const response = await fetch(`${API_URL}/api/admin/attendance/${endpoint}`, {
                method: endpoint === "check-in" ? "POST" : "PUT",
                headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Attendance update failed.");
            await loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleBreakToggle = () => {
        if (attendanceStatus !== "Working") return;

        setBreakActive((current) => !current);
    };

    const changeCalendarMonth = (direction) => {
        setCalendarDate(
            (current) =>
                new Date(
                    current.getFullYear(),
                    current.getMonth() + direction,
                    1
                )
        );
    };

    const handleLeaveFormChange = (event) => {
        const { name, value } = event.target;

        setLeaveForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const closeLeaveDrawer = () => {
        setLeaveDrawerOpen(false);
        setLeaveForm(emptyLeaveForm);
    };

    const submitLeaveRequest = async (event) => {
        event.preventDefault();

        if (!leaveForm.fromDate || !leaveForm.toDate) {
            alert("Please select leave dates.");
            return;
        }

        if (requestedLeaveDays <= 0) {
            alert("Leave end date must be after the start date.");
            return;
        }

        if (!leaveForm.reason.trim()) {
            alert("Please enter the reason for leave.");
            return;
        }

        const selectedBalance = leaveBalances.find(
            (leave) => leave.name === leaveForm.leaveType
        );

        const remainingBalance = selectedBalance
            ? selectedBalance.total - selectedBalance.used
            : 0;

        if (
            selectedBalance &&
            requestedLeaveDays > remainingBalance
        ) {
            alert(
                `Only ${remainingBalance} day(s) are available for ${leaveForm.leaveType}.`
            );
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/leave`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify({ leaveType: leaveForm.leaveType, fromDate: leaveForm.fromDate, toDate: leaveForm.toDate, days: requestedLeaveDays, reason: leaveForm.reason.trim() }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to submit leave request.");
            await loadData();
            closeLeaveDrawer();
            setActiveTab("leave");
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Employee Workspace
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        My Attendance & Leave
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Track attendance, working hours, breaks and
                        personal leave requests.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setLeaveDrawerOpen(true)}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                >
                    <Plus size={15} />
                    Apply for Leave
                </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Today Worked"
                    value={formatDuration(workedMinutes)}
                    description={`Target ${formatDuration(
                        officeSettings.fullDayMinutes
                    )}`}
                    icon={Clock3}
                    iconClass="bg-cyan-100 text-cyan-700"
                    descriptionClass="text-cyan-700"
                />

                <SummaryCard
                    label="Login Time"
                    value={formatTime(loginTime)}
                    description={`Office starts at ${formatTime(
                        officeSettings.startTime
                    )}`}
                    icon={LogIn}
                    iconClass="bg-emerald-100 text-emerald-700"
                    descriptionClass="text-emerald-600"
                />

                <SummaryCard
                    label="Break Time"
                    value={formatDuration(breakMinutes)}
                    description={
                        breakActive
                            ? "Break currently active"
                            : "Recorded today"
                    }
                    icon={Coffee}
                    iconClass="bg-amber-100 text-amber-700"
                    descriptionClass={
                        breakActive
                            ? "text-amber-700"
                            : "text-slate-500"
                    }
                />

                <SummaryCard
                    label="Average Hours"
                    value={averageHours}
                    description="Based on completed attendance records"
                    icon={Timer}
                    iconClass="bg-violet-100 text-violet-700"
                    descriptionClass="text-violet-600"
                />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
                        {[
                            {
                                id: "today",
                                label: "Today",
                            },
                            {
                                id: "history",
                                label: "Attendance History",
                            },
                            {
                                id: "calendar",
                                label: "Monthly Calendar",
                            },
                            {
                                id: "leave",
                                label: "Leave & Balance",
                            },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap rounded-lg px-4 py-2 text-[11px] font-semibold transition ${
                                    activeTab === tab.id
                                        ? "bg-white text-slate-950 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <span
                        className={`inline-flex w-fit rounded-full px-3 py-1.5 text-[10px] font-bold ring-1 ring-inset ${
                            attendanceStatus === "Working"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                                : "bg-slate-100 text-slate-600 ring-slate-500/10"
                        }`}
                    >
                        {attendanceStatus}
                    </span>
                </div>

                {activeTab === "today" && (
                    <div className="p-5">
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
                            <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                            Current Attendance
                                        </p>

                                        <h3 className="mt-2 text-xl font-semibold text-slate-950">
                                            Tuesday, 14 July 2026
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Office hours{" "}
                                            {formatTime(
                                                officeSettings.startTime
                                            )}{" "}
                                            to{" "}
                                            {formatTime(
                                                officeSettings.endTime
                                            )}
                                        </p>
                                    </div>

                                    <span
                                        className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ring-1 ring-inset ${
                                            loginTime >
                                            officeSettings.lateAfter
                                                ? "bg-amber-50 text-amber-700 ring-amber-600/10"
                                                : "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                                        }`}
                                    >
                                        {loginTime >
                                        officeSettings.lateAfter
                                            ? "Late Arrival"
                                            : "On Time"}
                                    </span>
                                </div>

                                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <LogIn size={15} />

                                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                                Login
                                            </p>
                                        </div>

                                        <p className="mt-3 text-lg font-semibold text-slate-950">
                                            {formatTime(loginTime)}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-center gap-2 text-rose-600">
                                            <LogOut size={15} />

                                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                                Logout
                                            </p>
                                        </div>

                                        <p className="mt-3 text-lg font-semibold text-slate-950">
                                            {formatTime(logoutTime)}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-center gap-2 text-violet-600">
                                            <Timer size={15} />

                                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                                                Productive Time
                                            </p>
                                        </div>

                                        <p className="mt-3 text-lg font-semibold text-slate-950">
                                            {formatDuration(
                                                workedMinutes
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                                        <span>Daily work progress</span>

                                        <span>
                                            {Math.min(
                                                Math.round(
                                                    (workedMinutes /
                                                        officeSettings.fullDayMinutes) *
                                                        100
                                                ),
                                                100
                                            )}
                                            %
                                        </span>
                                    </div>

                                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                                            style={{
                                                width: `${Math.min(
                                                    (workedMinutes /
                                                        officeSettings.fullDayMinutes) *
                                                        100,
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={handleBreakToggle}
                                        disabled={
                                            attendanceStatus !==
                                            "Working"
                                        }
                                        className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                            breakActive
                                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <Coffee size={15} />
                                        {breakActive
                                            ? "End Break"
                                            : "Start Break"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleAttendanceToggle
                                        }
                                        disabled={
                                            attendanceStatus ===
                                            "Logged Out"
                                        }
                                        className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition ${
                                            attendanceStatus ===
                                            "Working"
                                                ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                                : "bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        }`}
                                    >
                                        {attendanceStatus ===
                                        "Working" ? (
                                            <LogOut size={15} />
                                        ) : (
                                            <LogIn size={15} />
                                        )}

                                        {attendanceStatus ===
                                        "Working"
                                            ? "End Workday"
                                            : attendanceStatus ===
                                                "Logged Out"
                                              ? "Workday Completed"
                                              : "Start Workday"}
                                    </button>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                                    <h3 className="text-sm font-semibold text-slate-950">
                                        Today’s Timeline
                                    </h3>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Attendance activity for today
                                    </p>
                                </div>

                                <div className="relative space-y-5 p-5 before:absolute before:bottom-7 before:left-[24px] before:top-7 before:w-px before:bg-slate-200">
                                    {[
                                        {
                                            id: 1,
                                            title: "Logged in",
                                            description:
                                                formatTime(loginTime),
                                            icon: LogIn,
                                            iconClass:
                                                "bg-emerald-100 text-emerald-700",
                                        },
                                        {
                                            id: 2,
                                            title: "Morning break",
                                            description: "10:55 AM · 10m",
                                            icon: Coffee,
                                            iconClass:
                                                "bg-amber-100 text-amber-700",
                                        },
                                        {
                                            id: 3,
                                            title: "Lunch break",
                                            description: "01:10 PM · 25m",
                                            icon: Coffee,
                                            iconClass:
                                                "bg-blue-100 text-blue-700",
                                        },
                                        {
                                            id: 4,
                                            title: breakActive
                                                ? "Break active"
                                                : attendanceStatus ===
                                                    "Logged Out"
                                                  ? "Logged out"
                                                  : "Currently working",
                                            description: breakActive
                                                ? "Started recently"
                                                : attendanceStatus ===
                                                    "Logged Out"
                                                  ? formatTime(
                                                        logoutTime
                                                    )
                                                  : "Work session active",
                                            icon: breakActive
                                                ? Coffee
                                                : attendanceStatus ===
                                                    "Logged Out"
                                                  ? LogOut
                                                  : Timer,
                                            iconClass: breakActive
                                                ? "bg-amber-100 text-amber-700"
                                                : attendanceStatus ===
                                                    "Logged Out"
                                                  ? "bg-rose-100 text-rose-700"
                                                  : "bg-violet-100 text-violet-700",
                                        },
                                    ].map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <div
                                                key={item.id}
                                                className="relative flex gap-4"
                                            >
                                                <div
                                                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-4 ring-white ${item.iconClass}`}
                                                >
                                                    <Icon size={16} />
                                                </div>

                                                <div className="pt-1">
                                                    <p className="text-xs font-semibold text-slate-900">
                                                        {item.title}
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {
                                                            item.description
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80">
                                    <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Date
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Login
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Logout
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Break
                                    </th>

                                    <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Worked
                                    </th>

                                    <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {attendanceHistory.map((record) => (
                                    <tr
                                        key={record.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="text-xs font-semibold text-slate-900">
                                                {formatDate(
                                                    record.date
                                                )}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-700">
                                                <LogIn
                                                    size={14}
                                                    className="text-emerald-600"
                                                />
                                                {formatTime(
                                                    record.loginTime
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-700">
                                                <LogOut
                                                    size={14}
                                                    className="text-rose-500"
                                                />
                                                {formatTime(
                                                    record.logoutTime
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-xs text-slate-600">
                                            {formatDuration(
                                                record.breakMinutes
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="text-xs font-semibold text-slate-900">
                                                {formatDuration(
                                                    record.workedMinutes
                                                )}
                                            </p>

                                            <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-violet-500"
                                                    style={{
                                                        width: `${Math.min(
                                                            (record.workedMinutes /
                                                                officeSettings.fullDayMinutes) *
                                                                100,
                                                            100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getAttendanceStatusClasses(
                                                    record.status
                                                )}`}
                                            >
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "calendar" && (
                    <div className="p-5">
                        <div className="overflow-hidden rounded-2xl border border-slate-200">
                            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-950">
                                        Monthly Attendance
                                    </h3>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Calendar view of your attendance
                                        records
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            changeCalendarMonth(-1)
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    <div className="min-w-36 text-center text-xs font-semibold text-slate-800">
                                        {calendarDate.toLocaleDateString(
                                            "en-IN",
                                            {
                                                month: "long",
                                                year: "numeric",
                                            }
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            changeCalendarMonth(1)
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-5">
                                {[
                                    {
                                        label: "Present",
                                        value: monthlySummary.present,
                                        className:
                                            "bg-emerald-50 text-emerald-700",
                                    },
                                    {
                                        label: "Late",
                                        value: monthlySummary.late,
                                        className:
                                            "bg-amber-50 text-amber-700",
                                    },
                                    {
                                        label: "Half Day",
                                        value: monthlySummary.halfDay,
                                        className:
                                            "bg-blue-50 text-blue-700",
                                    },
                                    {
                                        label: "Absent",
                                        value: monthlySummary.absent,
                                        className:
                                            "bg-rose-50 text-rose-700",
                                    },
                                    {
                                        label: "Leave",
                                        value: monthlySummary.leave,
                                        className:
                                            "bg-violet-50 text-violet-700",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className={`rounded-xl px-3 py-3 text-center ${item.className}`}
                                    >
                                        <p className="text-lg font-semibold">
                                            {item.value}
                                        </p>

                                        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em]">
                                            {item.label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4">
                                <div className="grid grid-cols-7">
                                    {[
                                        "Sun",
                                        "Mon",
                                        "Tue",
                                        "Wed",
                                        "Thu",
                                        "Fri",
                                        "Sat",
                                    ].map((day) => (
                                        <div
                                            key={day}
                                            className="px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                                        >
                                            {day}
                                        </div>
                                    ))}

                                    {calendarDays.map((date, index) => {
                                        if (!date) {
                                            return (
                                                <div
                                                    key={`empty-${index}`}
                                                    className="min-h-24 border border-slate-100 bg-slate-50/40"
                                                />
                                            );
                                        }

                                        const dateKey = [
                                            date.getFullYear(),
                                            String(
                                                date.getMonth() + 1
                                            ).padStart(2, "0"),
                                            String(
                                                date.getDate()
                                            ).padStart(2, "0"),
                                        ].join("-");

                                        const status = attendanceHistory.find(
                                            (record) => record.date === dateKey
                                        )?.status;

                                        return (
                                            <div
                                                key={dateKey}
                                                className="min-h-24 border border-slate-100 p-2"
                                            >
                                                <span className="text-[10px] font-semibold text-slate-500">
                                                    {date.getDate()}
                                                </span>

                                                {status && (
                                                    <span
                                                        className={`mt-3 block rounded-lg px-2 py-1.5 text-center text-[9px] font-bold ring-1 ring-inset ${getAttendanceStatusClasses(
                                                            status
                                                        )}`}
                                                    >
                                                        {status}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "leave" && (
                    <div className="p-5">
                        <div className="grid gap-4 lg:grid-cols-3">
                            {leaveBalances.map((leave) => {
                                const remaining =
                                    leave.total - leave.used;

                                const percentage = Math.round(
                                    (leave.used / leave.total) * 100
                                );

                                return (
                                    <div
                                        key={leave.id}
                                        className="rounded-2xl border border-slate-200 p-5"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {leave.name}
                                                </p>

                                                <span
                                                    className={`mt-2 inline-flex rounded-lg px-2 py-1 text-[9px] font-bold ${leave.badgeClass}`}
                                                >
                                                    {leave.code}
                                                </span>
                                            </div>

                                            <p className="text-2xl font-semibold text-slate-950">
                                                {remaining}
                                            </p>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between text-[10px] text-slate-500">
                                            <span>
                                                {leave.used} used
                                            </span>

                                            <span>
                                                {leave.total} total
                                            </span>
                                        </div>

                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={`h-full rounded-full ${leave.colorClass}`}
                                                style={{
                                                    width: `${Math.min(
                                                        percentage,
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-950">
                                        Leave Requests
                                    </h3>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Review your current and previous
                                        requests
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setLeaveDrawerOpen(true)
                                    }
                                    className="flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-3 text-[10px] font-semibold text-white"
                                >
                                    <Plus size={14} />
                                    New Request
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px]">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Leave Type
                                            </th>

                                            <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Period
                                            </th>

                                            <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Days
                                            </th>

                                            <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Reason
                                            </th>

                                            <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Applied
                                            </th>

                                            <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {leaveRequests.map(
                                            (request) => (
                                                <tr
                                                    key={
                                                        request.id
                                                    }
                                                    className="transition hover:bg-slate-50/70"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {
                                                                request.leaveType
                                                            }
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <p className="text-xs font-semibold text-slate-700">
                                                            {formatDate(
                                                                request.fromDate
                                                            )}
                                                        </p>

                                                        {request.fromDate !==
                                                            request.toDate && (
                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                to{" "}
                                                                {formatDate(
                                                                    request.toDate
                                                                )}
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                                                        {
                                                            request.days
                                                        }
                                                    </td>

                                                    <td className="max-w-72 px-4 py-4">
                                                        <p className="text-xs leading-5 text-slate-600">
                                                            {
                                                                request.reason
                                                            }
                                                        </p>

                                                        {request.reviewNote && (
                                                            <p className="mt-1 text-[10px] text-slate-400">
                                                                {
                                                                    request.reviewNote
                                                                }
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-xs text-slate-600">
                                                        {formatDate(
                                                            request.appliedOn
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getLeaveStatusClasses(
                                                                request.status
                                                            )}`}
                                                        >
                                                            {
                                                                request.status
                                                            }
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {leaveDrawerOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close leave form"
                        onClick={closeLeaveDrawer}
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[560px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.22)]">
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">
                                    Leave Management
                                </p>

                                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                                    Apply for Leave
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Submit a leave request for admin
                                    approval.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeLeaveDrawer}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <form
                            onSubmit={submitLeaveRequest}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 space-y-5 overflow-y-auto p-6">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Leave Type
                                    </label>

                                    <select
                                        name="leaveType"
                                        value={
                                            leaveForm.leaveType
                                        }
                                        onChange={
                                            handleLeaveFormChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    >
                                        {leaveBalances.map(
                                            (leave) => (
                                                <option
                                                    key={
                                                        leave.id
                                                    }
                                                >
                                                    {
                                                        leave.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            From Date
                                        </label>

                                        <input
                                            type="date"
                                            name="fromDate"
                                            value={
                                                leaveForm.fromDate
                                            }
                                            onChange={
                                                handleLeaveFormChange
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            To Date
                                        </label>

                                        <input
                                            type="date"
                                            name="toDate"
                                            value={
                                                leaveForm.toDate
                                            }
                                            min={
                                                leaveForm.fromDate
                                            }
                                            onChange={
                                                handleLeaveFormChange
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>
                                </div>

                                {requestedLeaveDays > 0 && (
                                    <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
                                        <CalendarDays
                                            size={17}
                                            className="text-violet-700"
                                        />

                                        <div>
                                            <p className="text-xs font-semibold text-violet-800">
                                                {
                                                    requestedLeaveDays
                                                }{" "}
                                                leave day
                                                {requestedLeaveDays !==
                                                1
                                                    ? "s"
                                                    : ""}
                                            </p>

                                            <p className="mt-1 text-[10px] text-violet-600">
                                                This request will
                                                require approval.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Reason
                                    </label>

                                    <textarea
                                        name="reason"
                                        value={leaveForm.reason}
                                        onChange={
                                            handleLeaveFormChange
                                        }
                                        rows={5}
                                        placeholder="Explain the reason for your leave request..."
                                        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs leading-5 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Contact During Leave
                                    </label>

                                    <input
                                        name="contactDuringLeave"
                                        value={
                                            leaveForm.contactDuringLeave
                                        }
                                        onChange={
                                            handleLeaveFormChange
                                        }
                                        placeholder="Optional mobile number"
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle
                                            size={17}
                                            className="mt-0.5 shrink-0 text-amber-700"
                                        />

                                        <p className="text-xs leading-5 text-amber-800">
                                            Submit leave requests early
                                            when client visits, releases
                                            or deployments are scheduled.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeLeaveDrawer}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                >
                                    <Check size={15} />
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </aside>
                </>
            )}
        </div>
    );
}
