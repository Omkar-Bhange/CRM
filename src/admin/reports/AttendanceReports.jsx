import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Download,
    Filter,
    RefreshCw,
    Search,
    Timer,
    UserCheck,
    Users,
    X,
} from "lucide-react";
import * as XLSX from "xlsx";

import API_URL from "../../config/api";

const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

const TABS = [
    {
        id: "summary",
        label: "Attendance Summary",
    },
    {
        id: "daily",
        label: "Daily Attendance",
    },
    {
        id: "late",
        label: "Late Arrival",
    },
    {
        id: "hours",
        label: "Working Hours",
    },
    {
        id: "overtime",
        label: "Overtime",
    },
    {
        id: "absence",
        label: "Absence & Leave",
    },
];

function formatMinutes(minutes) {
    const value = Number(minutes || 0);

    if (!value) {
        return "0m";
    }

    const hours = Math.floor(value / 60);
    const remaining = value % 60;

    if (!hours) {
        return `${remaining}m`;
    }

    return remaining
        ? `${hours}h ${remaining}m`
        : `${hours}h`;
}

function formatDate(value) {
    if (!value) return "—";

    let date;

    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        date = new Date(`${value}T00:00:00`);
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
        return value || "—";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getStatusClass(status) {
    const map = {
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
    };

    return (
        map[status] ||
        "bg-slate-100 text-slate-600 ring-slate-500/10"
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    description = "",
    iconClass = "bg-violet-100 text-violet-700",
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={18} />
                </div>

                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {label}
                    </p>

                    <p className="mt-1 truncate text-xl font-semibold text-slate-950">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-1 text-[10px] text-slate-400">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${getStatusClass(
                status
            )}`}
        >
            {status || "Unknown"}
        </span>
    );
}

export default function AttendanceReports({ onBack }) {
    const [activeTab, setActiveTab] =
        useState("summary");

    const [records, setRecords] =
        useState([]);

    const [employeeSummary, setEmployeeSummary] =
        useState([]);

    const [specialReports, setSpecialReports] =
        useState({
            lateArrivals: [],
            workingHours: [],
            overtime: [],
            absenceLeave: [],
        });

    const [summary, setSummary] =
        useState({
            total: 0,

            present: 0,
            late: 0,
            halfDay: 0,
            absent: 0,
            leave: 0,

            totalWorkedMinutes: 0,
            totalBreakMinutes: 0,
            overtimeMinutes: 0,

            averageWorkedMinutes: 0,
            averageBreakMinutes: 0,

            totalLateMinutes: 0,
            totalEarlyLogoutMinutes: 0,

            lateOccurrences: 0,
            overtimeOccurrences: 0,
            absenceLeaveCount: 0,
        });

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [employeeId, setEmployeeId] =
        useState("");

    const [status, setStatus] =
        useState("All");

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [employees, setEmployees] =
        useState([]);

    const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
    };

    const loadEmployees = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/employee/employees`,
                {
                    headers,
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
                        "Unable to load employees."
                );
            }

            const source =
                Array.isArray(result.data)
                    ? result.data
                    : Array.isArray(
                          result.employees
                      )
                      ? result.employees
                      : [];

            setEmployees(
                source
                    .filter(
                        (employee) =>
                            employee &&
                            employee._id &&
                            employee.isActive !== false
                    )
                    .sort((a, b) =>
                        String(
                            a.name || ""
                        ).localeCompare(
                            String(
                                b.name || ""
                            )
                        )
                    )
            );
        } catch (error) {
            console.error(
                "Attendance employee load error:",
                error
            );

            setEmployees([]);
        }
    };

    const loadAttendanceReports = async () => {
        try {
            setLoading(true);
            setError("");

            const params =
                new URLSearchParams();

            if (employeeId) {
                params.set(
                    "employeeId",
                    employeeId
                );
            }

            if (status !== "All") {
                params.set(
                    "status",
                    status
                );
            }

            if (fromDate) {
                params.set(
                    "fromDate",
                    fromDate
                );
            }

            if (toDate) {
                params.set(
                    "toDate",
                    toDate
                );
            }

            const query =
                params.toString();

            const response = await fetch(
                `${API_URL}/api/reports/attendance${
                    query ? `?${query}` : ""
                }`,
                {
                    headers,
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
                        "Unable to load Attendance Reports."
                );
            }

            setRecords(
                Array.isArray(result.data)
                    ? result.data
                    : []
            );

            setEmployeeSummary(
                Array.isArray(
                    result.employeeSummary
                )
                    ? result.employeeSummary
                    : []
            );

            setSpecialReports({
                lateArrivals:
                    Array.isArray(
                        result.reports
                            ?.lateArrivals
                    )
                        ? result.reports
                              .lateArrivals
                        : [],

                workingHours:
                    Array.isArray(
                        result.reports
                            ?.workingHours
                    )
                        ? result.reports
                              .workingHours
                        : [],

                overtime:
                    Array.isArray(
                        result.reports
                            ?.overtime
                    )
                        ? result.reports
                              .overtime
                        : [],

                absenceLeave:
                    Array.isArray(
                        result.reports
                            ?.absenceLeave
                    )
                        ? result.reports
                              .absenceLeave
                        : [],
            });

            setSummary({
                total:
                    Number(
                        result.summary
                            ?.total || 0
                    ),

                present:
                    Number(
                        result.summary
                            ?.present || 0
                    ),

                late:
                    Number(
                        result.summary
                            ?.late || 0
                    ),

                halfDay:
                    Number(
                        result.summary
                            ?.halfDay || 0
                    ),

                absent:
                    Number(
                        result.summary
                            ?.absent || 0
                    ),

                leave:
                    Number(
                        result.summary
                            ?.leave || 0
                    ),

                totalWorkedMinutes:
                    Number(
                        result.summary
                            ?.totalWorkedMinutes ||
                            0
                    ),

                totalBreakMinutes:
                    Number(
                        result.summary
                            ?.totalBreakMinutes ||
                            0
                    ),

                overtimeMinutes:
                    Number(
                        result.summary
                            ?.overtimeMinutes ||
                            0
                    ),

                averageWorkedMinutes:
                    Number(
                        result.summary
                            ?.averageWorkedMinutes ||
                            0
                    ),

                averageBreakMinutes:
                    Number(
                        result.summary
                            ?.averageBreakMinutes ||
                            0
                    ),

                totalLateMinutes:
                    Number(
                        result.summary
                            ?.totalLateMinutes ||
                            0
                    ),

                totalEarlyLogoutMinutes:
                    Number(
                        result.summary
                            ?.totalEarlyLogoutMinutes ||
                            0
                    ),

                lateOccurrences:
                    Number(
                        result.summary
                            ?.lateOccurrences ||
                            0
                    ),

                overtimeOccurrences:
                    Number(
                        result.summary
                            ?.overtimeOccurrences ||
                            0
                    ),

                absenceLeaveCount:
                    Number(
                        result.summary
                            ?.absenceLeaveCount ||
                            0
                    ),
            });
        } catch (error) {
            console.error(
                "Load attendance reports error:",
                error
            );

            setError(
                error.message ||
                    "Unable to load Attendance Reports."
            );

            setRecords([]);
            setEmployeeSummary([]);

            setSpecialReports({
                lateArrivals: [],
                workingHours: [],
                overtime: [],
                absenceLeave: [],
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
        loadAttendanceReports();
    }, []);

    const changeTab = (tab) => {
        setActiveTab(tab);
        setSearch("");
    };

    const currentSource = useMemo(() => {
        if (activeTab === "summary") {
            return employeeSummary;
        }

        if (activeTab === "late") {
            return specialReports.lateArrivals;
        }

        if (activeTab === "hours") {
            return specialReports.workingHours;
        }

        if (activeTab === "overtime") {
            return specialReports.overtime;
        }

        if (activeTab === "absence") {
            return specialReports.absenceLeave;
        }

        return records;
    }, [
        activeTab,
        records,
        employeeSummary,
        specialReports,
    ]);

    const filteredRecords = useMemo(() => {
        const value =
            search.trim().toLowerCase();

        if (!value) {
            return currentSource;
        }

        return currentSource.filter(
            (record) =>
                [
                    record.employeeCode,
                    record.employeeName,
                    record.department,
                    record.role,
                    record.status,
                    record.date,
                    record.workStatus,
                    record.shiftStart,
                    record.shiftEnd,
                ].some((field) =>
                    String(field || "")
                        .toLowerCase()
                        .includes(value)
                )
        );
    }, [
        currentSource,
        search,
    ]);

    const clearFilters = () => {
        setSearch("");
        setEmployeeId("");
        setStatus("All");
        setFromDate("");
        setToDate("");

        setTimeout(() => {
            loadAttendanceReports();
        }, 0);
    };

    const renderCards = () => {
        if (activeTab === "summary") {
            return (
                <>
                    <SummaryCard
                        icon={Users}
                        label="Attendance Records"
                        value={summary.total}
                    />

                    <SummaryCard
                        icon={UserCheck}
                        label="Present"
                        value={summary.present}
                        iconClass="bg-emerald-100 text-emerald-700"
                    />

                    <SummaryCard
                        icon={Clock3}
                        label="Late"
                        value={summary.late}
                        iconClass="bg-amber-100 text-amber-700"
                    />

                    <SummaryCard
                        icon={Timer}
                        label="Worked Hours"
                        value={formatMinutes(
                            summary.totalWorkedMinutes
                        )}
                        iconClass="bg-violet-100 text-violet-700"
                    />
                </>
            );
        }

        if (activeTab === "daily") {
            return (
                <>
                    <SummaryCard
                        icon={UserCheck}
                        label="Present"
                        value={summary.present}
                        iconClass="bg-emerald-100 text-emerald-700"
                    />

                    <SummaryCard
                        icon={Clock3}
                        label="Late"
                        value={summary.late}
                        iconClass="bg-amber-100 text-amber-700"
                    />

                    <SummaryCard
                        icon={CalendarDays}
                        label="Half Day"
                        value={summary.halfDay}
                        iconClass="bg-blue-100 text-blue-700"
                    />

                    <SummaryCard
                        icon={Timer}
                        label="Avg Worked"
                        value={formatMinutes(
                            summary.averageWorkedMinutes
                        )}
                    />
                </>
            );
        }

        if (activeTab === "late") {
            return (
                <>
                    <SummaryCard
                        icon={Clock3}
                        label="Late Entries"
                        value={
                            summary.lateOccurrences
                        }
                        iconClass="bg-amber-100 text-amber-700"
                    />

                    <SummaryCard
                        icon={Timer}
                        label="Total Late Time"
                        value={formatMinutes(
                            summary.totalLateMinutes
                        )}
                        iconClass="bg-rose-100 text-rose-700"
                    />

                    <SummaryCard
                        icon={Users}
                        label="Late Employees"
                        value={
                            new Set(
                                specialReports.lateArrivals.map(
                                    (item) =>
                                        String(
                                            item.employeeId ||
                                                item.employeeCode
                                        )
                                )
                            ).size
                        }
                    />

                    <SummaryCard
                        icon={Clock3}
                        label="Avg Late"
                        value={formatMinutes(
                            summary.lateOccurrences >
                                0
                                ? Math.round(
                                      summary.totalLateMinutes /
                                          summary.lateOccurrences
                                  )
                                : 0
                        )}
                    />
                </>
            );
        }

        if (activeTab === "hours") {
            return (
                <>
                    <SummaryCard
                        icon={Timer}
                        label="Worked Hours"
                        value={formatMinutes(
                            summary.totalWorkedMinutes
                        )}
                        iconClass="bg-emerald-100 text-emerald-700"
                    />

                    <SummaryCard
                        icon={Clock3}
                        label="Average Worked"
                        value={formatMinutes(
                            summary.averageWorkedMinutes
                        )}
                    />

                    <SummaryCard
                        icon={Timer}
                        label="Break Time"
                        value={formatMinutes(
                            summary.totalBreakMinutes
                        )}
                        iconClass="bg-amber-100 text-amber-700"
                    />

                    <SummaryCard
                        icon={AlertTriangle}
                        label="Early Logout"
                        value={formatMinutes(
                            summary.totalEarlyLogoutMinutes
                        )}
                        iconClass="bg-rose-100 text-rose-700"
                    />
                </>
            );
        }

        if (activeTab === "overtime") {
            return (
                <>
                    <SummaryCard
                        icon={Timer}
                        label="Overtime Hours"
                        value={formatMinutes(
                            summary.overtimeMinutes
                        )}
                        iconClass="bg-violet-100 text-violet-700"
                    />

                    <SummaryCard
                        icon={Clock3}
                        label="Overtime Entries"
                        value={
                            summary.overtimeOccurrences
                        }
                    />

                    <SummaryCard
                        icon={Users}
                        label="Employees"
                        value={
                            new Set(
                                specialReports.overtime.map(
                                    (item) =>
                                        String(
                                            item.employeeId ||
                                                item.employeeCode
                                        )
                                )
                            ).size
                        }
                        iconClass="bg-blue-100 text-blue-700"
                    />

                    <SummaryCard
                        icon={Timer}
                        label="Avg Overtime"
                        value={formatMinutes(
                            summary.overtimeOccurrences >
                                0
                                ? Math.round(
                                      summary.overtimeMinutes /
                                          summary.overtimeOccurrences
                                  )
                                : 0
                        )}
                        iconClass="bg-emerald-100 text-emerald-700"
                    />
                </>
            );
        }

        return (
            <>
                <SummaryCard
                    icon={AlertTriangle}
                    label="Absent"
                    value={summary.absent}
                    iconClass="bg-rose-100 text-rose-700"
                />

                <SummaryCard
                    icon={CalendarDays}
                    label="On Leave"
                    value={summary.leave}
                    iconClass="bg-violet-100 text-violet-700"
                />

                <SummaryCard
                    icon={Users}
                    label="Total Records"
                    value={
                        summary.absenceLeaveCount
                    }
                />

                <SummaryCard
                    icon={CalendarDays}
                    label="Half Day"
                    value={summary.halfDay}
                    iconClass="bg-blue-100 text-blue-700"
                />
            </>
        );
    };

    const renderSummaryTable = () => (
        <table className="min-w-[1650px] w-full">
            <thead className="bg-slate-50">
                <tr>
                    {[
                        "Employee",
                        "Department",
                        "Records",
                        "Present",
                        "Late",
                        "Half Day",
                        "Absent",
                        "Leave",
                        "Attendance %",
                        "Worked",
                        "Avg Worked",
                        "Break",
                        "Late Time",
                        "Overtime",
                    ].map((column) => (
                        <th
                            key={column}
                            className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                        >
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(
                    (employee, index) => (
                        <tr
                            key={
                                String(
                                    employee.employeeId ||
                                        employee.employeeCode
                                ) + index
                            }
                            className="hover:bg-slate-50/70"
                        >
                            <td className="px-4 py-4">
                                <p className="text-xs font-semibold text-slate-900">
                                    {employee.employeeName ||
                                        "—"}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    {employee.employeeCode ||
                                        "—"}
                                </p>
                            </td>

                            <td className="px-4 py-4">
                                <p className="text-xs">
                                    {employee.department ||
                                        "—"}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    {employee.role || "—"}
                                </p>
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold">
                                {employee.attendanceDays ||
                                    0}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-emerald-600">
                                {employee.present || 0}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-amber-600">
                                {employee.late || 0}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-blue-600">
                                {employee.halfDay ||
                                    0}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                {employee.absent || 0}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-violet-600">
                                {employee.leave || 0}
                            </td>

                            <td className="px-4 py-4">
                                <span
                                    className={`text-xs font-bold ${
                                        Number(
                                            employee.attendancePercentage ||
                                                0
                                        ) >= 90
                                            ? "text-emerald-600"
                                            : Number(
                                                    employee.attendancePercentage ||
                                                        0
                                                ) >= 75
                                              ? "text-amber-600"
                                              : "text-rose-600"
                                    }`}
                                >
                                    {Number(
                                        employee.attendancePercentage ||
                                            0
                                    ).toFixed(1)}
                                    %
                                </span>
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold">
                                {formatMinutes(
                                    employee.totalWorkedMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatMinutes(
                                    employee.averageWorkedMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatMinutes(
                                    employee.totalBreakMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-amber-600">
                                {formatMinutes(
                                    employee.totalLateMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-violet-600">
                                {formatMinutes(
                                    employee.totalOvertimeMinutes
                                )}
                            </td>
                        </tr>
                    )
                )}
            </tbody>
        </table>
    );

    const renderDailyTable = () => (
        <table className="min-w-[1600px] w-full">
            <thead className="bg-slate-50">
                <tr>
                    {[
                        "Date",
                        "Employee",
                        "Department",
                        "Shift",
                        "Login",
                        "Logout",
                        "Worked",
                        "Break",
                        "Late",
                        "Early Logout",
                        "Overtime",
                        "Status",
                    ].map((column) => (
                        <th
                            key={column}
                            className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                        >
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(
                    (record, index) => (
                        <tr
                            key={
                                String(
                                    record._id ||
                                        record.id ||
                                        index
                                )
                            }
                            className="hover:bg-slate-50/70"
                        >
                            <td className="px-4 py-4 text-xs font-medium whitespace-nowrap">
                                {formatDate(record.date)}
                            </td>

                            <td className="px-4 py-4">
                                <p className="text-xs font-semibold">
                                    {record.employeeName ||
                                        "—"}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    {record.employeeCode ||
                                        "—"}
                                </p>
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {record.department ||
                                    "—"}
                            </td>

                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                {record.shiftStart ||
                                    "—"}
                                {" - "}
                                {record.shiftEnd ||
                                    "—"}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatTime(
                                    record.loginTime
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatTime(
                                    record.logoutTime
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold">
                                {formatMinutes(
                                    record.totalWorkedMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatMinutes(
                                    record.totalBreakMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-amber-600">
                                {formatMinutes(
                                    record.lateMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                {formatMinutes(
                                    record.earlyLogoutMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-violet-600">
                                {formatMinutes(
                                    record.overtimeMinutes
                                )}
                            </td>

                            <td className="px-4 py-4">
                                <StatusBadge
                                    status={
                                        record.status
                                    }
                                />
                            </td>
                        </tr>
                    )
                )}
            </tbody>
        </table>
    );

    const renderLateTable = () => (
        <table className="min-w-[1350px] w-full">
            <thead className="bg-slate-50">
                <tr>
                    {[
                        "Date",
                        "Employee",
                        "Department",
                        "Shift Start",
                        "Login",
                        "Late By",
                        "Worked",
                        "Logout",
                        "Status",
                    ].map((column) => (
                        <th
                            key={column}
                            className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                        >
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(
                    (record, index) => (
                        <tr
                            key={
                                String(
                                    record._id ||
                                        record.id ||
                                        index
                                )
                            }
                            className="bg-amber-50/20 hover:bg-amber-50/50"
                        >
                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                {formatDate(record.date)}
                            </td>

                            <td className="px-4 py-4">
                                <p className="text-xs font-semibold">
                                    {record.employeeName ||
                                        "—"}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    {record.employeeCode ||
                                        "—"}
                                </p>
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {record.department ||
                                    "—"}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {record.shiftStart ||
                                    "—"}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold">
                                {formatTime(
                                    record.loginTime
                                )}
                            </td>

                            <td className="px-4 py-4">
                                <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                    {formatMinutes(
                                        record.lateMinutes
                                    )}
                                </span>
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatMinutes(
                                    record.totalWorkedMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatTime(
                                    record.logoutTime
                                )}
                            </td>

                            <td className="px-4 py-4">
                                <StatusBadge
                                    status={
                                        record.status
                                    }
                                />
                            </td>
                        </tr>
                    )
                )}
            </tbody>
        </table>
    );

    const renderHoursTable = () => (
        <table className="min-w-[1500px] w-full">
            <thead className="bg-slate-50">
                <tr>
                    {[
                        "Date",
                        "Employee",
                        "Login",
                        "Logout",
                        "Worked",
                        "Break",
                        "Early Logout",
                        "Overtime",
                        "Status",
                    ].map((column) => (
                        <th
                            key={column}
                            className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                        >
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(
                    (record, index) => (
                        <tr
                            key={
                                String(
                                    record._id ||
                                        record.id ||
                                        index
                                )
                            }
                            className="hover:bg-slate-50/70"
                        >
                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                {formatDate(record.date)}
                            </td>

                            <td className="px-4 py-4">
                                <p className="text-xs font-semibold">
                                    {record.employeeName ||
                                        "—"}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    {record.employeeCode ||
                                        "—"}
                                </p>
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatTime(
                                    record.loginTime
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatTime(
                                    record.logoutTime
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs font-bold text-emerald-700">
                                {formatMinutes(
                                    record.totalWorkedMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatMinutes(
                                    record.totalBreakMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-rose-600">
                                {formatMinutes(
                                    record.earlyLogoutMinutes
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs font-semibold text-violet-600">
                                {formatMinutes(
                                    record.overtimeMinutes
                                )}
                            </td>

                            <td className="px-4 py-4">
                                <StatusBadge
                                    status={
                                        record.status
                                    }
                                />
                            </td>
                        </tr>
                    )
                )}
            </tbody>
        </table>
    );

    const renderOvertimeTable = () => (
        <table className="min-w-[1350px] w-full">
            <thead className="bg-slate-50">
                <tr>
                    {[
                        "Date",
                        "Employee",
                        "Department",
                        "Shift End",
                        "Logout",
                        "Worked",
                        "Overtime",
                        "Status",
                    ].map((column) => (
                        <th
                            key={column}
                            className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                        >
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(
                    (record, index) => (
                        <tr
                            key={
                                String(
                                    record._id ||
                                        record.id ||
                                        index
                                )
                            }
                            className="bg-violet-50/20 hover:bg-violet-50/50"
                        >
                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                {formatDate(record.date)}
                            </td>

                            <td className="px-4 py-4">
                                <p className="text-xs font-semibold">
                                    {record.employeeName ||
                                        "—"}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    {record.employeeCode ||
                                        "—"}
                                </p>
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {record.department ||
                                    "—"}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {record.shiftEnd ||
                                    "—"}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatTime(
                                    record.logoutTime
                                )}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {formatMinutes(
                                    record.totalWorkedMinutes
                                )}
                            </td>

                            <td className="px-4 py-4">
                                <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                    {formatMinutes(
                                        record.overtimeMinutes
                                    )}
                                </span>
                            </td>

                            <td className="px-4 py-4">
                                <StatusBadge
                                    status={
                                        record.status
                                    }
                                />
                            </td>
                        </tr>
                    )
                )}
            </tbody>
        </table>
    );

    const renderAbsenceTable = () => (
        <table className="min-w-[1100px] w-full">
            <thead className="bg-slate-50">
                <tr>
                    {[
                        "Date",
                        "Employee",
                        "Department",
                        "Role",
                        "Status",
                        "Work Status",
                        "Auto Closed",
                        "Reason",
                    ].map((column) => (
                        <th
                            key={column}
                            className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                        >
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(
                    (record, index) => (
                        <tr
                            key={
                                String(
                                    record._id ||
                                        record.id ||
                                        index
                                )
                            }
                            className={
                                record.status ===
                                "Absent"
                                    ? "bg-rose-50/20 hover:bg-rose-50/50"
                                    : "bg-violet-50/20 hover:bg-violet-50/50"
                            }
                        >
                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                {formatDate(record.date)}
                            </td>

                            <td className="px-4 py-4">
                                <p className="text-xs font-semibold">
                                    {record.employeeName ||
                                        "—"}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    {record.employeeCode ||
                                        "—"}
                                </p>
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {record.department ||
                                    "—"}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {record.role || "—"}
                            </td>

                            <td className="px-4 py-4">
                                <StatusBadge
                                    status={
                                        record.status
                                    }
                                />
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {record.workStatus ||
                                    "—"}
                            </td>

                            <td className="px-4 py-4 text-xs">
                                {record.isAutoClosed
                                    ? "Yes"
                                    : "No"}
                            </td>

                            <td className="px-4 py-4 text-xs text-slate-600">
                                {record.autoClosedReason ||
                                    "—"}
                            </td>
                        </tr>
                    )
                )}
            </tbody>
        </table>
    );

    const renderTable = () => {
        if (activeTab === "summary") {
            return renderSummaryTable();
        }

        if (activeTab === "daily") {
            return renderDailyTable();
        }

        if (activeTab === "late") {
            return renderLateTable();
        }

        if (activeTab === "hours") {
            return renderHoursTable();
        }

        if (activeTab === "overtime") {
            return renderOvertimeTable();
        }

        return renderAbsenceTable();
    };

    const getExportRows = () => {
        if (activeTab === "summary") {
            return filteredRecords.map(
                (item, index) => ({
                    "Sr No": index + 1,

                    "Employee Code":
                        item.employeeCode || "",

                    Employee:
                        item.employeeName || "",

                    Department:
                        item.department || "",

                    Role:
                        item.role || "",

                    "Attendance Records":
                        Number(
                            item.attendanceDays ||
                                0
                        ),

                    Present:
                        Number(
                            item.present || 0
                        ),

                    Late:
                        Number(
                            item.late || 0
                        ),

                    "Half Day":
                        Number(
                            item.halfDay || 0
                        ),

                    Absent:
                        Number(
                            item.absent || 0
                        ),

                    Leave:
                        Number(
                            item.leave || 0
                        ),

                    "Attendance %":
                        Number(
                            item.attendancePercentage ||
                                0
                        ),

                    "Worked Minutes":
                        Number(
                            item.totalWorkedMinutes ||
                                0
                        ),

                    "Average Worked Minutes":
                        Number(
                            item.averageWorkedMinutes ||
                                0
                        ),

                    "Break Minutes":
                        Number(
                            item.totalBreakMinutes ||
                                0
                        ),

                    "Late Minutes":
                        Number(
                            item.totalLateMinutes ||
                                0
                        ),

                    "Early Logout Minutes":
                        Number(
                            item.totalEarlyLogoutMinutes ||
                                0
                        ),

                    "Overtime Minutes":
                        Number(
                            item.totalOvertimeMinutes ||
                                0
                        ),
                })
            );
        }

        if (activeTab === "late") {
            return filteredRecords.map(
                (item, index) => ({
                    "Sr No": index + 1,

                    Date:
                        formatDate(item.date),

                    "Employee Code":
                        item.employeeCode || "",

                    Employee:
                        item.employeeName || "",

                    Department:
                        item.department || "",

                    "Shift Start":
                        item.shiftStart || "",

                    Login:
                        formatTime(
                            item.loginTime
                        ),

                    "Late Minutes":
                        Number(
                            item.lateMinutes || 0
                        ),

                    "Worked Minutes":
                        Number(
                            item.totalWorkedMinutes ||
                                0
                        ),

                    Logout:
                        formatTime(
                            item.logoutTime
                        ),

                    Status:
                        item.status || "",
                })
            );
        }

        if (activeTab === "hours") {
            return filteredRecords.map(
                (item, index) => ({
                    "Sr No": index + 1,

                    Date:
                        formatDate(item.date),

                    "Employee Code":
                        item.employeeCode || "",

                    Employee:
                        item.employeeName || "",

                    Login:
                        formatTime(
                            item.loginTime
                        ),

                    Logout:
                        formatTime(
                            item.logoutTime
                        ),

                    "Worked Minutes":
                        Number(
                            item.totalWorkedMinutes ||
                                0
                        ),

                    "Break Minutes":
                        Number(
                            item.totalBreakMinutes ||
                                0
                        ),

                    "Late Minutes":
                        Number(
                            item.lateMinutes || 0
                        ),

                    "Early Logout Minutes":
                        Number(
                            item.earlyLogoutMinutes ||
                                0
                        ),

                    "Overtime Minutes":
                        Number(
                            item.overtimeMinutes ||
                                0
                        ),

                    Status:
                        item.status || "",
                })
            );
        }

        if (activeTab === "overtime") {
            return filteredRecords.map(
                (item, index) => ({
                    "Sr No": index + 1,

                    Date:
                        formatDate(item.date),

                    "Employee Code":
                        item.employeeCode || "",

                    Employee:
                        item.employeeName || "",

                    Department:
                        item.department || "",

                    "Shift End":
                        item.shiftEnd || "",

                    Logout:
                        formatTime(
                            item.logoutTime
                        ),

                    "Worked Minutes":
                        Number(
                            item.totalWorkedMinutes ||
                                0
                        ),

                    "Overtime Minutes":
                        Number(
                            item.overtimeMinutes ||
                                0
                        ),

                    Status:
                        item.status || "",
                })
            );
        }

        if (activeTab === "absence") {
            return filteredRecords.map(
                (item, index) => ({
                    "Sr No": index + 1,

                    Date:
                        formatDate(item.date),

                    "Employee Code":
                        item.employeeCode || "",

                    Employee:
                        item.employeeName || "",

                    Department:
                        item.department || "",

                    Role:
                        item.role || "",

                    Status:
                        item.status || "",

                    "Work Status":
                        item.workStatus || "",

                    "Auto Closed":
                        item.isAutoClosed
                            ? "Yes"
                            : "No",

                    Reason:
                        item.autoClosedReason ||
                        "",
                })
            );
        }

        return filteredRecords.map(
            (item, index) => ({
                "Sr No": index + 1,

                Date:
                    formatDate(item.date),

                "Employee Code":
                    item.employeeCode || "",

                Employee:
                    item.employeeName || "",

                Department:
                    item.department || "",

                Role:
                    item.role || "",

                "Shift Start":
                    item.shiftStart || "",

                "Shift End":
                    item.shiftEnd || "",

                Login:
                    formatTime(
                        item.loginTime
                    ),

                Logout:
                    formatTime(
                        item.logoutTime
                    ),

                "Worked Minutes":
                    Number(
                        item.totalWorkedMinutes ||
                            0
                    ),

                "Break Minutes":
                    Number(
                        item.totalBreakMinutes ||
                            0
                    ),

                "Late Minutes":
                    Number(
                        item.lateMinutes || 0
                    ),

                "Early Logout Minutes":
                    Number(
                        item.earlyLogoutMinutes ||
                            0
                    ),

                "Overtime Minutes":
                    Number(
                        item.overtimeMinutes ||
                            0
                    ),

                Status:
                    item.status || "",
            })
        );
    };

    const exportExcel = () => {
        const rows =
            getExportRows();

        if (!rows.length) {
            window.alert(
                "No report data available to export."
            );

            return;
        }

        const sheetNames = {
            summary:
                "Attendance Summary",

            daily:
                "Daily Attendance",

            late:
                "Late Arrival",

            hours:
                "Working Hours",

            overtime:
                "Overtime",

            absence:
                "Absence Leave",
        };

        const worksheet =
            XLSX.utils.json_to_sheet(
                rows
            );

        const workbook =
            XLSX.utils.book_new();

        worksheet["!cols"] =
            Object.keys(
                rows[0]
            ).map((key) => ({
                wch: Math.min(
                    36,
                    Math.max(
                        12,
                        key.length + 2,
                        ...rows.map(
                            (row) =>
                                String(
                                    row[key] ??
                                        ""
                                ).length
                        )
                    )
                ),
            }));

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            sheetNames[activeTab] ||
                "Attendance"
        );

        XLSX.writeFile(
            workbook,
            `Attendance-${
                sheetNames[activeTab] ||
                "Report"
            }-${new Date()
                .toISOString()
                .slice(0, 10)}.xlsx`
        );
    };

    const activeTitle =
        TABS.find(
            (tab) =>
                tab.id === activeTab
        )?.label ||
        "Attendance Report";

    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                        Reports
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                        Attendance Reporting Center
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Attendance, late arrival,
                        working hours, breaks,
                        overtime, absence and leave
                        analysis.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Back
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={
                            loadAttendanceReports
                        }
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw
                            size={14}
                        />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={exportExcel}
                        className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                        <Download
                            size={14}
                        />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="mt-6 overflow-x-auto">
                <div className="inline-flex min-w-max gap-1 rounded-xl border border-slate-200 bg-white p-1">
                    {TABS.map(
                        (tab) => (
                            <button
                                key={
                                    tab.id
                                }
                                type="button"
                                onClick={() =>
                                    changeTab(
                                        tab.id
                                    )
                                }
                                className={`rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                                    activeTab ===
                                    tab.id
                                        ? "bg-violet-600 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {
                                    tab.label
                                }
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {renderCards()}
            </div>

            {/* FILTERS */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[250px] flex-1">
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Search
                        </label>

                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event.target
                                            .value
                                    )
                                }
                                placeholder="Search employee, code, department..."
                                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-xs outline-none focus:border-violet-400"
                            />
                        </div>
                    </div>

                    <div className="min-w-[190px]">
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Employee
                        </label>

                        <select
                            value={
                                employeeId
                            }
                            onChange={(
                                event
                            ) =>
                                setEmployeeId(
                                    event.target
                                        .value
                                )
                            }
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                        >
                            <option value="">
                                All Employees
                            </option>

                            {employees.map(
                                (
                                    employee
                                ) => (
                                    <option
                                        key={
                                            employee._id
                                        }
                                        value={
                                            employee._id
                                        }
                                    >
                                        {
                                            employee.name
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div className="min-w-[160px]">
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            Status
                        </label>

                        <select
                            value={status}
                            onChange={(
                                event
                            ) =>
                                setStatus(
                                    event.target
                                        .value
                                )
                            }
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"
                        >
                            <option value="All">
                                All Status
                            </option>

                            <option value="Present">
                                Present
                            </option>

                            <option value="Late">
                                Late
                            </option>

                            <option value="Half Day">
                                Half Day
                            </option>

                            <option value="Absent">
                                Absent
                            </option>

                            <option value="On Leave">
                                On Leave
                            </option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            From
                        </label>

                        <input
                            type="date"
                            value={fromDate}
                            onChange={(
                                event
                            ) =>
                                setFromDate(
                                    event.target
                                        .value
                                )
                            }
                            className="h-10 rounded-xl border border-slate-200 px-3 text-xs"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                            To
                        </label>

                        <input
                            type="date"
                            value={toDate}
                            onChange={(
                                event
                            ) =>
                                setToDate(
                                    event.target
                                        .value
                                )
                            }
                            className="h-10 rounded-xl border border-slate-200 px-3 text-xs"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={
                            loadAttendanceReports
                        }
                        className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-700"
                    >
                        <Filter
                            size={14}
                        />
                        Apply
                    </button>

                    <button
                        type="button"
                        onClick={
                            clearFilters
                        }
                        className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        <X size={14} />
                        Clear
                    </button>
                </div>
            </div>

            {/* REPORT TABLE */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-950">
                            {activeTitle}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            {
                                filteredRecords.length
                            }{" "}
                            records found.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            exportExcel
                        }
                        className="flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                        <Download
                            size={14}
                        />
                        Export Excel
                    </button>
                </div>

                {loading ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                        <div className="text-center">
                            <RefreshCw
                                size={22}
                                className="mx-auto animate-spin text-violet-600"
                            />

                            <p className="mt-3 text-xs text-slate-500">
                                Loading{" "}
                                {activeTitle}
                                ...
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-6">
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                            <div className="flex gap-3">
                                <AlertTriangle
                                    size={18}
                                    className="text-rose-600"
                                />

                                <div>
                                    <p className="text-sm font-semibold text-rose-700">
                                        Unable to
                                        load
                                        Attendance
                                        Reports
                                    </p>

                                    <p className="mt-1 text-xs text-rose-600">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : filteredRecords.length ===
                  0 ? (
                    <div className="py-14 text-center">
                        <CalendarDays
                            size={26}
                            className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-medium text-slate-700">
                            No attendance
                            records found.
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Try changing the
                            employee, date or
                            status filter.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {renderTable()}
                    </div>
                )}
            </div>
        </div>
    );
}