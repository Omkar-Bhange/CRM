import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Coffee,
    Download,
    Filter,
    LogIn,
    LogOut,
    MoreHorizontal,
    Search,
    Timer,
    UserCheck,
    UserMinus,
    Users,
    X,
    XCircle,
} from "lucide-react";





const monthlyAttendance = {
    1: {
        "2026-07-01": "Present",
        "2026-07-02": "Present",
        "2026-07-03": "Present",
        "2026-07-04": "Half Day",
        "2026-07-06": "Present",
        "2026-07-07": "Present",
        "2026-07-08": "Late",
        "2026-07-09": "Present",
        "2026-07-10": "Present",
        "2026-07-11": "Present",
        "2026-07-13": "Present",
        "2026-07-14": "Present",
    },
    2: {
        "2026-07-01": "Present",
        "2026-07-02": "Late",
        "2026-07-03": "Present",
        "2026-07-04": "Present",
        "2026-07-06": "Present",
        "2026-07-07": "Present",
        "2026-07-08": "Present",
        "2026-07-09": "Half Day",
        "2026-07-10": "Present",
        "2026-07-11": "Present",
        "2026-07-13": "Present",
        "2026-07-14": "Late",
    },
    3: {
        "2026-07-01": "Present",
        "2026-07-02": "Present",
        "2026-07-03": "Present",
        "2026-07-04": "Present",
        "2026-07-06": "Present",
        "2026-07-07": "Absent",
        "2026-07-08": "Present",
        "2026-07-09": "Present",
        "2026-07-10": "Present",
        "2026-07-11": "Present",
        "2026-07-13": "Present",
        "2026-07-14": "Present",
    },
    4: {
        "2026-07-01": "Present",
        "2026-07-02": "Present",
        "2026-07-03": "Half Day",
        "2026-07-04": "Present",
        "2026-07-06": "Present",
        "2026-07-07": "Present",
        "2026-07-08": "Present",
        "2026-07-09": "Present",
        "2026-07-10": "Present",
        "2026-07-11": "Late",
        "2026-07-13": "Present",
        "2026-07-14": "Late",
    },
    5: {
        "2026-07-01": "Present",
        "2026-07-02": "Present",
        "2026-07-03": "Present",
        "2026-07-04": "Present",
        "2026-07-06": "Present",
        "2026-07-07": "Present",
        "2026-07-08": "Present",
        "2026-07-09": "Present",
        "2026-07-10": "Present",
        "2026-07-11": "Present",
        "2026-07-13": "Present",
        "2026-07-14": "On Leave",
    },
};

const officeSettings = {
    startTime: "09:00",
    endTime: "18:00",
    fullDayMinutes: 8 * 60,
    halfDayMinutes: 4 * 60,
    lateAfter: "09:10",
};

function formatTime(time) {
    if (time && String(time).includes("T")) {
        const date = new Date(time);
        return Number.isNaN(date.getTime())
            ? "—"
            : date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    }
    if (!time) return "—";

    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function toTimeInput(time) {
    if (!time) return "";
    const date = new Date(time);
    return Number.isNaN(date.getTime()) ? String(time).slice(0, 5) : date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getMinutesFromTime(time) {
    if (!time) return 0;

    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
}

function formatDuration(totalMinutes) {
    if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
        return "0m";
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;

    return `${hours}h ${minutes}m`;
}

function calculateWorkingMinutes(record) {
    if (!record.loginTime) return 0;

    const loginMinutes = getMinutesFromTime(record.loginTime);

    const logoutMinutes = record.logoutTime
        ? getMinutesFromTime(record.logoutTime)
        : getMinutesFromTime("17:04");

    return Math.max(
        logoutMinutes - loginMinutes - Number(record.breakMinutes || 0),
        0
    );
}

function getStatusClasses(status) {
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

function getWorkStatusClasses(status) {
    const styles = {
        Working: "bg-violet-50 text-violet-700 ring-violet-600/10",
        Free: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Break: "bg-blue-50 text-blue-700 ring-blue-600/10",
        "Logged Out": "bg-slate-100 text-slate-600 ring-slate-500/10",
        "On Leave": "bg-rose-50 text-rose-700 ring-rose-600/10",
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

                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={19} />
                </div>
            </div>

            <p className={`mt-4 text-xs ${descriptionClass}`}>
                {description}
            </p>
        </div>
    );
}

export default function Attendance() {
    const API_URL = "http://localhost:5000";

const [employees, setEmployees] = useState([]);



const [attendanceSummary, setAttendanceSummary] = useState({
  total: 0,
  present: 0,
  absent: 0,
  late: 0,
  halfDay: 0,
  leave: 0,
  working: 0,
  break: 0,
  free: 0,
  loggedOut: 0,
});

const [loading, setLoading] = useState(true);

const [error, setError] = useState("");

const getAuthToken = () => {
    return (
        localStorage.getItem("client-connect-token") ||
        sessionStorage.getItem("client-connect-token") ||
        ""
    );
};
const getEmployee = (employeeId) => {
    return employees.find(
        (employee) =>
            employee._id === employeeId ||
            employee.id === employeeId
    );
};

const normalizeEmployee = (employee = {}) => ({
    _id: employee._id,
    id: employee._id,

    employeeCode: employee.employeeCode || "",

    name: employee.name || "",

    department: employee.department || "",

    role: employee.role || "",

    initials:
        employee.initials ||
        employee.name
            ?.split(" ")
            .map((x) => x[0])
            .join("")
            .substring(0, 2)
            .toUpperCase(),

    status: employee.status || "Free",
});

const loadEmployees = async () => {
    try {
        const response = await fetch(
            `${API_URL}/api/employee/employees`,
            {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Failed to load employees."
            );
        }

        const employeeData = (result.data || []).map(normalizeEmployee);

        setEmployees(employeeData);
    } catch (err) {
        console.error("Load Employees:", err);
        setError(err.message);
    }
};

const loadAttendance = async () => {
    try {
        const response = await fetch(
            `${API_URL}/api/admin/attendance`,
            {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Failed to load attendance."
            );
        }

        setAttendance(result.data || []);
    } catch (err) {
        console.error("Load Attendance:", err);
        setError(err.message);
    }
};


const loadSummary = async () => {
    try {
        const response = await fetch(
            `${API_URL}/api/admin/attendance-summary`,
            {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const result = await response.json();

        if (response.ok && result.success) {
            setAttendanceSummary(result.data);
        }
    } catch (err) {
        console.error("Load Summary:", err);
    }
};
const loadTodayAttendance = async () => {
    try {
        const response = await fetch(
            `${API_URL}/api/admin/attendance/today/all`,
            {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Failed to load attendance."
            );
        }

        setAttendance(result.data || []);

        setAttendanceSummary(result.summary || {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            leave: 0,
            working: 0,
            break: 0,
            free: 0,
            loggedOut: 0,
        });

    } catch (err) {
        console.error(err);
        setError(err.message);
    }
};

const loadLeaveRequests = async () => {
    try {
        const response = await fetch(`${API_URL}/api/admin/leave`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Failed to load leave requests.");
        }
        setLeaveRequests((result.data || []).map((leave) => ({
            ...leave,
            id: leave._id,
            employeeId: String(leave.employeeId),
        })));
    } catch (err) {
        setError(err.message);
    }
};


    const [activeTab, setActiveTab] = useState("today");
    const [attendance, setAttendance] = useState([]);

const [leaveRequests, setLeaveRequests] = useState([]);

    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [attendanceForm, setAttendanceForm] = useState({
        loginTime: "",
        logoutTime: "",
        breakMinutes: 0,
        status: "Present",
        workStatus: "Working",
        note: "",
    });

    const [selectedLeave, setSelectedLeave] = useState(null);
    const [reviewNote, setReviewNote] = useState("");

    const [selectedEmployeeId, setSelectedEmployeeId] = useState(1);
    const [calendarDate, setCalendarDate] = useState(
        new Date("2026-07-01T00:00:00")
    );

    useEffect(() => {
    const init = async () => {
        setLoading(true);

        await Promise.all([loadEmployees(), loadTodayAttendance(), loadLeaveRequests()]);

        setLoading(false);
    };

    init();
}, []);
   const attendanceRows = useMemo(() => {
    return attendance.filter((record) => {
        const search = searchValue.trim().toLowerCase();

        const matchesSearch =
            !search ||
            [
                record.employeeName,
               record.employeeCode,
                record.role,
                record.department,
                record.attendanceStatus,
                record.workStatus,
            ].some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(search)
            );

        const matchesStatus =
            statusFilter === "All" ||
            record.attendanceStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });
}, [attendance, searchValue, statusFilter]);

    const summary = useMemo(() => {
        const present = attendance.filter((record) =>
            ["Present", "Late", "Half Day"].includes(record.attendanceStatus)
        ).length;

        const working = attendance.filter(
            (record) => record.workStatus === "Working"
        ).length;

        const late = attendance.filter(
            (record) => record.attendanceStatus === "Late"
        ).length;

        const leave = attendance.filter(
            (record) => record.attendanceStatus === "On Leave"
        ).length;

        const absent = attendance.filter(
            (record) => record.attendanceStatus === "Absent"
        ).length;

        return {
            present,
            working,
            late,
            leave,
            absent,
        };
    }, [attendance]);

    const pendingLeaveCount = leaveRequests.filter(
        (request) => request.status === "Pending"
    ).length;

    const selectedEmployee = getEmployee(selectedEmployeeId);

    const calendarDays = getCalendarDays(
        calendarDate.getFullYear(),
        calendarDate.getMonth()
    );

    const selectedMonthRecords =
        monthlyAttendance[selectedEmployeeId] || {};

    const employeeMonthSummary = useMemo(() => {
        const values = Object.values(selectedMonthRecords);

        return {
            present: values.filter((status) => status === "Present").length,
            late: values.filter((status) => status === "Late").length,
            halfDay: values.filter((status) => status === "Half Day").length,
            absent: values.filter((status) => status === "Absent").length,
            leave: values.filter((status) => status === "On Leave").length,
        };
    }, [selectedMonthRecords]);

    const openAttendanceEditor = (record) => {
        setSelectedAttendance(record);

        setAttendanceForm({
            loginTime: toTimeInput(record.loginTime),
            logoutTime: toTimeInput(record.logoutTime),
            breakMinutes: record.breakMinutes || 0,
            status: record.attendanceStatus || "Present",
            workStatus: record.workStatus || "Working",
            note: record.note || "",
        });
    };

    const closeAttendanceEditor = () => {
        setSelectedAttendance(null);

        setAttendanceForm({
            loginTime: "",
            logoutTime: "",
            breakMinutes: 0,
            status: "Present",
            workStatus: "Working",
            note: "",
        });
    };

    const handleAttendanceChange = (event) => {
        const { name, value } = event.target;

        setAttendanceForm((current) => ({
            ...current,
            [name]:
                name === "breakMinutes"
                    ? Math.max(Number(value || 0), 0)
                    : value,
        }));
    };

    const handleSaveAttendance = async (event) => {
        event.preventDefault();

        if (!selectedAttendance) return;

        if (
            !["Absent", "On Leave"].includes(attendanceForm.status) &&
            !attendanceForm.loginTime
        ) {
            alert("Please enter login time.");
            return;
        }

        if (!selectedAttendance.attendanceId) {
            alert("Absent and leave rows do not have an attendance record to edit.");
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/admin/attendance/${selectedAttendance.attendanceId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    loginTime: ["Absent", "On Leave"].includes(attendanceForm.status) ? null : attendanceForm.loginTime,
                    logoutTime: ["Absent", "On Leave"].includes(attendanceForm.status) ? null : attendanceForm.logoutTime,
                    breakMinutes: ["Absent", "On Leave"].includes(attendanceForm.status) ? 0 : Number(attendanceForm.breakMinutes || 0),
                    status: attendanceForm.status,
                    workStatus: attendanceForm.status === "On Leave" ? "On Leave" : attendanceForm.status === "Absent" ? "Logged Out" : attendanceForm.workStatus,
                    note: attendanceForm.note.trim(),
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to save attendance.");
            await loadTodayAttendance();
            closeAttendanceEditor();
        } catch (error) { alert(error.message); }
    };

    const handleLeaveDecision = async (status) => {
        if (!selectedLeave) return;

        try {
            const response = await fetch(`${API_URL}/api/admin/leave/${selectedLeave.id}/review`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify({ status, reviewNote }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Unable to review leave request.");
            await Promise.all([loadLeaveRequests(), loadTodayAttendance()]);
            setSelectedLeave(null);
            setReviewNote("");
        } catch (error) { alert(error.message); }
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

    if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
            Loading attendance...
        </div>
    );
}

if (error) {
    return (
        <div className="p-6 text-red-600">
            {error}
        </div>
    );
}
    return (
        <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Employee Management
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Attendance & Leave
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Track daily attendance, working hours, late arrivals
                        and employee leave requests.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        <Download size={15} />
                        Export Report
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("leaves")}
                        className="relative flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                    >
                        <CalendarDays size={15} />
                        Leave Requests

                        {pendingLeaveCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-violet-700">
                                {pendingLeaveCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                    label="Present"
                    value={attendanceSummary.present}
                    description="Employees checked in today"
                    icon={UserCheck}
                    iconClass="bg-emerald-100 text-emerald-700"
                    descriptionClass="text-emerald-600"
                />

                <SummaryCard
                    label="Working"
                    value={attendanceSummary.working}
                    description="Currently active on work"
                    icon={Timer}
                    iconClass="bg-violet-100 text-violet-700"
                    descriptionClass="text-violet-600"
                />

                <SummaryCard
                    label="Late"
                   value={attendanceSummary.late}
                    description={`After ${formatTime(officeSettings.lateAfter)}`}
                    icon={Clock3}
                    iconClass="bg-amber-100 text-amber-700"
                    descriptionClass="text-amber-600"
                />

                <SummaryCard
                    label="On Leave"
                   value={attendanceSummary.leave}
                    description="Approved leave today"
                    icon={CalendarDays}
                    iconClass="bg-blue-100 text-blue-700"
                    descriptionClass="text-blue-600"
                />

                <SummaryCard
                    label="Absent"
                    value={attendanceSummary.absent}
                    description="No attendance recorded"
                    icon={UserMinus}
                    iconClass="bg-rose-100 text-rose-700"
                    descriptionClass="text-rose-600"
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
                                id: "calendar",
                                label: "Monthly Calendar",
                            },
                            {
                                id: "leaves",
                                label: "Leave Requests",
                            },
                            {
                                id: "summary",
                                label: "Summary",
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

                    {activeTab === "today" && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative">
                                <Search
                                    size={15}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(event) =>
                                        setSearchValue(event.target.value)
                                    }
                                    placeholder="Search employee..."
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-64"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setFiltersOpen((current) => !current)
                                }
                                className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${
                                    filtersOpen || statusFilter !== "All"
                                        ? "border-violet-200 bg-violet-50 text-violet-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <Filter size={15} />
                                Filters
                            </button>
                        </div>
                    )}
                </div>

                {activeTab === "today" && (
                    <>
                        {filtersOpen && (
                            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                                <div className="flex flex-wrap items-end gap-3">
                                    <div>
                                        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Attendance status
                                        </label>

                                        <select
                                            value={statusFilter}
                                            onChange={(event) =>
                                                setStatusFilter(
                                                    event.target.value
                                                )
                                            }
                                            className="h-10 min-w-44 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option>All</option>
                                            <option>Present</option>
                                            <option>Late</option>
                                            <option>Half Day</option>
                                            <option>Absent</option>
                                            <option>On Leave</option>
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStatusFilter("All");
                                            setSearchValue("");
                                        }}
                                        className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="min-w-[1100px] w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                        <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Employee
                                        </th>
                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Attendance
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
                                            Working hours
                                        </th>
                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Current status
                                        </th>
                                        <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {attendanceRows.map((record) => (
                                        <tr
                                            key={record.id}
                                            className="transition hover:bg-slate-50/70"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                                                {record.employeeName
    ?.split(" ")
    .map(x => x[0])
    .join("")
    .substring(0,2)
    .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {
                                                                record.employeeName
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                            {
                                                               record.employeeCode
                                                            }{" "}
                                                            ·{" "}
                                                            {
                                                                record.employee
                                                                    ?.role
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getStatusClasses(
                                                        record.attendanceStatus
                                                    )}`}
                                                >
                                                    {record.attendanceStatus}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
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
                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                    <LogOut
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
                                                    {formatTime(
                                                        record.logoutTime
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                                    <Coffee
                                                        size={14}
                                                        className="text-blue-500"
                                                    />
                                                    {record.breakMinutes}m
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <p className="text-xs font-semibold text-slate-900">
                                                    {formatDuration(
                                                        record.workingMinutes
                                                    )}
                                                </p>

                                                <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-violet-500"
                                                        style={{
                                                            width: `${Math.min(
                                                                (record.workingMinutes /
                                                                    officeSettings.fullDayMinutes) *
                                                                    100,
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getWorkStatusClasses(
                                                        record.workStatus
                                                    )}`}
                                                >
                                                    {record.workStatus}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openAttendanceEditor(
                                                                record
                                                            )
                                                        }
                                                        className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                                                    >
                                                        <MoreHorizontal
                                                            size={14}
                                                        />
                                                        Manage
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {attendanceRows.length === 0 && (
                            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <Search size={23} />
                                </div>

                                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                                    No attendance records found
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Change your search or attendance filters.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "calendar" && (
                    <div className="p-5">
                        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Select employee
                                </p>

                                <div className="mt-3 space-y-2">
                                    {employees.map((employee) => (
                                        <button
                                            key={employee.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedEmployeeId(
                                                    employee.id
                                                )
                                            }
                                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                                                selectedEmployeeId ===
                                                employee.id
                                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                                                    : "bg-white text-slate-700 hover:bg-slate-100"
                                            }`}
                                        >
                                            <div
                                                className={`flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-bold ${
                                                    selectedEmployeeId ===
                                                    employee.id
                                                        ? "bg-white/15 text-white"
                                                        : "bg-slate-900 text-white"
                                                }`}
                                            >
                                                {employee.initials}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold">
                                                    {employee.name}
                                                </p>

                                                <p
                                                    className={`mt-1 truncate text-[10px] ${
                                                        selectedEmployeeId ===
                                                        employee.id
                                                            ? "text-violet-100"
                                                            : "text-slate-400"
                                                    }`}
                                                >
                                                    {employee.role}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-950">
                                            {selectedEmployee?.name}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Monthly attendance calendar
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

                                <div className="grid grid-cols-5 gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-5">
                                    {[
                                        {
                                            label: "Present",
                                            value:
                                                employeeMonthSummary.present,
                                            className:
                                                "text-emerald-700 bg-emerald-50",
                                        },
                                        {
                                            label: "Late",
                                            value: employeeMonthSummary.late,
                                            className:
                                                "text-amber-700 bg-amber-50",
                                        },
                                        {
                                            label: "Half Day",
                                            value:
                                                employeeMonthSummary.halfDay,
                                            className:
                                                "text-blue-700 bg-blue-50",
                                        },
                                        {
                                            label: "Absent",
                                            value:
                                                employeeMonthSummary.absent,
                                            className:
                                                "text-rose-700 bg-rose-50",
                                        },
                                        {
                                            label: "Leave",
                                            value: employeeMonthSummary.leave,
                                            className:
                                                "text-violet-700 bg-violet-50",
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

                                            const status =
                                                selectedMonthRecords[dateKey];

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
                                                            className={`mt-3 block rounded-lg px-2 py-1.5 text-center text-[9px] font-bold ring-1 ring-inset ${getStatusClasses(
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
                    </div>
                )}

                {activeTab === "leaves" && (
                    <div>
                        <div className="grid gap-4 border-b border-slate-200 bg-slate-50/60 p-5 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Pending
                                </p>

                                <p className="mt-2 text-xl font-semibold text-amber-600">
                                    {
                                        leaveRequests.filter(
                                            (request) =>
                                                request.status === "Pending"
                                        ).length
                                    }
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Approved
                                </p>

                                <p className="mt-2 text-xl font-semibold text-emerald-600">
                                    {
                                        leaveRequests.filter(
                                            (request) =>
                                                request.status === "Approved"
                                        ).length
                                    }
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Rejected
                                </p>

                                <p className="mt-2 text-xl font-semibold text-rose-600">
                                    {
                                        leaveRequests.filter(
                                            (request) =>
                                                request.status === "Rejected"
                                        ).length
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-[1000px] w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                        <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Employee
                                        </th>
                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Leave type
                                        </th>
                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Period
                                        </th>
                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Reason
                                        </th>
                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Applied
                                        </th>
                                        <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Status
                                        </th>
                                        <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {leaveRequests.map((request) => {
                                        const employee = getEmployee(
                                            request.employeeId
                                        );

                                        return (
                                            <tr
                                                key={request.id}
                                                className="transition hover:bg-slate-50/70"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold text-white">
                                                            {
                                                                employee?.initials
                                                            }
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {employee?.name}
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-500">
                                                                {employee?.role}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                                                    {request.leaveType}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <p className="text-xs font-semibold text-slate-800">
                                                        {request.fromDate}
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {request.days} day
                                                        {request.days > 1
                                                            ? "s"
                                                            : ""}
                                                    </p>
                                                </td>

                                                <td className="max-w-64 px-4 py-4">
                                                    <p className="text-xs leading-5 text-slate-600">
                                                        {request.reason}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4 text-xs text-slate-600">
                                                    {request.appliedOn}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getLeaveStatusClasses(
                                                            request.status
                                                        )}`}
                                                    >
                                                        {request.status}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end">
                                                        {request.status ===
                                                        "Pending" ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedLeave(
                                                                        request
                                                                    );
                                                                    setReviewNote(
                                                                        ""
                                                                    );
                                                                }}
                                                                className="flex h-9 items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-100"
                                                            >
                                                                Review
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400">
                                                                Reviewed by{" "}
                                                                {
                                                                    request.reviewedBy
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "summary" && (
                    <div className="p-5">
                        <div className="overflow-hidden rounded-2xl border border-slate-200">
                            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Employee Attendance Summary
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Current month attendance performance.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-[900px] w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-white">
                                            <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Employee
                                            </th>
                                            <th className="px-4 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Present
                                            </th>
                                            <th className="px-4 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Late
                                            </th>
                                            <th className="px-4 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Half Day
                                            </th>
                                            <th className="px-4 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Absent
                                            </th>
                                            <th className="px-4 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Leave
                                            </th>
                                            <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Attendance rate
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {employees.map((employee) => {
                                            const records =
                                                monthlyAttendance[
                                                    employee.id
                                                ] || {};

                                            const values =
                                                Object.values(records);

                                            const present = values.filter(
                                                (status) =>
                                                    status === "Present"
                                            ).length;

                                            const late = values.filter(
                                                (status) => status === "Late"
                                            ).length;

                                            const halfDay = values.filter(
                                                (status) =>
                                                    status === "Half Day"
                                            ).length;

                                            const absent = values.filter(
                                                (status) =>
                                                    status === "Absent"
                                            ).length;

                                            const leave = values.filter(
                                                (status) =>
                                                    status === "On Leave"
                                            ).length;

                                            const workingDays =
                                                values.length || 1;

                                            const attendanceRate = Math.round(
                                                ((present +
                                                    late +
                                                    halfDay * 0.5) /
                                                    workingDays) *
                                                    100
                                            );

                                            return (
                                                <tr
                                                    key={employee.id}
                                                    className="transition hover:bg-slate-50/70"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold text-white">
                                                                {
                                                                    employee.initials
                                                                }
                                                            </div>

                                                            <div>
                                                                <p className="text-xs font-semibold text-slate-900">
                                                                    {
                                                                        employee.name
                                                                    }
                                                                </p>

                                                                <p className="mt-1 text-[10px] text-slate-500">
                                                                    {
                                                                        employee.department
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4 text-center text-xs font-semibold text-emerald-700">
                                                        {present}
                                                    </td>

                                                    <td className="px-4 py-4 text-center text-xs font-semibold text-amber-700">
                                                        {late}
                                                    </td>

                                                    <td className="px-4 py-4 text-center text-xs font-semibold text-blue-700">
                                                        {halfDay}
                                                    </td>

                                                    <td className="px-4 py-4 text-center text-xs font-semibold text-rose-700">
                                                        {absent}
                                                    </td>

                                                    <td className="px-4 py-4 text-center text-xs font-semibold text-violet-700">
                                                        {leave}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className="h-full rounded-full bg-emerald-500"
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            attendanceRate,
                                                                            100
                                                                        )}%`,
                                                                    }}
                                                                />
                                                            </div>

                                                            <span className="text-xs font-semibold text-slate-700">
                                                                {
                                                                    attendanceRate
                                                                }
                                                                %
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {selectedAttendance && (
                <>
                    <button
                        type="button"
                        aria-label="Close attendance editor"
                        onClick={closeAttendanceEditor}
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[520px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.22)]">
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-xs font-semibold text-violet-600">
                                    Attendance Correction
                                </p>

                                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                                    {
                                        getEmployee(
                                            selectedAttendance.employeeId
                                        )?.name
                                    }
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Update login, logout, break and attendance
                                    status.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeAttendanceEditor}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveAttendance}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 space-y-5 overflow-y-auto p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Attendance status
                                        </label>

                                        <select
                                            name="status"
                                            value={attendanceForm.status}
                                            onChange={
                                                handleAttendanceChange
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option>Present</option>
                                            <option>Late</option>
                                            <option>Half Day</option>
                                            <option>Absent</option>
                                            <option>On Leave</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Current work status
                                        </label>

                                        <select
                                            name="workStatus"
                                            value={
                                                attendanceForm.workStatus
                                            }
                                            onChange={
                                                handleAttendanceChange
                                            }
                                            disabled={[
                                                "Absent",
                                                "On Leave",
                                            ].includes(
                                                attendanceForm.status
                                            )}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none disabled:bg-slate-100 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option>Working</option>
                                            <option>Free</option>
                                            <option>Break</option>
                                            <option>Logged Out</option>
                                            <option>On Leave</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Login time
                                        </label>

                                        <input
                                            type="time"
                                            name="loginTime"
                                            value={
                                                attendanceForm.loginTime
                                            }
                                            onChange={
                                                handleAttendanceChange
                                            }
                                            disabled={[
                                                "Absent",
                                                "On Leave",
                                            ].includes(
                                                attendanceForm.status
                                            )}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none disabled:bg-slate-100 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Logout time
                                        </label>

                                        <input
                                            type="time"
                                            name="logoutTime"
                                            value={
                                                attendanceForm.logoutTime
                                            }
                                            onChange={
                                                handleAttendanceChange
                                            }
                                            disabled={[
                                                "Absent",
                                                "On Leave",
                                            ].includes(
                                                attendanceForm.status
                                            )}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none disabled:bg-slate-100 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Break duration in minutes
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        name="breakMinutes"
                                        value={
                                            attendanceForm.breakMinutes
                                        }
                                        onChange={handleAttendanceChange}
                                        disabled={[
                                            "Absent",
                                            "On Leave",
                                        ].includes(attendanceForm.status)}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none disabled:bg-slate-100 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Correction note
                                    </label>

                                    <textarea
                                        name="note"
                                        value={attendanceForm.note}
                                        onChange={handleAttendanceChange}
                                        rows={5}
                                        placeholder="Enter reason for manual attendance correction..."
                                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs leading-5 text-slate-700 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeAttendanceEditor}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                >
                                    <Check size={15} />
                                    Save Attendance
                                </button>
                            </div>
                        </form>
                    </aside>
                </>
            )}

            {selectedLeave && (
                <>
                    <button
                        type="button"
                        aria-label="Close leave review"
                        onClick={() => {
                            setSelectedLeave(null);
                            setReviewNote("");
                        }}
                        className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                                <div>
                                    <p className="text-xs font-semibold text-violet-600">
                                        Leave Review
                                    </p>

                                    <h2 className="mt-2 text-lg font-semibold text-slate-950">
                                        {
                                            getEmployee(
                                                selectedLeave.employeeId
                                            )?.name
                                        }
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedLeave(null);
                                        setReviewNote("");
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4 p-6">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Leave type
                                        </p>

                                        <p className="mt-2 text-xs font-semibold text-slate-800">
                                            {selectedLeave.leaveType}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                            Duration
                                        </p>

                                        <p className="mt-2 text-xs font-semibold text-slate-800">
                                            {selectedLeave.days} day
                                            {selectedLeave.days > 1
                                                ? "s"
                                                : ""}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Period
                                    </p>

                                    <p className="mt-2 text-xs font-semibold text-slate-800">
                                        {selectedLeave.fromDate} to{" "}
                                        {selectedLeave.toDate}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        Reason
                                    </p>

                                    <p className="mt-2 text-xs leading-5 text-slate-700">
                                        {selectedLeave.reason}
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Review note
                                    </label>

                                    <textarea
                                        value={reviewNote}
                                        onChange={(event) =>
                                            setReviewNote(
                                                event.target.value
                                            )
                                        }
                                        rows={4}
                                        placeholder="Add approval or rejection note..."
                                        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs leading-5 text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleLeaveDecision("Rejected")
                                    }
                                    className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                >
                                    <XCircle size={15} />
                                    Reject
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleLeaveDecision("Approved")
                                    }
                                    className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <CheckCircle2 size={15} />
                                    Approve
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
