import API_URL from "../config/api";
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

const officeSettings = {
    startTime: "10:00",
    endTime: "18:00",
    lateAfter: "10:15",
    fullDayMinutes: 480,
};

const emptyLeaveForm = {
    leaveType: "Casual Leave",
    fromDate: "",
    toDate: "",
    duration: "Full Day",
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



function getCalendarDays(year, month) {
    const firstDay =
        new Date(year, month, 1);

    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );

    const days = [];

    for (
        let index = 0;
        index <
        firstDay.getDay();
        index += 1
    ) {
        days.push(null);
    }

    for (
        let day = 1;
        day <=
        lastDay.getDate();
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

    while (
        days.length % 7 !==
        0
    ) {
        days.push(null);
    }

    return days;
}

function getAttendanceStatusClasses(status) {
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

function getLeaveStatusClasses(status) {
    const styles = {
        Pending: "bg-amber-50 text-amber-700 ring-amber-600/10",
        Approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Rejected: "bg-rose-50 text-rose-700 ring-rose-600/10",
        Cancelled:
            "bg-slate-100 text-slate-600 ring-slate-500/10",
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

        id:
            record._id ||
            record.id ||
            record.date,

        loginTime:
            toTimeInput(
                record.loginTime
            ),

        logoutTime:
            toTimeInput(
                record.logoutTime
            ),

        breakStartedAt:
            toTimeInput(
                record.breakStartedAt
            ),

        breakMinutes:
            Number(
                record.totalBreakMinutes ??
                record.breakMinutes ??
                0
            ),

        workedMinutes:
            Number(
                record.totalWorkedMinutes ??
                record.workingMinutes ??
                0
            ),

        status:
            record.status ||
            record.attendanceStatus ||
            "",
    });
    const [activeTab, setActiveTab] = useState("today");
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);

    const [attendanceStatus, setAttendanceStatus] =
        useState("Absent");

    const breakActive =
        attendanceStatus === "Break";

    const attendanceBlockedToday = [
        "Holiday",
        "Weekly Off",
        "On Leave",
    ].includes(attendanceStatus);
    const [loginTime, setLoginTime] = useState("");
    const [logoutTime, setLogoutTime] = useState("");

    const [breakMinutes, setBreakMinutes] = useState(0);
    const [breakStartedAt, setBreakStartedAt] = useState(null);
    const [todayWorkedMinutes, setTodayWorkedMinutes] =
        useState(0);

    const [calendarDate, setCalendarDate] = useState(
        new Date()
    );
    const [monthlyData, setMonthlyData] = useState([]);
    const [monthlyStats, setMonthlyStats] = useState({
        present: 0,
        late: 0,
        halfDay: 0,
        absent: 0,
        leave: 0,
        holiday: 0,
        weeklyOff: 0,
        missedPunch: 0,
        workingDays: 0,
        attendanceRate: 0,
        totalWorkedMinutes: 0,
        overtimeMinutes: 0,
    });

    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const [holidays, setHolidays] = useState([]);
    const [holidayLoading, setHolidayLoading] = useState(false);

    const [holidayYear, setHolidayYear] = useState(
        new Date().getFullYear()
    );
    const [regularizations, setRegularizations] = useState([]);
    const [regularizationLoading, setRegularizationLoading] = useState(false);
    const [regularizationDrawerOpen, setRegularizationDrawerOpen] =
        useState(false);

    const [regularizationForm, setRegularizationForm] = useState({
        date: "",
        requestType: "Absent Correction",
        requestedLoginTime: "",
        requestedLogoutTime: "",
        reason: "",
    });
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [leaveLoading, setLeaveLoading] = useState(false);

    const [leaveCalculation, setLeaveCalculation] = useState({
        days: 0,
        dates: [],
        balance: null,
        sufficientBalance: true,
    });

    const [leaveDrawerOpen, setLeaveDrawerOpen] = useState(false);
    const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);

    const workedMinutes =
        todayWorkedMinutes;

    const monthlySummary =
        monthlyStats;

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
    const monthlyRecordMap =
        useMemo(() => {
            const map = {};

            for (
                const record of
                monthlyData
            ) {
                if (record?.date) {
                    map[record.date] =
                        record;
                }
            }

            return map;
        }, [monthlyData]);

    const requestedLeaveDays =
        Number(
            leaveCalculation.days || 0
        );
    const loadLeaveData = async () => {
        try {
            setLeaveLoading(true);

            const headers = {
                Authorization:
                    `Bearer ${getAuthToken()}`,
            };

            const [
                balanceResponse,
                leaveResponse,
            ] = await Promise.all([
                fetch(
                    `${API_URL}/api/attendance/leave/balances`,
                    { headers }
                ),

                fetch(
                    `${API_URL}/api/attendance/leave/my`,
                    { headers }
                ),
            ]);

            const [
                balanceResult,
                leaveResult,
            ] = await Promise.all([
                balanceResponse.json(),
                leaveResponse.json(),
            ]);

            if (
                !balanceResponse.ok ||
                !balanceResult.success
            ) {
                throw new Error(
                    balanceResult.message ||
                    "Unable to load leave balances."
                );
            }

            if (
                !leaveResponse.ok ||
                !leaveResult.success
            ) {
                throw new Error(
                    leaveResult.message ||
                    "Unable to load leave requests."
                );
            }

            setLeaveBalances(
                balanceResult.data || []
            );

            setLeaveRequests(
                (leaveResult.data || []).map(
                    (leave) => ({
                        ...leave,
                        id:
                            leave._id ||
                            leave.id,

                        appliedOn:
                            leave.appliedAt
                                ? String(
                                    leave.appliedAt
                                ).slice(0, 10)
                                : "",
                    })
                )
            );
        } catch (error) {
            console.error(
                "Load Leave Data:",
                error
            );
        } finally {
            setLeaveLoading(false);
        }
    };
    const loadRegularizations = async () => {
        try {
            setRegularizationLoading(true);

            const response = await fetch(
                `${API_URL}/api/attendance/regularization/my`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to load regularization requests."
                );
            }

            setRegularizations(
                (result.data || []).map((item) => ({
                    ...item,
                    id: item._id || item.id,
                }))
            );
        } catch (error) {
            console.error(
                "Load Regularizations:",
                error
            );
        } finally {
            setRegularizationLoading(false);
        }
    };
    const loadHolidays = async () => {
        try {
            setHolidayLoading(true);

            const response = await fetch(
                `${API_URL}/api/attendance/holidays?year=${holidayYear}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getAuthToken()}`,
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
                    "Unable to load holidays."
                );
            }

            setHolidays(
                result.data || []
            );
        } catch (error) {
            console.error(
                "Load Holidays:",
                error
            );
        } finally {
            setHolidayLoading(false);
        }
    };
    const loadMonthlyAttendance = async () => {
        try {
            setMonthlyLoading(true);

            const month =
                getCalendarMonthKey();

            const response = await fetch(
                `${API_URL}/api/attendance/month?month=${encodeURIComponent(
                    month
                )}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${getAuthToken()}`,
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
                    "Unable to load monthly attendance."
                );
            }

            // IMPORTANT:
            // backend returns "calendar", not "data"
            setMonthlyData(
                result.calendar || []
            );

            const summary =
                result.summary || {};

            setMonthlyStats({
                present:
                    Number(
                        summary.present || 0
                    ),

                late:
                    Number(
                        summary.late || 0
                    ),

                halfDay:
                    Number(
                        summary.halfDay || 0
                    ),

                absent:
                    Number(
                        summary.absent || 0
                    ),

                leave:
                    Number(
                        summary.leave || 0
                    ),

                holiday:
                    Number(
                        summary.holidays || 0
                    ),

                weeklyOff:
                    Number(
                        summary.weeklyOff || 0
                    ),

                missedPunch:
                    Number(
                        summary.missedPunch || 0
                    ),

                workingDays:
                    Number(
                        summary.workingDays || 0
                    ),

                attendanceRate:
                    Number(
                        summary.attendanceRate || 0
                    ),

                totalWorkedMinutes:
                    Number(
                        summary.totalWorkedMinutes || 0
                    ),

                overtimeMinutes:
                    Number(
                        summary.overtimeMinutes || 0
                    ),
            });
        } catch (error) {
            console.error(
                "Monthly Attendance:",
                error
            );
        } finally {
            setMonthlyLoading(false);
        }
    };

    const loadData = async () => {
        const headers = { Authorization: `Bearer ${getAuthToken()}` };
        const [
            todayResponse,
            historyResponse,
        ] = await Promise.all([
            fetch(
                `${API_URL}/api/attendance/today`,
                { headers }
            ),

            fetch(
                `${API_URL}/api/attendance/history`,
                { headers }
            ),
        ]);
        const [
            today,
            history
        ] = await Promise.all([
            todayResponse.json(),
            historyResponse.json()
        ]);
        if (
            !todayResponse.ok ||
            !historyResponse.ok
        ) {
            throw new Error(
                today.message ||
                history.message ||
                "Unable to load attendance."
            );
        }
        const current = today.data ? normalizeAttendance(today.data) : null;
        setAttendanceHistory((history.data || []).map(normalizeAttendance));

        setAttendanceStatus(current?.workStatus || current?.status || "Absent");
        setLoginTime(current?.loginTime || "");
        setLogoutTime(current?.logoutTime || "");
        setBreakMinutes(Number(current?.breakMinutes || 0));
        setBreakStartedAt(current?.breakStartedAt || null);
        setTodayWorkedMinutes(
            Number(
                current?.workedMinutes ||
                0
            )
        );
    };
    const calculateSelectedLeave = async () => {
        if (
            !leaveForm.fromDate ||
            !leaveForm.toDate ||
            !leaveForm.leaveType
        ) {
            setLeaveCalculation({
                days: 0,
                dates: [],
                balance: null,
                sufficientBalance: true,
            });

            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/attendance/leave/calculate`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${getAuthToken()}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        leaveType:
                            leaveForm.leaveType,

                        fromDate:
                            leaveForm.fromDate,

                        toDate:
                            leaveForm.toDate,

                        duration:
                            leaveForm.duration,
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
                    "Unable to calculate leave."
                );
            }

            setLeaveCalculation({
                days:
                    Number(
                        result.data?.days || 0
                    ),

                dates:
                    result.data?.dates || [],

                balance:
                    result.data?.balance || null,

                sufficientBalance:
                    result.data
                        ?.sufficientBalance !==
                    false,
            });
        } catch (error) {
            console.error(
                "Leave Calculation:",
                error
            );

            setLeaveCalculation({
                days: 0,
                dates: [],
                balance: null,
                sufficientBalance: false,
            });
        }
    };
    useEffect(() => {
        loadData().catch((error) => console.error("Attendance:", error));
    }, []);
    useEffect(() => {
        loadMonthlyAttendance();
    }, [calendarDate]);
    useEffect(() => {
        if (
            activeTab === "holidays"
        ) {
            loadHolidays();
        }
    }, [
        activeTab,
        holidayYear,
    ]);
    useEffect(() => {
        if (activeTab === "regularization") {
            loadRegularizations();
        }
    }, [activeTab]);
    useEffect(() => {
        loadLeaveData();
    }, []);
    useEffect(() => {
        calculateSelectedLeave();
    }, [
        leaveForm.leaveType,
        leaveForm.fromDate,
        leaveForm.toDate,
        leaveForm.duration,
    ]);

 const handleAttendanceToggle = async () => {
    const isEndingWorkday =
        attendanceStatus === "Working" ||
        attendanceStatus === "Break";

    const endpoint = isEndingWorkday
        ? "logout"
        : "login";

    try {
        /*
        =========================================================
        1. UPDATE ATTENDANCE ON MAIN BACKEND FIRST
        =========================================================

        We only stop/start the local Windows agent AFTER the
        attendance operation succeeds.
        */

        const response = await fetch(
            `${API_URL}/api/attendance/${endpoint}`,
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${getAuthToken()}`,

                    "Content-Type":
                        "application/json",
                },

                body: JSON.stringify({
                    source: "web",
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
                "Attendance update failed."
            );
        }

        /*
        =========================================================
        2. END WORKDAY -> STOP LOCAL AGENT
        =========================================================
        */

        if (isEndingWorkday) {
            try {
                const agentResponse =
                    await fetch(
                        "http://127.0.0.1:4500/logout",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );

                const agentResult =
                    await agentResponse.json();

                if (
                    !agentResponse.ok ||
                    !agentResult.success
                ) {
                    console.warn(
                        "ClientConnect Agent stop warning:",
                        agentResult.message
                    );
                } else {
                    console.log(
                        "ClientConnect Agent stopped:",
                        agentResult.message
                    );
                }
            } catch (agentError) {
                /*
                 * IMPORTANT:
                 *
                 * Attendance End Workday has already succeeded.
                 * Do NOT undo/fail attendance just because
                 * the local agent is unavailable.
                 */

                console.warn(
                    "ClientConnect Agent could not be stopped:",
                    agentError
                );
            }
        }

        /*
        =========================================================
        3. START WORKDAY -> START LOCAL AGENT
        =========================================================

        This is also useful if the employee starts the workday
        manually from this attendance screen.
        */

        if (!isEndingWorkday) {
            try {
                /*
                 * Get current user stored by your login system.
                 */

                const storedUserRaw =
                    localStorage.getItem(
                        "client-connect-current-user"
                    );

                const storedUser =
                    storedUserRaw
                        ? JSON.parse(storedUserRaw)
                        : null;

                const employeeCode =
                    storedUser?.employeeCode ||
                    storedUser?.code ||
                    "";

                if (employeeCode) {
                    const agentResponse =
                        await fetch(
                            "http://127.0.0.1:4500/login",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },

                                body:
                                    JSON.stringify({
                                        employeeCode,
                                    }),
                            }
                        );

                    const agentResult =
                        await agentResponse.json();

                    if (
                        !agentResponse.ok ||
                        !agentResult.success
                    ) {
                        console.warn(
                            "ClientConnect Agent start warning:",
                            agentResult.message
                        );
                    } else {
                        console.log(
                            "ClientConnect Agent started:",
                            agentResult.message
                        );
                    }
                }
            } catch (agentError) {
                console.warn(
                    "ClientConnect Agent could not be started:",
                    agentError
                );
            }
        }

        /*
        =========================================================
        4. REFRESH ATTENDANCE UI
        =========================================================
        */

        await Promise.all([
            loadData(),
            loadMonthlyAttendance(),
        ]);

    } catch (error) {
        console.error(
            "Attendance toggle error:",
            error
        );

        alert(
            error.message ||
            "Unable to update attendance."
        );
    }
};

    const handleBreakToggle = async () => {
        if (attendanceStatus !== "Working" && attendanceStatus !== "Break") return;

        const endpoint = attendanceStatus === "Break" ? "break/end" : "break/start";

        try {
            const response = await fetch(`${API_URL}/api/attendance/${endpoint}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getAuthToken()}`, "Content-Type": "application/json" },
                body: JSON.stringify({ source: "web" }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || "Break update failed.");
            await Promise.all([
                loadData(),
                loadMonthlyAttendance(),
            ]);
        } catch (error) {
            alert(error.message);
        }
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
    const getCalendarMonthKey = () => {
        return `${calendarDate.getFullYear()}-${String(
            calendarDate.getMonth() + 1
        ).padStart(2, "0")}`;
    };

    const openRegularizationDrawer = () => {
        setRegularizationForm({
            date: "",
            requestType: "Absent Correction",
            requestedLoginTime: "",
            requestedLogoutTime: "",
            reason: "",
        });

        setRegularizationDrawerOpen(true);
    };

    const closeRegularizationDrawer = () => {
        setRegularizationDrawerOpen(false);

        setRegularizationForm({
            date: "",
            requestType: "Absent Correction",
            requestedLoginTime: "",
            requestedLogoutTime: "",
            reason: "",
        });
    };

    const handleRegularizationFormChange = (event) => {
        const { name, value } = event.target;

        setRegularizationForm((current) => ({
            ...current,
            [name]: value,
        }));
    };
    const submitRegularization = async (event) => {
        event.preventDefault();

        if (!regularizationForm.date) {
            alert("Please select attendance date.");
            return;
        }

        if (!regularizationForm.reason.trim()) {
            alert("Please enter the correction reason.");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/attendance/regularization`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${getAuthToken()}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        date:
                            regularizationForm.date,

                        requestType:
                            regularizationForm.requestType,

                        requestedLoginTime:
                            regularizationForm.requestedLoginTime,

                        requestedLogoutTime:
                            regularizationForm.requestedLogoutTime,

                        reason:
                            regularizationForm.reason.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to submit attendance correction."
                );
            }

            await loadRegularizations();

            closeRegularizationDrawer();

            setActiveTab("regularization");
        } catch (error) {
            alert(error.message);
        }
    };
    const cancelRegularization = async (request) => {
        const confirmed = window.confirm(
            `Cancel this ${request.requestType} request?`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `${API_URL}/api/attendance/regularization/${request.id}/cancel`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${getAuthToken()}`,

                        "Content-Type":
                            "application/json",
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to cancel correction request."
                );
            }

            await loadRegularizations();
        } catch (error) {
            alert(error.message);
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
    const handleLeaveFormChange = (event) => {
        const { name, value } =
            event.target;

        setLeaveForm((current) => {
            const updated = {
                ...current,
                [name]: value,
            };

            /*
             * Half-day leave must always
             * belong to a single date.
             */
            if (
                name === "duration" &&
                value !== "Full Day" &&
                current.fromDate
            ) {
                updated.toDate =
                    current.fromDate;
            }

            /*
             * If employee changes From Date
             * while Half Day is selected,
             * keep To Date identical.
             */
            if (
                name === "fromDate" &&
                current.duration !== "Full Day"
            ) {
                updated.toDate =
                    value;
            }

            return updated;
        });
    };

    const closeLeaveDrawer = () => {
        setLeaveDrawerOpen(false);
        setLeaveForm(emptyLeaveForm);
    };

    const cancelLeaveRequest = async (request) => {
        const confirmed = window.confirm(
            `Cancel your ${request.leaveType} request from ${request.fromDate} to ${request.toDate}?`
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `${API_URL}/api/attendance/leave/${request.id}/cancel`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${getAuthToken()}`,

                        "Content-Type":
                            "application/json",
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to cancel leave request."
                );
            }

            await Promise.all([
                loadLeaveData(),
                loadMonthlyAttendance(),
            ]);
        } catch (error) {
            alert(error.message);
        }
    };
    const submitLeaveRequest = async (event) => {
        event.preventDefault();

        if (
            !leaveForm.fromDate ||
            !leaveForm.toDate
        ) {
            alert(
                "Please select leave dates."
            );
            return;
        }

        if (
            requestedLeaveDays <= 0
        ) {
            alert(
                "The selected period has no chargeable leave days."
            );
            return;
        }

        if (
            !leaveCalculation.sufficientBalance
        ) {
            alert(
                "Insufficient leave balance."
            );
            return;
        }

        if (
            !leaveForm.reason.trim()
        ) {
            alert(
                "Please enter the reason for leave."
            );
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/attendance/leave/request`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${getAuthToken()}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        leaveType:
                            leaveForm.leaveType,

                        fromDate:
                            leaveForm.fromDate,

                        toDate:
                            leaveForm.toDate,

                        duration:
                            leaveForm.duration,

                        reason:
                            leaveForm.reason.trim(),

                        contactDuringLeave:
                            leaveForm.contactDuringLeave.trim(),
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
                    "Unable to submit leave request."
                );
            }

            await Promise.all([
                loadLeaveData(),
                loadMonthlyAttendance(),
            ]);

            closeLeaveDrawer();

            setActiveTab("leave");
        } catch (error) {
            alert(error.message);
        }
    };
    const activeHolidays =
        holidays.filter(
            (holiday) =>
                holiday.isActive !== false
        );

    const nationalHolidayCount =
        activeHolidays.filter(
            (holiday) =>
                holiday.type ===
                "National"
        ).length;

    const companyHolidayCount =
        activeHolidays.filter(
            (holiday) =>
                holiday.type ===
                "Company"
        ).length;

    const optionalHolidayCount =
        activeHolidays.filter(
            (holiday) =>
                holiday.type ===
                "Optional"
        ).length;

    const todayDate =
        new Date()
            .toISOString()
            .slice(0, 10);

    const upcomingHolidays =
        activeHolidays.filter(
            (holiday) =>
                holiday.date >=
                todayDate
        );

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
                            {
                                id: "holidays",
                                label: "Holidays",
                            },
                            {
                                id: "regularization",
                                label: "Regularization",
                            },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap rounded-lg px-4 py-2 text-[11px] font-semibold transition ${activeTab === tab.id
                                    ? "bg-white text-slate-950 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <span
                        className={`inline-flex w-fit rounded-full px-3 py-1.5 text-[10px] font-bold ring-1 ring-inset ${attendanceStatus === "Working"
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
                                            {new Date().toLocaleDateString(
                                                "en-IN",
                                                {
                                                    weekday: "long",
                                                    day: "2-digit",
                                                    month: "long",
                                                    year: "numeric",
                                                }
                                            )}
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
                                        className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ring-1 ring-inset ${attendanceStatus === "Holiday"
                                            ? "bg-cyan-50 text-cyan-700 ring-cyan-600/10"

                                            : attendanceStatus === "Weekly Off"
                                                ? "bg-slate-100 text-slate-600 ring-slate-500/10"

                                                : attendanceStatus === "On Leave"
                                                    ? "bg-violet-50 text-violet-700 ring-violet-600/10"

                                                    : !loginTime
                                                        ? "bg-slate-100 text-slate-600 ring-slate-500/10"

                                                        : loginTime > officeSettings.lateAfter
                                                            ? "bg-amber-50 text-amber-700 ring-amber-600/10"

                                                            : "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                                            }`}
                                    >
                                        {attendanceStatus === "Holiday"
                                            ? "Holiday"

                                            : attendanceStatus === "Weekly Off"
                                                ? "Weekly Off"

                                                : attendanceStatus === "On Leave"
                                                    ? "Approved Leave"

                                                    : !loginTime
                                                        ? "Not Started"

                                                        : loginTime > officeSettings.lateAfter
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
                                            !loginTime ||
                                            !!logoutTime ||
                                            !["Working", "Break"].includes(attendanceStatus)
                                        }
                                        className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${breakActive
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
                                            attendanceStatus === "Logged Out" ||
                                            attendanceBlockedToday
                                        }
                                        className={`flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition ${attendanceStatus === "Working" || attendanceStatus === "Break"
                                            ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                            : "bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            }`}
                                    >
                                        {attendanceStatus === "Working" || attendanceStatus === "Break" ? (
                                            <LogOut size={15} />
                                        ) : (
                                            <LogIn size={15} />
                                        )}

                                        {attendanceStatus === "Working" ||
                                            attendanceStatus === "Break"
                                            ? "End Workday"
                                            : attendanceStatus === "Logged Out"
                                                ? "Workday Completed"
                                                : attendanceStatus === "Holiday"
                                                    ? "Company Holiday"
                                                    : attendanceStatus === "Weekly Off"
                                                        ? "Weekly Off"
                                                        : attendanceStatus === "On Leave"
                                                            ? "Approved Leave"
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

                                <div className="relative space-y-5 p-5">

                                    {!loginTime && (
                                        <div className="flex min-h-40 flex-col items-center justify-center text-center">

                                            <Clock3
                                                size={28}
                                                className="text-slate-300"
                                            />

                                            <p className="mt-3 text-xs font-semibold text-slate-800">
                                                {attendanceStatus === "Holiday"
                                                    ? "Company Holiday"

                                                    : attendanceStatus === "Weekly Off"
                                                        ? "Weekly Off"

                                                        : attendanceStatus === "On Leave"
                                                            ? "Approved Leave"

                                                            : "Workday not started"}
                                            </p>

                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {attendanceStatus === "Holiday"
                                                    ? "No attendance is required today."

                                                    : attendanceStatus === "Weekly Off"
                                                        ? "Today is your scheduled weekly off."

                                                        : attendanceStatus === "On Leave"
                                                            ? "Your leave is approved for today."

                                                            : "Start your workday to begin attendance tracking."}
                                            </p>

                                        </div>
                                    )}

                                    {loginTime && (
                                        <div className="relative space-y-5 before:absolute before:bottom-7 before:left-[24px] before:top-7 before:w-px before:bg-slate-200">
                                            {[
                                                loginTime && {
                                                    id: 1,
                                                    title: "Logged in",
                                                    description: formatTime(loginTime),
                                                    icon: LogIn,
                                                    iconClass: "bg-emerald-100 text-emerald-700",
                                                },

                                                breakMinutes > 0 && {
                                                    id: 2,
                                                    title: "Break time today",
                                                    description: `${formatDuration(breakMinutes)} total`,
                                                    icon: Coffee,
                                                    iconClass: "bg-amber-100 text-amber-700",
                                                },
                                                loginTime && {
                                                    id: 3,

                                                    title:
                                                        breakActive
                                                            ? "Break active"

                                                            : attendanceStatus === "Logged Out"
                                                                ? "Logged out"

                                                                : "Currently working",

                                                    description:
                                                        breakActive
                                                            ? `Started at ${formatTime(
                                                                breakStartedAt
                                                            )}`

                                                            : attendanceStatus === "Logged Out"
                                                                ? formatTime(
                                                                    logoutTime
                                                                )

                                                                : "Work session active",

                                                    icon:
                                                        breakActive
                                                            ? Coffee

                                                            : attendanceStatus === "Logged Out"
                                                                ? LogOut

                                                                : Timer,

                                                    iconClass:
                                                        breakActive
                                                            ? "bg-amber-100 text-amber-700"

                                                            : attendanceStatus === "Logged Out"
                                                                ? "bg-rose-100 text-rose-700"

                                                                : "bg-violet-100 text-violet-700",
                                                },
                                            ].filter(Boolean).map((item) => {
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
                                    )}
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
                                            {record.loginTime ? (
                                                <div className="flex items-center gap-2 text-xs text-slate-700">
                                                    <LogIn
                                                        size={14}
                                                        className="text-emerald-600"
                                                    />

                                                    {formatTime(
                                                        record.loginTime
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            {record.logoutTime ? (
                                                <div className="flex items-center gap-2 text-xs text-slate-700">
                                                    <LogOut
                                                        size={14}
                                                        className="text-rose-500"
                                                    />

                                                    {formatTime(
                                                        record.logoutTime
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-4 text-xs text-slate-600">
                                            {[
                                                "Holiday",
                                                "Weekly Off",
                                                "On Leave",
                                                "Absent",
                                            ].includes(record.status)
                                                ? "—"
                                                : formatDuration(
                                                    record.breakMinutes
                                                )}
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="text-xs font-semibold text-slate-900">
                                                {[
                                                    "Holiday",
                                                    "Weekly Off",
                                                    "On Leave",
                                                    "Absent",
                                                ].includes(record.status)
                                                    ? "—"
                                                    : formatDuration(
                                                        record.workedMinutes
                                                    )}
                                            </p>

                                            {record.workedMinutes > 0 && (
                                                <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className="h-full rounded-full bg-violet-500"
                                                        style={{
                                                            width: `${Math.min(
                                                                (
                                                                    record.workedMinutes /
                                                                    officeSettings.fullDayMinutes
                                                                ) * 100,
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getAttendanceStatusClasses(
                                                    record.status
                                                )}`}
                                            >
                                                {record.status || "—"}
                                            </span>

                                            {record.holidayName && (
                                                <p className="mt-1.5 text-[9px] font-medium text-cyan-700">
                                                    {record.holidayName}
                                                </p>
                                            )}

                                            {record.leaveType && (
                                                <p className="mt-1.5 text-[9px] font-medium text-violet-700">
                                                    {record.leaveType}
                                                </p>
                                            )}

                                            {record.missedPunch && (
                                                <p className="mt-1.5 text-[9px] font-semibold text-orange-600">
                                                    Punch incomplete
                                                </p>
                                            )}

                                            {record.status === "Absent" && (
                                                <p className="mt-1.5 text-[9px] text-rose-500">
                                                    No attendance recorded
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {monthlyLoading && (
                    <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                        <p className="text-xs font-medium text-violet-700">
                            Loading monthly attendance...
                        </p>
                    </div>
                )}

                {activeTab === "calendar" && (
                    <div className="p-5">
                        {monthlyLoading && (
                            <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                                <p className="text-xs font-medium text-violet-700">
                                    Loading monthly attendance...
                                </p>
                            </div>
                        )}
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

                            <div className="grid gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-4 xl:grid-cols-8">
                                {[
                                    {
                                        label: "Present",
                                        value:
                                            monthlySummary.present,
                                        className:
                                            "bg-emerald-50 text-emerald-700",
                                    },

                                    {
                                        label: "Late",
                                        value:
                                            monthlySummary.late,
                                        className:
                                            "bg-amber-50 text-amber-700",
                                    },

                                    {
                                        label: "Half Day",
                                        value:
                                            monthlySummary.halfDay,
                                        className:
                                            "bg-blue-50 text-blue-700",
                                    },

                                    {
                                        label: "Absent",
                                        value:
                                            monthlySummary.absent,
                                        className:
                                            "bg-rose-50 text-rose-700",
                                    },

                                    {
                                        label: "Leave",
                                        value:
                                            monthlySummary.leave,
                                        className:
                                            "bg-violet-50 text-violet-700",
                                    },

                                    {
                                        label: "Holiday",
                                        value:
                                            monthlySummary.holiday,
                                        className:
                                            "bg-cyan-50 text-cyan-700",
                                    },

                                    {
                                        label: "Weekly Off",
                                        value:
                                            monthlySummary.weeklyOff,
                                        className:
                                            "bg-slate-100 text-slate-700",
                                    },

                                    {
                                        label: "Attendance",
                                        value:
                                            `${monthlySummary.attendanceRate}%`,
                                        className:
                                            "bg-indigo-50 text-indigo-700",
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

                                        const record =
                                            monthlyRecordMap[dateKey];

                                        const status =
                                            record?.status || "";

                                        return (
                                            <div
                                                key={dateKey}
                                                className={`min-h-24 border border-slate-100 p-2 ${record?.isFuture
                                                        ? "bg-slate-50/50"
                                                        : "bg-white"
                                                    }`}
                                            >
                                                <span className="text-[10px] font-semibold text-slate-500">
                                                    {date.getDate()}
                                                </span>
                                                {status && (
                                                    <span
                                                        className={`mt-3 block rounded-lg px-2 py-1.5 text-center text-[9px] font-bold ring-1 ring-inset ${getAttendanceStatusClasses(
                                                            status
                                                        )}`}
                                                        title={status}
                                                    >
                                                        {record?.code || status}
                                                    </span>
                                                )}

                                                {record?.holidayName && (
                                                    <p
                                                        title={
                                                            record.holidayName
                                                        }
                                                        className="mt-2 truncate text-[9px] font-medium text-cyan-700"
                                                    >
                                                        {record.holidayName}
                                                    </p>
                                                )}

                                                {record?.leaveType && (
                                                    <p
                                                        title={
                                                            record.leaveType
                                                        }
                                                        className="mt-2 truncate text-[9px] font-medium text-violet-700"
                                                    >
                                                        {record.leaveType}
                                                    </p>
                                                )}

                                                {Number(
                                                    record?.totalWorkedMinutes ||
                                                    0
                                                ) > 0 && (
                                                        <p className="mt-2 text-[9px] text-slate-500">
                                                            {formatDuration(
                                                                Number(
                                                                    record.totalWorkedMinutes ||
                                                                    0
                                                                )
                                                            )}
                                                        </p>
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
                                const total =
                                    Number(
                                        leave.entitled ??
                                        leave.total ??
                                        0
                                    );

                                const used =
                                    Number(
                                        leave.used || 0
                                    );

                                const pending =
                                    Number(
                                        leave.pending || 0
                                    );

                                const remaining =
                                    Number(
                                        leave.availableAfterPending ??
                                        leave.available ??
                                        Math.max(
                                            total -
                                            used -
                                            pending,
                                            0
                                        )
                                    );

                                const percentage =
                                    total > 0
                                        ? Math.round(
                                            (used / total) *
                                            100
                                        )
                                        : 0;

                                const code =
                                    leave.code ||
                                    (
                                        leave.leaveType ===
                                            "Casual Leave"
                                            ? "CL"
                                            : leave.leaveType ===
                                                "Sick Leave"
                                                ? "SL"
                                                : leave.leaveType ===
                                                    "Earned Leave"
                                                    ? "EL"
                                                    : "LV"
                                    );

                                return (
                                    <div
                                        key={
                                            leave.leaveType ||
                                            leave._id
                                        }
                                        className="rounded-2xl border border-slate-200 p-5"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {
                                                        leave.leaveType
                                                    }
                                                </p>

                                                <span className="mt-2 inline-flex rounded-lg bg-violet-50 px-2 py-1 text-[9px] font-bold text-violet-700">
                                                    {code}
                                                </span>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-2xl font-semibold text-slate-950">
                                                    {remaining}
                                                </p>

                                                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Available
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                                            <div className="rounded-lg bg-slate-50 px-2 py-2">
                                                <p className="text-xs font-semibold text-slate-800">
                                                    {total}
                                                </p>

                                                <p className="mt-1 text-[8px] uppercase text-slate-400">
                                                    Total
                                                </p>
                                            </div>

                                            <div className="rounded-lg bg-rose-50 px-2 py-2">
                                                <p className="text-xs font-semibold text-rose-700">
                                                    {used}
                                                </p>

                                                <p className="mt-1 text-[8px] uppercase text-rose-500">
                                                    Used
                                                </p>
                                            </div>

                                            <div className="rounded-lg bg-amber-50 px-2 py-2">
                                                <p className="text-xs font-semibold text-amber-700">
                                                    {pending}
                                                </p>

                                                <p className="mt-1 text-[8px] uppercase text-amber-500">
                                                    Pending
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-violet-500"
                                                style={{
                                                    width:
                                                        `${Math.min(
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
                                            <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Action
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
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end">
                                                            {request.status === "Pending" ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        cancelLeaveRequest(
                                                                            request
                                                                        )
                                                                    }
                                                                    className="h-9 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-100"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400">
                                                                    —
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
                        </div>
                    </div>
                )}
                {activeTab === "holidays" && (
                    <div className="p-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Holiday Calendar
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    View national, company and optional holidays.
                                </p>
                            </div>

                            <select
                                value={holidayYear}
                                onChange={(event) =>
                                    setHolidayYear(
                                        Number(
                                            event.target.value
                                        )
                                    )
                                }
                                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            >
                                <option
                                    value={
                                        new Date().getFullYear() - 1
                                    }
                                >
                                    {new Date().getFullYear() - 1}
                                </option>

                                <option
                                    value={
                                        new Date().getFullYear()
                                    }
                                >
                                    {new Date().getFullYear()}
                                </option>

                                <option
                                    value={
                                        new Date().getFullYear() + 1
                                    }
                                >
                                    {new Date().getFullYear() + 1}
                                </option>
                            </select>
                        </div>

                        {holidayLoading && (
                            <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                                <p className="text-xs font-medium text-violet-700">
                                    Loading holiday calendar...
                                </p>
                            </div>
                        )}

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Total Holidays
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-slate-950">
                                    {activeHolidays.length}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-600">
                                    National
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-rose-800">
                                    {nationalHolidayCount}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-600">
                                    Company
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-violet-800">
                                    {companyHolidayCount}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600">
                                    Optional
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-amber-800">
                                    {optionalHolidayCount}
                                </p>
                            </div>

                        </div>

                        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">

                            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Holiday List
                                </h3>

                                <p className="mt-1 text-[10px] text-slate-500">
                                    Holidays configured by your administrator.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">

                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Date
                                            </th>

                                            <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Holiday
                                            </th>

                                            <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Type
                                            </th>

                                            <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Note
                                            </th>

                                            <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">

                                        {activeHolidays.map(
                                            (holiday) => {
                                                const isUpcoming =
                                                    holiday.date >=
                                                    todayDate;

                                                return (
                                                    <tr
                                                        key={
                                                            holiday._id
                                                        }
                                                        className="transition hover:bg-slate-50/70"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {formatDate(
                                                                    holiday.date
                                                                )}
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-400">
                                                                {new Date(
                                                                    `${holiday.date}T00:00:00`
                                                                ).toLocaleDateString(
                                                                    "en-IN",
                                                                    {
                                                                        weekday:
                                                                            "long",
                                                                    }
                                                                )}
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <p className="text-xs font-semibold text-slate-900">
                                                                {
                                                                    holiday.name
                                                                }
                                                            </p>
                                                        </td>

                                                        <td className="px-4 py-4">
                                                            <span
                                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${holiday.type ===
                                                                    "National"
                                                                    ? "bg-rose-50 text-rose-700"
                                                                    : holiday.type ===
                                                                        "Optional"
                                                                        ? "bg-amber-50 text-amber-700"
                                                                        : "bg-violet-50 text-violet-700"
                                                                    }`}
                                                            >
                                                                {
                                                                    holiday.type
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-4 py-4 text-xs text-slate-600">
                                                            {holiday.note ||
                                                                "—"}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${isUpcoming
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : "bg-slate-100 text-slate-500"
                                                                    }`}
                                                            >
                                                                {isUpcoming
                                                                    ? "Upcoming"
                                                                    : "Completed"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}

                                    </tbody>
                                </table>
                            </div>

                            {!holidayLoading &&
                                activeHolidays.length ===
                                0 && (
                                    <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                        <CalendarDays
                                            size={28}
                                            className="text-slate-300"
                                        />

                                        <p className="mt-3 text-sm font-semibold text-slate-900">
                                            No holidays configured
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            No holidays are available for {holidayYear}.
                                        </p>
                                    </div>
                                )}
                        </div>

                        {upcomingHolidays.length > 0 && (
                            <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
                                <div className="flex items-start gap-3">

                                    <CalendarDays
                                        size={18}
                                        className="mt-0.5 text-cyan-700"
                                    />

                                    <div>
                                        <p className="text-xs font-semibold text-cyan-900">
                                            Next Holiday
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-cyan-800">
                                            {
                                                upcomingHolidays[0]
                                                    .name
                                            }
                                        </p>

                                        <p className="mt-1 text-[10px] text-cyan-700">
                                            {formatDate(
                                                upcomingHolidays[0]
                                                    .date
                                            )}
                                        </p>
                                    </div>

                                </div>
                            </div>
                        )}

                    </div>
                )}
                {activeTab === "regularization" && (
                    <div className="p-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-950">
                                    Attendance Regularization
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Request corrections for missed punches, absent days and attendance timing issues.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={openRegularizationDrawer}
                                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                            >
                                <Plus size={15} />
                                New Correction
                            </button>
                        </div>

                        {regularizationLoading && (
                            <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                                <p className="text-xs font-medium text-violet-700">
                                    Loading correction requests...
                                </p>
                            </div>
                        )}

                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                                    Pending
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-amber-800">
                                    {
                                        regularizations.filter(
                                            (item) =>
                                                item.status ===
                                                "Pending"
                                        ).length
                                    }
                                </p>
                            </div>

                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                    Approved
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-emerald-800">
                                    {
                                        regularizations.filter(
                                            (item) =>
                                                item.status ===
                                                "Approved"
                                        ).length
                                    }
                                </p>
                            </div>

                            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-700">
                                    Rejected
                                </p>

                                <p className="mt-2 text-2xl font-semibold text-rose-800">
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

                        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px]">

                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/70">
                                            <th className="px-5 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Date
                                            </th>

                                            <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Correction Type
                                            </th>

                                            <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Requested Time
                                            </th>

                                            <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Reason
                                            </th>

                                            <th className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Status
                                            </th>

                                            <th className="px-5 py-3 text-right text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {regularizations.map(
                                            (request) => (
                                                <tr
                                                    key={request.id}
                                                    className="transition hover:bg-slate-50/70"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {formatDate(
                                                                request.date
                                                            )}
                                                        </p>
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

                                                        {request.reviewNote && (
                                                            <p className="mt-1 text-[10px] text-slate-400">
                                                                Admin:{" "}
                                                                {
                                                                    request.reviewNote
                                                                }
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getRegularizationStatusClasses(
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
                                                                "Pending" && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            cancelRegularization(
                                                                                request
                                                                            )
                                                                        }
                                                                        className="h-9 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-100"
                                                                    >
                                                                        Cancel
                                                                    </button>
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
                                            No correction requests
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            You have not submitted any attendance corrections.
                                        </p>
                                    </div>
                                )}
                        </div>
                    </div>
                )}

            </div>
            {regularizationDrawerOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close correction form"
                        onClick={closeRegularizationDrawer}
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[560px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.22)]">

                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">
                                    Attendance Correction
                                </p>

                                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                                    Request Regularization
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Submit the correct attendance details for admin approval.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeRegularizationDrawer}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <form
                            onSubmit={submitRegularization}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 space-y-5 overflow-y-auto p-6">

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Attendance Date
                                    </label>

                                    <input
                                        type="date"
                                        name="date"
                                        value={
                                            regularizationForm.date
                                        }
                                        max={
                                            new Date()
                                                .toISOString()
                                                .slice(0, 10)
                                        }
                                        onChange={
                                            handleRegularizationFormChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Correction Type
                                    </label>

                                    <select
                                        name="requestType"
                                        value={
                                            regularizationForm.requestType
                                        }
                                        onChange={
                                            handleRegularizationFormChange
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    >
                                        <option>
                                            Missing Login
                                        </option>

                                        <option>
                                            Missing Logout
                                        </option>

                                        <option>
                                            Incorrect Time
                                        </option>

                                        <option>
                                            Absent Correction
                                        </option>

                                        <option>
                                            Work From Home
                                        </option>

                                        <option>
                                            Client Site
                                        </option>
                                    </select>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Correct Login
                                        </label>

                                        <input
                                            type="time"
                                            name="requestedLoginTime"
                                            value={
                                                regularizationForm.requestedLoginTime
                                            }
                                            onChange={
                                                handleRegularizationFormChange
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Correct Logout
                                        </label>

                                        <input
                                            type="time"
                                            name="requestedLogoutTime"
                                            value={
                                                regularizationForm.requestedLogoutTime
                                            }
                                            onChange={
                                                handleRegularizationFormChange
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Reason
                                    </label>

                                    <textarea
                                        name="reason"
                                        value={
                                            regularizationForm.reason
                                        }
                                        onChange={
                                            handleRegularizationFormChange
                                        }
                                        rows={5}
                                        placeholder="Explain why the attendance correction is required..."
                                        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-xs leading-5 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    />
                                </div>

                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex gap-3">
                                        <AlertCircle
                                            size={17}
                                            className="mt-0.5 shrink-0 text-amber-700"
                                        />

                                        <p className="text-xs leading-5 text-amber-800">
                                            The corrected attendance will only be applied after administrator approval.
                                        </p>
                                    </div>
                                </div>

                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                                <button
                                    type="button"
                                    onClick={closeRegularizationDrawer}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                >
                                    <Check size={15} />
                                    Submit Correction
                                </button>

                            </div>
                        </form>
                    </aside>
                </>
            )}

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
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-slate-700">
                                        Leave Duration
                                    </label>

                                    <select
                                        name="duration"
                                        value={leaveForm.duration}
                                        onChange={handleLeaveFormChange}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                    >
                                        <option value="Full Day">
                                            Full Day
                                        </option>

                                        <option value="First Half">
                                            First Half
                                        </option>

                                        <option value="Second Half">
                                            Second Half
                                        </option>
                                    </select>

                                    {leaveForm.duration !== "Full Day" &&
                                        leaveForm.fromDate &&
                                        leaveForm.toDate &&
                                        leaveForm.fromDate !== leaveForm.toDate && (
                                            <p className="mt-2 text-[10px] font-medium text-rose-600">
                                                Half-day leave can only be requested for one date.
                                            </p>
                                        )}
                                </div>

                                {requestedLeaveDays > 0 && (
                                    <div
                                        className={`rounded-xl border p-4 ${leaveCalculation
                                            .sufficientBalance
                                            ? "border-violet-200 bg-violet-50"
                                            : "border-rose-200 bg-rose-50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <CalendarDays
                                                size={17}
                                                className={
                                                    leaveCalculation
                                                        .sufficientBalance
                                                        ? "mt-0.5 text-violet-700"
                                                        : "mt-0.5 text-rose-700"
                                                }
                                            />

                                            <div>
                                                <p
                                                    className={`text-xs font-semibold ${leaveCalculation
                                                        .sufficientBalance
                                                        ? "text-violet-800"
                                                        : "text-rose-800"
                                                        }`}
                                                >
                                                    {requestedLeaveDays} chargeable leave day
                                                    {requestedLeaveDays !== 1
                                                        ? "s"
                                                        : ""}
                                                </p>

                                                <p className="mt-1 text-[10px] text-slate-600">
                                                    Holidays and weekly offs are excluded automatically.
                                                </p>

                                                {leaveCalculation.balance && (
                                                    <p className="mt-2 text-[10px] font-semibold text-slate-700">
                                                        Available after pending requests:{" "}
                                                        {
                                                            leaveCalculation
                                                                .balance
                                                                .availableAfterPending
                                                        }
                                                    </p>
                                                )}

                                                {!leaveCalculation
                                                    .sufficientBalance && (
                                                        <p className="mt-2 text-[10px] font-semibold text-rose-700">
                                                            Insufficient leave balance.
                                                        </p>
                                                    )}
                                            </div>
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
