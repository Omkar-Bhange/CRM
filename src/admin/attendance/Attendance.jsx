  import API_URL from "../../config/api";
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







const officeSettings = {
    startTime: "10:00",
    endTime: "18:00",
    fullDayMinutes: 8 * 60,
    halfDayMinutes: 4 * 60,
    lateAfter: "10:15",
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
    Present:
        "bg-emerald-50 text-emerald-700 ring-emerald-600/10",

    Late:
        "bg-amber-50 text-amber-700 ring-amber-600/10",

    "Half Day":
        "bg-blue-50 text-blue-700 ring-blue-600/10",

    Absent:
        "bg-rose-50 text-rose-700 ring-rose-600/10",

    "On Leave":
        "bg-violet-50 text-violet-700 ring-violet-600/10",

    Holiday:
        "bg-cyan-50 text-cyan-700 ring-cyan-600/10",

    "Weekly Off":
        "bg-slate-100 text-slate-700 ring-slate-500/10",

    "Missed Punch":
        "bg-orange-50 text-orange-700 ring-orange-600/10",

    "Not Checked In":
        "bg-yellow-50 text-yellow-700 ring-yellow-600/10",
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
    const firstDay =
        new Date(year, month, 1);

    const lastDay =
        new Date(year, month + 1, 0);

    const days = [];

    // Empty cells before the first day
    for (
        let index = 0;
        index < firstDay.getDay();
        index += 1
    ) {
        days.push(null);
    }

    // Actual dates
    for (
        let day = 1;
        day <= lastDay.getDate();
        day += 1
    ) {
        days.push(
            new Date(
                year,
                month,
                day
            )
        );
    }

    // Empty cells after the last day
    while (
        days.length % 7 !== 0
    ) {
        days.push(null);
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
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_16px_45px_rgba(15,23,42,0.09)]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition duration-300 group-hover:scale-110 group-hover:bg-violet-50" />

            <div className="relative flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${iconClass}`}
                >
                    <Icon size={19} />
                </div>
            </div>

            <p className={`relative mt-4 text-[11px] font-medium ${descriptionClass}`}>
                {description}
            </p>
        </div>
    );
}

export default function Attendance() {


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

    holiday: 0,
    weeklyOff: 0,
    missedPunch: 0,
    notCheckedIn: 0,
});

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [holidays, setHolidays] = useState([]);
const [holidayLoading, setHolidayLoading] = useState(false);
const [holidayDrawerOpen, setHolidayDrawerOpen] = useState(false);
const [editingHoliday, setEditingHoliday] = useState(null);
const [regularizations, setRegularizations] = useState([]);
const [regularizationLoading, setRegularizationLoading] = useState(false);

const [selectedRegularization, setSelectedRegularization] = useState(null);
const [regularizationReviewNote, setRegularizationReviewNote] = useState("");

const [regularizationStatusFilter, setRegularizationStatusFilter] =
    useState("Pending");

const [regularizationTypeFilter, setRegularizationTypeFilter] =
    useState("All");
    const [absenceAnalysis, setAbsenceAnalysis] = useState([]);
const [absenceSummary, setAbsenceSummary] = useState({
    employeesWithAbsence: 0,
    employeesWith3DayStreak: 0,
    totalAbsentDays: 0,
});

const [absenceDays, setAbsenceDays] = useState(30);
const [absenceLoading, setAbsenceLoading] = useState(false);
const [selectedAbsenceEmployee, setSelectedAbsenceEmployee] = useState(null);

const [holidayForm, setHolidayForm] = useState({
    date: "",
    name: "",
    type: "Company",
    note: "",
    isActive: true,
});

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

    const loadAbsenceAnalysis = async () => {
    try {
        setAbsenceLoading(true);

        const response = await fetch(
            `${API_URL}/api/attendance/admin/absence-analysis?days=${absenceDays}`,
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
                result.message ||
                "Failed to load absence analysis."
            );
        }

        setAbsenceAnalysis(result.data || []);

        setAbsenceSummary({
            employeesWithAbsence:
                result.summary?.employeesWithAbsence || 0,

            employeesWith3DayStreak:
                result.summary?.employeesWith3DayStreak || 0,

            totalAbsentDays:
                result.summary?.totalAbsentDays || 0,
        });
    } catch (err) {
        console.error(
            "Load Absence Analysis:",
            err
        );

        setError(err.message);
    } finally {
        setAbsenceLoading(false);
    }
};
    const loadRegularizations = async () => {
    try {
        setRegularizationLoading(true);

        const params = new URLSearchParams();

        if (
            regularizationStatusFilter &&
            regularizationStatusFilter !== "All"
        ) {
            params.set(
                "status",
                regularizationStatusFilter
            );
        }

        if (
            regularizationTypeFilter &&
            regularizationTypeFilter !== "All"
        ) {
            params.set(
                "requestType",
                regularizationTypeFilter
            );
        }

        const queryString =
            params.toString();

        const response = await fetch(
            `${API_URL}/api/attendance/admin/regularizations${
                queryString
                    ? `?${queryString}`
                    : ""
            }`,
            {
                headers: {
                    Authorization:
                        `Bearer ${getAuthToken()}`,

                    "Content-Type":
                        "application/json",
                },
            }
        );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Failed to load regularization requests."
            );
        }

        setRegularizations(
            result.data || []
        );
    } catch (err) {
        console.error(
            "Load Regularizations:",
            err
        );

        setError(err.message);
    } finally {
        setRegularizationLoading(false);
    }
};
        const loadHolidays = async () => {
    try {
        setHolidayLoading(true);

        const response = await fetch(
            `${API_URL}/api/attendance/admin/holidays`,
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
                result.message ||
                "Failed to load holidays."
            );
        }

        setHolidays(result.data || []);
    } catch (err) {
        console.error("Load Holidays:", err);
        setError(err.message);
    } finally {
        setHolidayLoading(false);
    }
};

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
            if (
    employeeData.length > 0 &&
    !selectedEmployeeId
) {
    setSelectedEmployeeId(
        employeeData[0].id
    );
}
        } catch (err) {
            console.error("Load Employees:", err);
            setError(err.message);
        }
    };





const loadTodayAttendance = async (date = "") => {
    try {
        const url = date
            ? `${API_URL}/api/attendance/admin/today?date=${encodeURIComponent(date)}`
            : `${API_URL}/api/attendance/admin/today`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
                "Content-Type": "application/json",
            },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Failed to load today's attendance."
            );
        }

        setAttendance(result.data || []);

        setAttendanceSummary({
            total:
                result.summary?.totalEmployees || 0,

            present:
                result.summary?.present || 0,

            absent:
                result.summary?.absent || 0,

            late:
                result.summary?.late || 0,

            halfDay:
                result.summary?.halfDay || 0,

            leave:
                result.summary?.leave || 0,

            working:
                result.summary?.working || 0,

            break:
                result.summary?.break || 0,

            free: 0,

            loggedOut:
                result.summary?.loggedOut || 0,

            holiday:
                result.summary?.holiday || 0,

            weeklyOff:
                result.summary?.weeklyOff || 0,

            missedPunch:
                result.summary?.missedPunch || 0,

            notCheckedIn:
                result.summary?.notCheckedIn || 0,
        });

    } catch (err) {
        console.error(
            "Load Today Attendance:",
            err
        );

        setError(err.message);
    }
};

const loadMonthlyRegister = async () => {
    try {
        setMonthlyLoading(true);

        const month = getCalendarMonthKey();

        const response = await fetch(
            `${API_URL}/api/attendance/admin/month?month=${encodeURIComponent(
                month
            )}`,
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
                result.message ||
                "Failed to load monthly attendance."
            );
        }

        setMonthlyRegister(result.employees || []);
        setMonthlyHolidays(result.holidays || []);

    } catch (err) {
        console.error(
            "Load Monthly Attendance:",
            err
        );

        setError(err.message);
    } finally {
        setMonthlyLoading(false);
    }
};
    const loadLeaveRequests = async () => {
    try {
        const response = await fetch(
            `${API_URL}/api/attendance/admin/leaves`,
            {
                headers: {
                    Authorization:
                        `Bearer ${getAuthToken()}`,
                    "Content-Type":
                        "application/json",
                },
            }
        );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Failed to load leave requests."
            );
        }

        setLeaveRequests(
            (result.data || []).map(
                (leave) => ({
                    ...leave,

                    id:
                        leave._id ||
                        leave.id,

                    employeeId:
                        String(
                            leave.employeeId ||
                            ""
                        ),
                })
            )
        );

    } catch (err) {
        console.error(
            "Load Leave Requests:",
            err
        );

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

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
const [calendarDate, setCalendarDate] = useState(
    new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
    )
);
const [monthlyRegister, setMonthlyRegister] = useState([]);
const [monthlyHolidays, setMonthlyHolidays] = useState([]);
const [monthlyLoading, setMonthlyLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            setLoading(true);

            await Promise.all([loadEmployees(), loadTodayAttendance(), loadLeaveRequests()]);

            setLoading(false);
        };

        init();
    }, []);
    useEffect(() => {
    loadMonthlyRegister();
}, [calendarDate]);
useEffect(() => {
    if (activeTab === "holidays") {
        loadHolidays();
    }
}, [activeTab]);
useEffect(() => {
    if (
        activeTab ===
        "regularization"
    ) {
        loadRegularizations();
    }
}, [
    activeTab,
    regularizationStatusFilter,
    regularizationTypeFilter,
]);
useEffect(() => {
    if (activeTab === "absence") {
        loadAbsenceAnalysis();
    }
}, [activeTab, absenceDays]);
function getWarningClasses(level) {
    const styles = {
        High:
            "bg-rose-50 text-rose-700 ring-rose-600/10",

        Medium:
            "bg-amber-50 text-amber-700 ring-amber-600/10",

        Low:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    };

    return (
        styles[level] ||
        "bg-slate-100 text-slate-600 ring-slate-500/10"
    );
}

const handleRegularizationDecision =
    async (status) => {
        if (
            !selectedRegularization
        ) {
            return;
        }

        try {
            const response =
                await fetch(
                    `${API_URL}/api/attendance/admin/regularizations/${selectedRegularization._id}/review`,
                    {
                        method: "PUT",

                        headers: {
                            Authorization:
                                `Bearer ${getAuthToken()}`,

                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                status,

                                reviewNote:
                                    regularizationReviewNote.trim(),
                            }),
                    }
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                    "Unable to review regularization request."
                );
            }

            await Promise.all([
                loadRegularizations(),
                loadTodayAttendance(),
                loadMonthlyRegister(),
            ]);

            setSelectedRegularization(
                null
            );

            setRegularizationReviewNote(
                ""
            );
        } catch (err) {
            alert(err.message);
        }
    };
    function getRegularizationStatusClasses(status) {
    const styles = {
        Pending:
            "bg-amber-50 text-amber-700 ring-amber-600/10",

        Approved:
            "bg-emerald-50 text-emerald-700 ring-emerald-600/10",

        Rejected:
            "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    return (
        styles[status] ||
        "bg-slate-100 text-slate-600 ring-slate-500/10"
    );
}
const openNewHoliday = () => {
    setEditingHoliday(null);

    setHolidayForm({
        date: "",
        name: "",
        type: "Company",
        note: "",
        isActive: true,
    });

    setHolidayDrawerOpen(true);
};

const openEditHoliday = (holiday) => {
    setEditingHoliday(holiday);

    setHolidayForm({
        date: holiday.date || "",
        name: holiday.name || "",
        type: holiday.type || "Company",
        note: holiday.note || "",
        isActive: holiday.isActive !== false,
    });

    setHolidayDrawerOpen(true);
};

const closeHolidayDrawer = () => {
    setHolidayDrawerOpen(false);
    setEditingHoliday(null);

    setHolidayForm({
        date: "",
        name: "",
        type: "Company",
        note: "",
        isActive: true,
    });
};

const handleHolidayChange = (event) => {
    const { name, value, type, checked } = event.target;

    setHolidayForm((current) => ({
        ...current,
        [name]:
            type === "checkbox"
                ? checked
                : value,
    }));
};
const saveHoliday = async (event) => {
    event.preventDefault();

    if (!holidayForm.date) {
        alert("Please select holiday date.");
        return;
    }

    if (!holidayForm.name.trim()) {
        alert("Please enter holiday name.");
        return;
    }

    try {
        const isEdit = Boolean(editingHoliday?._id);

        const response = await fetch(
            isEdit
                ? `${API_URL}/api/attendance/admin/holidays/${editingHoliday._id}`
                : `${API_URL}/api/attendance/admin/holidays`,
            {
                method: isEdit ? "PUT" : "POST",

                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    date: holidayForm.date,
                    name: holidayForm.name.trim(),
                    type: holidayForm.type,
                    note: holidayForm.note.trim(),
                    isActive: holidayForm.isActive,
                }),
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Unable to save holiday."
            );
        }

        await Promise.all([
            loadHolidays(),
            loadMonthlyRegister(),
            loadTodayAttendance(),
        ]);

        closeHolidayDrawer();
    } catch (err) {
        alert(err.message);
    }
};
const deactivateHoliday = async (holiday) => {
    const confirmed = window.confirm(
        `Deactivate ${holiday.name}?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_URL}/api/attendance/admin/holidays/${holiday._id}/deactivate`,
            {
                method: "PATCH",

                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Unable to deactivate holiday."
            );
        }

        await Promise.all([
            loadHolidays(),
            loadMonthlyRegister(),
            loadTodayAttendance(),
        ]);
    } catch (err) {
        alert(err.message);
    }
};

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
    const calendarDays = useMemo(
    () =>
        getCalendarDays(
            calendarDate.getFullYear(),
            calendarDate.getMonth()
        ),
    [calendarDate]
);
const selectedEmployee =
    getEmployee(selectedEmployeeId);

const selectedMonthlyEmployee =
    monthlyRegister.find(
        (item) =>
            String(item.employeeId) ===
            String(selectedEmployeeId)
    ) || null;

const selectedMonthRecords = useMemo(() => {
    const map = {};

    for (
        const item of
        selectedMonthlyEmployee?.calendar || []
    ) {
        map[item.date] = item;
    }

    return map;
}, [selectedMonthlyEmployee]);

const employeeMonthSummary = useMemo(() => {
    const summary =
        selectedMonthlyEmployee?.summary;

    return {
        present:
            Number(summary?.present || 0),

        late:
            Number(summary?.late || 0),

        halfDay:
            Number(summary?.halfDay || 0),

        absent:
            Number(summary?.absent || 0),

        leave:
            Number(summary?.leave || 0),

        holiday:
            Number(summary?.holiday || 0),

        weeklyOff:
            Number(summary?.weeklyOff || 0),

        missedPunch:
            Number(summary?.missedPunch || 0),

        workingDays:
            Number(summary?.workingDays || 0),

        attendanceRate:
            Number(summary?.attendanceRate || 0),

        totalWorkedMinutes:
            Number(summary?.totalWorkedMinutes || 0),

        overtimeMinutes:
            Number(summary?.overtimeMinutes || 0),
    };
}, [selectedMonthlyEmployee]);

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
            const response = await fetch(`${API_URL}/api/attendance/admin/attendance/${selectedAttendance.attendanceId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
             body: JSON.stringify({
    loginTime:
        attendanceForm.loginTime || null,

    logoutTime:
        attendanceForm.logoutTime || null,

    breakMinutes:
        Number(
            attendanceForm.breakMinutes || 0
        ),

    note:
        attendanceForm.note.trim(),
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
            const response = await fetch(`${API_URL}/api/attendance/admin/leaves/${selectedLeave.id}/review`, {
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
const getCalendarMonthKey = () => {
    return `${calendarDate.getFullYear()}-${String(
        calendarDate.getMonth() + 1
    ).padStart(2, "0")}`;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
        <div className="enterprise-page mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:px-7 lg:px-8">

    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-100/70 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />

    <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

        <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20">
                <UserCheck size={21} />
            </div>

            <div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">
                        Employee Management
                    </span>

                    <span className="h-1 w-1 rounded-full bg-slate-300" />

                    <span className="text-[10px] font-semibold text-slate-400">
                        Attendance Control
                    </span>
                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[28px]">
                    Attendance & Leave
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Monitor employee presence, login and logout activity,
                    working hours, late arrivals and leave requests from one workspace.
                </p>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">

            <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-right xl:block">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Total Employees
                </p>

                <p className="mt-0.5 text-lg font-bold text-slate-900">
                    {attendanceSummary.total || employees.length}
                </p>
            </div>

            <button
                type="button"
                className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
            >
                <Download size={15} />
                Export Report
            </button>

            <button
                type="button"
                onClick={() => setActiveTab("leaves")}
                className="relative flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-lg shadow-violet-600/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
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
</section>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

       <div className="enterprise-surface mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                   <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1">
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
        id: "holidays",
        label: "Holidays",
    },

    {
        id: "regularization",
        label: "Regularization",
    },

    {
        id: "absence",
        label: "Absence Analysis",
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
                                className={`relative whitespace-nowrap rounded-lg px-4 py-2.5 text-[11px] font-bold transition-all ${
    activeTab === tab.id
        ? "bg-white text-violet-700 shadow-sm ring-1 ring-slate-200"
        : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
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
                                    className="enterprise-input h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 sm:w-64"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setFiltersOpen((current) => !current)
                                }
                                className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${filtersOpen || statusFilter !== "All"
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
                                            className="enterprise-input h-10 min-w-44 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                       <option>All</option>
<option>Present</option>
<option>Late</option>
<option>Half Day</option>
<option>Absent</option>
<option>On Leave</option>
<option>Holiday</option>
<option>Weekly Off</option>
<option>Missed Punch</option>
<option>Not Checked In</option>
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
                           <table className="w-full min-w-[1160px]">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/90">
                                        <th className="px-5 py-3 text-left text-[10px] font-bolduppercase tracking-[0.14em] text-slate-400">
                                            Employee
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                            Attendance
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                            Login
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                            Logout
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                            Break
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                            Working hours
                                        </th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                            Current status
                                        </th>
                                        <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {attendanceRows.map((record) => (
                                        <tr
                                            key={record.id}
                                            className="group transition-all hover:bg-violet-50/35"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-xs font-bold text-white shadow-sm">
                                                        {record.employeeName
                                                            ?.split(" ")
                                                            .map(x => x[0])
                                                            .join("")
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 transition group-hover:text-violet-700">
                                                            {
                                                                record.employeeName
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-slate-500">
                                                            {
                                                                record.employeeCode
                                                            }{" "}
                                                            ·{" "}
                                                      {record.role}
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

                                               <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/60">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
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
                                                       className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
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
                            <div className="enterprise-empty-state flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
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
                           <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
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
                                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${selectedEmployeeId ===
                                                    employee.id
                                                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20"
                                                    : "border border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div
                                                className={`flex h-9 w-9 items-center justify-center rounded-lg text-[10px] font-bold ${selectedEmployeeId ===
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
                                                    className={`mt-1 truncate text-[10px] ${selectedEmployeeId ===
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

                           <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
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

                              <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-4 xl:grid-cols-8">

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
            value:
                employeeMonthSummary.late,
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
            value:
                employeeMonthSummary.leave,
            className:
                "text-violet-700 bg-violet-50",
        },

        {
            label: "Holiday",
            value:
                employeeMonthSummary.holiday,
            className:
                "text-cyan-700 bg-cyan-50",
        },

        {
            label: "Weekly Off",
            value:
                employeeMonthSummary.weeklyOff,
            className:
                "text-slate-700 bg-slate-100",
        },

        {
            label: "Attendance",
            value:
                `${employeeMonthSummary.attendanceRate}%`,
            className:
                "text-indigo-700 bg-indigo-50",
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

    const dateKey =
        `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}-${String(
            date.getDate()
        ).padStart(2, "0")}`;

    const record =
        selectedMonthRecords[dateKey];

    const status =
        record?.status || "";

    return (
        <div
            key={dateKey}
            className={`group min-h-24 border border-slate-100 p-2 transition ${
                record?.isFuture
                    ? "bg-slate-50/40"
                    : "bg-white hover:bg-violet-50/30"
            }`}
        >
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600">
                    {date.getDate()}
                </span>

                <span className="text-[9px] font-medium text-slate-400">
                    {date.toLocaleDateString(
                        "en-IN",
                        {
                            weekday: "short",
                        }
                    )}
                </span>
            </div>

            {status && (
                <span
                    className={`mt-3 block rounded-lg px-2 py-1.5 text-center text-[9px] font-bold ring-1 ring-inset ${getStatusClasses(
                        status
                    )}`}
                    title={status}
                >
                    {record?.code || status}
                </span>
            )}

            {record?.holidayName && (
                <p
                    title={record.holidayName}
                    className="mt-2 truncate text-[9px] font-medium text-cyan-700"
                >
                    {record.holidayName}
                </p>
            )}

            {record?.leaveType && (
                <p
                    title={record.leaveType}
                    className="mt-2 truncate text-[9px] font-medium text-violet-700"
                >
                    {record.leaveType}
                </p>
            )}

            {Number(record?.totalWorkedMinutes || 0) > 0 && (
                <p className="mt-2 text-[9px] font-medium text-slate-500">
                    {formatDuration(
                        Number(
                            record.totalWorkedMinutes || 0
                        )
                    )}
                </p>
            )}

            {record?.missedPunch && (
                <p className="mt-2 text-[9px] font-semibold text-orange-600">
                    Punch incomplete
                </p>
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
{holidayLoading && (
    <div className="border-b border-violet-100 bg-violet-50 px-5 py-3">
        <p className="text-xs font-medium text-violet-700">
            Loading holidays...
        </p>
    </div>
)}
                {activeTab === "holidays" && (
    <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h3 className="text-sm font-semibold text-slate-950">
                    Holiday Master
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                    Manage company, national and optional holidays.
                </p>
            </div>

            <button
                type="button"
                onClick={openNewHoliday}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
            >
                <CalendarDays size={15} />
                Add Holiday
            </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                Date
                            </th>

                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                Holiday
                            </th>

                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                Type
                            </th>

                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                Note
                            </th>

                            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                Status
                            </th>

                            <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {holidays.map((holiday) => (
                            <tr
                                key={holiday._id}
                                className="transition hover:bg-violet-50/30"
                            >
                                <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                                    {holiday.date}
                                </td>

                                <td className="px-4 py-4">
                                    <p className="text-xs font-semibold text-slate-900">
                                        {holiday.name}
                                    </p>
                                </td>

                                <td className="px-4 py-4">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                            holiday.type === "National"
                                                ? "bg-rose-50 text-rose-700"
                                                : holiday.type === "Optional"
                                                  ? "bg-amber-50 text-amber-700"
                                                  : "bg-violet-50 text-violet-700"
                                        }`}
                                    >
                                        {holiday.type}
                                    </span>
                                </td>

                                <td className="px-4 py-4 text-xs text-slate-600">
                                    {holiday.note || "—"}
                                </td>

                                <td className="px-4 py-4">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                            holiday.isActive
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-100 text-slate-500"
                                        }`}
                                    >
                                        {holiday.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </td>

                                <td className="px-5 py-4">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEditHoliday(
                                                    holiday
                                                )
                                            }
                                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                                        >
                                            Edit
                                        </button>

                                        {holiday.isActive && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    deactivateHoliday(
                                                        holiday
                                                    )
                                                }
                                                className="h-9 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[10px] font-semibold text-rose-700 hover:bg-rose-100"
                                            >
                                                Deactivate
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!holidayLoading &&
                holidays.length === 0 && (
                    <div className="flex min-h-56 flex-col items-center justify-center text-center">
                        <CalendarDays
                            size={28}
                            className="text-slate-300"
                        />

                        <p className="mt-3 text-sm font-semibold text-slate-900">
                            No holidays configured
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Add your first holiday.
                        </p>
                    </div>
                )}
        </div>
    </div>
)}
{holidayDrawerOpen && (
    <>
        <button
            type="button"
            aria-label="Close holiday drawer"
            onClick={closeHolidayDrawer}
            className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
        />

        <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[520px] flex-col bg-white shadow-[-30px_0_90px_rgba(15,23,42,0.20)]">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                        Holiday Master
                    </p>

                    <h2 className="mt-2 text-xl font-semibold text-slate-950">
                        {editingHoliday
                            ? "Edit Holiday"
                            : "Add Holiday"}
                    </h2>
                </div>

                <button
                    type="button"
                    onClick={closeHolidayDrawer}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                >
                    <X size={16} />
                </button>
            </div>

            <form
                onSubmit={saveHoliday}
                className="flex min-h-0 flex-1 flex-col"
            >
                <div className="flex-1 space-y-5 overflow-y-auto p-6">
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                            Holiday Date
                        </label>

                        <input
                            type="date"
                            name="date"
                            value={holidayForm.date}
                            onChange={handleHolidayChange}
                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                            Holiday Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={holidayForm.name}
                            onChange={handleHolidayChange}
                            placeholder="e.g. Independence Day"
                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                            Holiday Type
                        </label>

                        <select
                            name="type"
                            value={holidayForm.type}
                            onChange={handleHolidayChange}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        >
                            <option>Company</option>
                            <option>National</option>
                            <option>Optional</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                            Note
                        </label>

                        <textarea
                            name="note"
                            value={holidayForm.note}
                            onChange={handleHolidayChange}
                            rows={4}
                            placeholder="Optional note..."
                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={closeHolidayDrawer}
                        className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="h-10 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-700"
                    >
                        {editingHoliday
                            ? "Update Holiday"
                            : "Save Holiday"}
                    </button>
                </div>
            </form>
        </aside>
    </>
)}

                {activeTab === "leaves" && (
                    <div>
                     <div className="grid gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-violet-50/30 p-5 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
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
                            <table className="enterprise-table min-w-[1000px] w-full">
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
                                                className="group transition-all hover:bg-violet-50/35"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-[10px] font-bold text-white shadow-sm">
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
                {activeTab === "regularization" && (
    <div>
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/60 p-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h3 className="text-sm font-semibold text-slate-950">
                    Attendance Regularization
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                    Review employee requests for missed punches and attendance corrections.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <div>
                    <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Status
                    </label>

                    <select
                        value={
                            regularizationStatusFilter
                        }
                        onChange={(event) =>
                            setRegularizationStatusFilter(
                                event.target.value
                            )
                        }
                        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                        <option>All</option>
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Rejected</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Correction Type
                    </label>

                    <select
                        value={
                            regularizationTypeFilter
                        }
                        onChange={(event) =>
                            setRegularizationTypeFilter(
                                event.target.value
                            )
                        }
                        className="h-10 min-w-48 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    >
                        <option>All</option>
                        <option>Missing Login</option>
                        <option>Missing Logout</option>
                        <option>Incorrect Time</option>
                        <option>Absent Correction</option>
                        <option>Work From Home</option>
                        <option>Client Site</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-3">
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-700">
                    Pending
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-800">
                    {
                        regularizations.filter(
                            (item) =>
                                item.status ===
                                "Pending"
                        ).length
                    }
                </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                    Approved
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-800">
                    {
                        regularizations.filter(
                            (item) =>
                                item.status ===
                                "Approved"
                        ).length
                    }
                </p>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-rose-700">
                    Rejected
                </p>

                <p className="mt-2 text-2xl font-bold text-rose-800">
                    {
                        regularizations.filter(
                            (item) =>
                                item.status ===
                                "Rejected"
                        ).length
                    }
                </p>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px]">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Employee
                        </th>

                        <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Date
                        </th>

                        <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Type
                        </th>

                        <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Requested Time
                        </th>

                        <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Reason
                        </th>

                        <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Status
                        </th>

                        <th className="px-5 py-3 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Action
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                    {regularizations.map(
                        (request) => (
                            <tr
                                key={request._id}
                                className="transition hover:bg-violet-50/30"
                            >
                                <td className="px-5 py-4">
                                    <p className="text-xs font-semibold text-slate-900">
                                        {
                                            request.employeeName
                                        }
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        {
                                            request.employeeCode
                                        }
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                                    {request.date}
                                </td>

                                <td className="px-4 py-4">
                                    <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                                        {
                                            request.requestType
                                        }
                                    </span>
                                </td>

                                <td className="px-4 py-4">
                                    <p className="text-xs text-slate-700">
                                        Login:{" "}
                                        <span className="font-semibold">
                                            {
                                                request.requestedLoginTime ||
                                                "—"
                                            }
                                        </span>
                                    </p>

                                    <p className="mt-1 text-xs text-slate-700">
                                        Logout:{" "}
                                        <span className="font-semibold">
                                            {
                                                request.requestedLogoutTime ||
                                                "—"
                                            }
                                        </span>
                                    </p>
                                </td>

                                <td className="max-w-72 px-4 py-4">
                                    <p className="text-xs leading-5 text-slate-600">
                                        {
                                            request.reason
                                        }
                                    </p>
                                </td>

                                <td className="px-4 py-4">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${getRegularizationStatusClasses(
                                            request.status
                                        )}`}
                                    >
                                        {
                                            request.status
                                        }
                                    </span>
                                </td>

                                <td className="px-5 py-4">
                                    <div className="flex justify-end">
                                        {request.status ===
                                        "Pending" ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRegularization(
                                                        request
                                                    );

                                                    setRegularizationReviewNote(
                                                        ""
                                                    );
                                                }}
                                                className="h-9 rounded-lg border border-violet-200 bg-violet-50 px-3 text-[10px] font-semibold text-violet-700 hover:bg-violet-100"
                                            >
                                                Review
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-slate-400">
                                                {
                                                    request.reviewedBy ||
                                                    "Reviewed"
                                                }
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </div>

        {!regularizationLoading &&
            regularizations.length === 0 && (
                <div className="flex min-h-56 flex-col items-center justify-center text-center">
                    <CheckCircle2
                        size={28}
                        className="text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-900">
                        No regularization requests
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        There are no requests matching the selected filters.
                    </p>
                </div>
            )}
    </div>
)}
{selectedRegularization && (
    <>
        <button
            type="button"
            aria-label="Close regularization review"
            onClick={() => {
                setSelectedRegularization(
                    null
                );

                setRegularizationReviewNote(
                    ""
                );
            }}
            className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]"
        />

        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                            Attendance Correction
                        </p>

                        <h2 className="mt-2 text-lg font-semibold text-slate-950">
                            {
                                selectedRegularization.employeeName
                            }
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {
                                selectedRegularization.requestType
                            }{" "}
                            ·{" "}
                            {
                                selectedRegularization.date
                            }
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedRegularization(
                                null
                            );

                            setRegularizationReviewNote(
                                ""
                            );
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                Requested Login
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-900">
                                {
                                    selectedRegularization.requestedLoginTime ||
                                    "—"
                                }
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                Requested Logout
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-900">
                                {
                                    selectedRegularization.requestedLogoutTime ||
                                    "—"
                                }
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Employee Reason
                        </p>

                        <p className="mt-2 text-xs leading-5 text-slate-700">
                            {
                                selectedRegularization.reason
                            }
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                            Review Note
                        </label>

                        <textarea
                            value={
                                regularizationReviewNote
                            }
                            onChange={(event) =>
                                setRegularizationReviewNote(
                                    event.target.value
                                )
                            }
                            rows={4}
                            placeholder="Add approval/rejection note..."
                            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs leading-5 text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                        />
                    </div>

                    {selectedRegularization.requestType ===
                        "Absent Correction" && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-xs font-semibold text-amber-800">
                                Approval will create the missing attendance record.
                            </p>
                        </div>
                    )}

                    {[
                        "Work From Home",
                        "Client Site",
                    ].includes(
                        selectedRegularization.requestType
                    ) && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                            <p className="text-xs font-semibold text-blue-800">
                                Approval will record this as valid attendance and preserve the work mode in the attendance note.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={() =>
                            handleRegularizationDecision(
                                "Rejected"
                            )
                        }
                        className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                        <XCircle size={15} />
                        Reject
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            handleRegularizationDecision(
                                "Approved"
                            )
                        }
                        className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                        <CheckCircle2 size={15} />
                        Approve & Apply
                    </button>
                </div>
            </div>
        </div>
    </>
)}
{activeTab === "absence" && (
    <div>
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/60 p-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h3 className="text-sm font-semibold text-slate-950">
                    Absence Analysis
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                    Detect repeated absence, consecutive absence streaks and attendance risk.
                </p>
            </div>

            <div>
                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Analysis Period
                </label>

                <select
                    value={absenceDays}
                    onChange={(event) =>
                        setAbsenceDays(
                            Number(event.target.value)
                        )
                    }
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                    <option value={7}>
                        Last 7 Days
                    </option>

                    <option value={15}>
                        Last 15 Days
                    </option>

                    <option value={30}>
                        Last 30 Days
                    </option>

                    <option value={60}>
                        Last 60 Days
                    </option>

                    <option value={90}>
                        Last 90 Days
                    </option>
                </select>
            </div>
        </div>

        <div className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-3">
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-rose-600">
                    Employees With Absence
                </p>

                <p className="mt-2 text-2xl font-bold text-rose-800">
                    {
                        absenceSummary.employeesWithAbsence
                    }
                </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-600">
                    3+ Day Streak
                </p>

                <p className="mt-2 text-2xl font-bold text-amber-800">
                    {
                        absenceSummary.employeesWith3DayStreak
                    }
                </p>
            </div>

            <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-violet-600">
                    Total Absent Days
                </p>

                <p className="mt-2 text-2xl font-bold text-violet-800">
                    {
                        absenceSummary.totalAbsentDays
                    }
                </p>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Employee
                        </th>

                        <th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Absent Days
                        </th>

                        <th className="px-4 py-3 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Longest Streak
                        </th>

                        <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Recent Absent Dates
                        </th>

                        <th className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Risk
                        </th>

                        <th className="px-5 py-3 text-right text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Details
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                    {absenceAnalysis.map(
                        (item) => (
                            <tr
                                key={item.employeeId}
                                className="transition hover:bg-violet-50/30"
                            >
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-bold text-white">
                                            {item.employeeName
                                                ?.split(" ")
                                                .map(
                                                    (part) =>
                                                        part[0]
                                                )
                                                .join("")
                                                .substring(
                                                    0,
                                                    2
                                                )
                                                .toUpperCase()}
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold text-slate-900">
                                                {
                                                    item.employeeName
                                                }
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {
                                                    item.employeeCode
                                                }
                                                {item.department
                                                    ? ` · ${item.department}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-4 text-center">
                                    <span className="text-lg font-bold text-rose-700">
                                        {
                                            item.totalAbsentDays
                                        }
                                    </span>
                                </td>

                                <td className="px-4 py-4 text-center">
                                    <span
                                        className={`font-bold ${
                                            item.longestStreak >=
                                            3
                                                ? "text-rose-700"
                                                : item.longestStreak >=
                                                    2
                                                  ? "text-amber-700"
                                                  : "text-slate-700"
                                        }`}
                                    >
                                        {
                                            item.longestStreak
                                        }{" "}
                                        day
                                        {item.longestStreak ===
                                        1
                                            ? ""
                                            : "s"}
                                    </span>
                                </td>

                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {(item.absentDates ||
                                            [])
                                            .slice(-5)
                                            .map(
                                                (date) => (
                                                    <span
                                                        key={
                                                            date
                                                        }
                                                        className="rounded-lg bg-rose-50 px-2 py-1 text-[9px] font-semibold text-rose-700"
                                                    >
                                                        {
                                                            date
                                                        }
                                                    </span>
                                                )
                                            )}

                                        {(item.absentDates ||
                                            []).length >
                                            5 && (
                                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                                                +
                                                {(item.absentDates ||
                                                    [])
                                                    .length -
                                                    5}
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td className="px-4 py-4">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getWarningClasses(
                                            item.warningLevel
                                        )}`}
                                    >
                                        {
                                            item.warningLevel
                                        }
                                    </span>
                                </td>

                                <td className="px-5 py-4">
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedAbsenceEmployee(
                                                    item
                                                )
                                            }
                                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </div>

        {!absenceLoading &&
            absenceAnalysis.length === 0 && (
                <div className="flex min-h-60 flex-col items-center justify-center text-center">
                    <CheckCircle2
                        size={30}
                        className="text-emerald-400"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-900">
                        No absence issues found
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        No employees have unexcused absence in this period.
                    </p>
                </div>
            )}
    </div>
)}
{selectedAbsenceEmployee && (
    <>
        <button
            type="button"
            aria-label="Close absence details"
            onClick={() =>
                setSelectedAbsenceEmployee(
                    null
                )
            }
            className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]"
        />

        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">
                            Absence Details
                        </p>

                        <h2 className="mt-2 text-lg font-semibold text-slate-950">
                            {
                                selectedAbsenceEmployee.employeeName
                            }
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            {
                                selectedAbsenceEmployee.employeeCode
                            }
                            {" · "}
                            {
                                selectedAbsenceEmployee.totalAbsentDays
                            }{" "}
                            absent day(s)
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            setSelectedAbsenceEmployee(
                                null
                            )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-rose-50 p-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-rose-600">
                                Total Absent
                            </p>

                            <p className="mt-2 text-xl font-bold text-rose-800">
                                {
                                    selectedAbsenceEmployee.totalAbsentDays
                                }
                            </p>
                        </div>

                        <div className="rounded-xl bg-amber-50 p-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-600">
                                Longest Streak
                            </p>

                            <p className="mt-2 text-xl font-bold text-amber-800">
                                {
                                    selectedAbsenceEmployee.longestStreak
                                }
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                Warning Level
                            </p>

                            <span
                                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getWarningClasses(
                                    selectedAbsenceEmployee.warningLevel
                                )}`}
                            >
                                {
                                    selectedAbsenceEmployee.warningLevel
                                }
                            </span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-slate-900">
                            Absence Periods
                        </h3>

                        <div className="mt-3 space-y-2">
                            {(selectedAbsenceEmployee.streaks ||
                                []).map(
                                (streak, index) => (
                                    <div
                                        key={`${streak.fromDate}-${index}`}
                                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                    >
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800">
                                                {
                                                    streak.fromDate
                                                }{" "}
                                                to{" "}
                                                {
                                                    streak.toDate
                                                }
                                            </p>
                                        </div>

                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                                streak.days >=
                                                3
                                                    ? "bg-rose-100 text-rose-700"
                                                    : "bg-amber-100 text-amber-700"
                                            }`}
                                        >
                                            {
                                                streak.days
                                            }{" "}
                                            day
                                            {streak.days ===
                                            1
                                                ? ""
                                                : "s"}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-slate-900">
                            All Absent Dates
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {(selectedAbsenceEmployee.absentDates ||
                                []).map(
                                (date) => (
                                    <span
                                        key={date}
                                        className="rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-[10px] font-semibold text-rose-700"
                                    >
                                        {date}
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-slate-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={() =>
                            setSelectedAbsenceEmployee(
                                null
                            )
                        }
                        className="h-10 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    </>
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
                                <table className="enterprise-table min-w-[900px] w-full">
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
    {monthlyRegister.map((employee) => {
        const summary =
            employee.summary || {};

        const attendanceRate =
            Number(
                summary.attendanceRate || 0
            );

        return (
            <tr
                key={employee.employeeId}
                className="transition hover:bg-slate-50/70"
            >
                <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold text-white">
                            {employee.employeeName
                                ?.split(" ")
                                .map((part) => part[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()}
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-slate-900">
                                {employee.employeeName}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-500">
                                {employee.department}
                            </p>
                        </div>
                    </div>
                </td>

                <td className="px-4 py-4 text-center text-xs font-semibold text-emerald-700">
                    {summary.present || 0}
                </td>

                <td className="px-4 py-4 text-center text-xs font-semibold text-amber-700">
                    {summary.late || 0}
                </td>

                <td className="px-4 py-4 text-center text-xs font-semibold text-blue-700">
                    {summary.halfDay || 0}
                </td>

                <td className="px-4 py-4 text-center text-xs font-semibold text-rose-700">
                    {summary.absent || 0}
                </td>

                <td className="px-4 py-4 text-center text-xs font-semibold text-violet-700">
                    {summary.leave || 0}
                </td>

                <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{
                                    width:
                                        `${Math.min(
                                            attendanceRate,
                                            100
                                        )}%`,
                                }}
                            />
                        </div>

                        <span className="text-xs font-semibold text-slate-700">
                            {attendanceRate}%
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
                        className="enterprise-backdrop fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[620px] flex-col overflow-hidden border-l border-slate-200 bg-[#f8fafc] shadow-[-30px_0_90px_rgba(15,23,42,0.22)]">
                        <div className="relative flex items-start justify-between overflow-hidden border-b border-slate-200 bg-white px-6 py-6">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500" />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
    Attendance Management
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
                            <div className="flex-1 space-y-6 overflow-y-auto p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
    <label className="mb-2 block text-xs font-semibold text-slate-700">
        Attendance Status
    </label>

    <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${getStatusClasses(
                selectedAttendance?.attendanceStatus ||
                    selectedAttendance?.status
            )}`}
        >
            {selectedAttendance?.attendanceStatus ||
                selectedAttendance?.status ||
                "—"}
        </span>
    </div>

    <p className="mt-1.5 text-[10px] text-slate-400">
        Status is calculated automatically from attendance timings.
    </p>
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
                        className="enterprise-backdrop fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="enterprise-modal w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
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
         </div>
    );
}
