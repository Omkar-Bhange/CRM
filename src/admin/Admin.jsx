import { useEffect, useState } from "react";
import SystemSettings from "./settings/SystemSettings";
import Attendance from "./attendance/Attendance";
import Tasks from "./tasks/Tasks";
import AmcBilling from "./billing/AmcBilling";
import Team from "./team/Team";


import SupportTickets from "./tickets/SupportTickets";
import {
    ArrowUpRight,
    Bell,
    Building2,
    CalendarDays,
    ChevronDown,
    Landmark,
    Receipt,
    CreditCardIcon,
    Archive,
    Eye,
    Upload,
    Image,
    FileSpreadsheet,
    FileArchive,
    Shield,
    CircleHelp,
    CreditCard,
    Download,
    FileText,
    Headphones,
    IndianRupee,
    LayoutDashboard,
    BadgeIndianRupee,
    Banknote,
    FileDown,
    ReceiptIndianRupee,
    RefreshCw,
    ArrowLeft,
    BriefcaseBusiness,
    Calendar,
    ClipboardList,
    UserCog,
    CalendarClock,
    ExternalLink,
    Box,
    MonitorCog,
    Pencil,
    ShieldCheck,
    Trash2,
    UsersRound,
    Globe2,
    Hash,
    MapPinned,
    WalletCards,
    Filter,
    Save,
    UserRound,
    Mail,
    MapPin,
    Phone,
    SlidersHorizontal,
    CheckCheck,
    ListTodo,
    LogOut,
    Activity,
    FileCheck2,
    PhoneCall,
    ReceiptText,
    UserRoundPlus,
    Menu,
    Clock3,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    CircleDot,
    Flag,
    PlayCircle,
    Timer,
    Circle,
    UserPlus,
    MoreHorizontal,
    Laptop,
    Wrench,
    BellRing,
    UserCheck,
    Plus,
    Search,
    Settings,
    TicketCheck,
    TrendingDown,
    TrendingUp,
    Users,
    X,
} from "lucide-react";
const API_URL = "http://localhost:5000";

const menuItems = [
    {
        id: "overview",
        label: "Overview",
        icon: LayoutDashboard,
    },
    {
        id: "clients",
        label: "Clients",
        icon: Users,
    },
    {
        id: "billing",
        label: "AMC & Billing",
        icon: CreditCard,
    },
    {
        id: "tickets",
        label: "Support Tickets",
        icon: Headphones,
    },
    {
        id: "team",
        label: "Team",
        icon: Users,
    },
    {
        id: "tasks",
        label: "Tasks",
        icon: ListTodo,
    },
    {
        id: "attendance",
        label: "Attendance & Leave",
        icon: CalendarDays,
    },
];



const dashboardStats = [
    {
        id: 1,
        label: "Total Clients",
        value: "48",
        change: "+4 this quarter",
        trend: "up",
        icon: Building2,
        iconStyle: "bg-violet-100 text-violet-700",
    },
    {
        id: 2,
        label: "AMC Collected",
        value: "₹8,42,500",
        change: "+12.4% from last year",
        trend: "up",
        icon: IndianRupee,
        iconStyle: "bg-emerald-100 text-emerald-700",
    },
    {
        id: 3,
        label: "AMC Pending",
        value: "₹2,18,000",
        change: "8 renewals pending",
        trend: "down",
        icon: CreditCard,
        iconStyle: "bg-amber-100 text-amber-700",
    },
    {
        id: 4,
        label: "Open Tickets",
        value: "17",
        change: "3 need attention",
        trend: "down",
        icon: TicketCheck,
        iconStyle: "bg-rose-100 text-rose-700",
    },
];

const amcRenewals = [
    {
        id: 1,
        client: "Shree Ganesh Industries",
        contact: "Ramesh Patil",
        product: "NexERP",
        amount: "₹45,000",
        dueDate: "15 Jul 2026",
        status: "Pending",
    },
    {
        id: 2,
        client: "Kavya Textiles Pvt Ltd",
        contact: "Sunita Sharma",
        product: "BillFlow",
        amount: "₹18,000",
        dueDate: "03 Aug 2026",
        status: "Paid",
    },
    {
        id: 3,
        client: "Omkar Traders",
        contact: "Vijay Kulkarni",
        product: "RetailPOS",
        amount: "₹12,000",
        dueDate: "21 Jun 2026",
        status: "Overdue",
    },
    {
        id: 4,
        client: "Precision Auto Parts",
        contact: "Anil Deshmukh",
        product: "NexERP",
        amount: "₹60,000",
        dueDate: "09 Nov 2026",
        status: "Paid",
    },
    {
        id: 5,
        client: "GreenLeaf Agro",
        contact: "Priya Joshi",
        product: "StockPro",
        amount: "₹25,000",
        dueDate: "17 Jul 2026",
        status: "Pending",
    },
];
const teamMembers = [
    {
        id: 1,
        name: "Akash Pawar",
        initials: "AP",
        role: "ERP Support",
        currentTask: "GST report mismatch fix",
        loginTime: "09:02 AM",
        workingTime: "6h 20m",
        status: "Working",
        taskCount: 3,
    },
    {
        id: 2,
        name: "Sneha Kale",
        initials: "SK",
        role: "StockPro Support",
        currentTask: "StockPro V2 module",
        loginTime: "09:15 AM",
        workingTime: "5h 55m",
        status: "Working",
        taskCount: 2,
    },
    {
        id: 3,
        name: "Rohit More",
        initials: "RM",
        role: "Client Support",
        currentTask: "Available for assignment",
        loginTime: "08:55 AM",
        workingTime: "6h 40m",
        status: "Free",
        taskCount: 0,
    },
    {
        id: 4,
        name: "Pooja Shinde",
        initials: "PS",
        role: "Documentation",
        currentTask: "Available for assignment",
        loginTime: "09:30 AM",
        workingTime: "5h 10m",
        status: "Free",
        taskCount: 1,
    },
    {
        id: 5,
        name: "Nilesh Jadhav",
        initials: "NJ",
        role: "Developer",
        currentTask: "On leave",
        loginTime: "—",
        workingTime: "0h",
        status: "Leave",
        taskCount: 2,
    },
];

const recentTickets = [
    {
        id: "TKT-1042",
        title: "GST report mismatch in monthly summary",
        client: "Shree Ganesh Industries",
        product: "NexERP",
        assignedTo: "Akash Pawar",
        priority: "High",
        status: "In Progress",
        createdAt: "13 Jul 2026",
        resolvedAt: "—",
        source: "Client Portal",
    },
    {
        id: "TKT-1041",
        title: "Invoice print alignment issue",
        client: "Kavya Textiles Pvt Ltd",
        product: "BillFlow",
        assignedTo: "Sneha Kale",
        priority: "Medium",
        status: "Waiting",
        createdAt: "13 Jul 2026",
        resolvedAt: "—",
        source: "Phone Call",
    },
    {
        id: "TKT-1039",
        title: "Stock quantity not updating after purchase",
        client: "GreenLeaf Agro",
        product: "StockPro",
        assignedTo: "Rohit More",
        priority: "Critical",
        status: "New",
        createdAt: "12 Jul 2026",
        resolvedAt: "—",
        source: "WhatsApp",
    },
    {
        id: "TKT-1038",
        title: "User permission access required",
        client: "Precision Auto Parts",
        product: "NexERP",
        assignedTo: "Pooja Shinde",
        priority: "Low",
        status: "Resolved",
        createdAt: "12 Jul 2026",
        resolvedAt: "13 Jul 2026",
        source: "Admin",
    },
    {
        id: "TKT-1036",
        title: "Sales invoice total not matching",
        client: "Shree Ganesh Industries",
        product: "NexERP",
        assignedTo: "Akash Pawar",
        priority: "Medium",
        status: "Resolved",
        createdAt: "09 Jul 2026",
        resolvedAt: "10 Jul 2026",
        source: "Phone Call",
    },
    {
        id: "TKT-1034",
        title: "Backup process showing warning",
        client: "Shree Ganesh Industries",
        product: "NexERP",
        assignedTo: "Rohit More",
        priority: "Low",
        status: "Closed",
        createdAt: "05 Jul 2026",
        resolvedAt: "06 Jul 2026",
        source: "Client Portal",
    },
    {
        id: "TKT-1031",
        title: "Payroll report export not opening",
        client: "Kavya Textiles Pvt Ltd",
        product: "PayrollIX",
        assignedTo: "Sneha Kale",
        priority: "High",
        status: "Resolved",
        createdAt: "01 Jul 2026",
        resolvedAt: "02 Jul 2026",
        source: "Email",
    },
];
const activeTasks = [
    {
        id: "TSK-2084",
        title: "Fix GST report mismatch",
        client: "Shree Ganesh Industries",
        product: "NexERP",
        assignedTo: "Akash Pawar",
        priority: "High",
        status: "In Progress",
        dueDate: "Today",
        estimatedTime: "2h 30m",
        spentTime: "1h 45m",
        progress: 70,
    },
    {
        id: "TSK-2083",
        title: "Complete StockPro V2 testing",
        client: "Internal Development",
        product: "StockPro",
        assignedTo: "Sneha Kale",
        priority: "Medium",
        status: "Testing",
        dueDate: "Tomorrow",
        estimatedTime: "4h",
        spentTime: "2h 20m",
        progress: 58,
    },
    {
        id: "TSK-2081",
        title: "Prepare client onboarding document",
        client: "Kavya Textiles Pvt Ltd",
        product: "BillFlow",
        assignedTo: "Pooja Shinde",
        priority: "Low",
        status: "In Progress",
        dueDate: "16 Jul 2026",
        estimatedTime: "3h",
        spentTime: "1h",
        progress: 35,
    },
];


const clientActivities = [
    {
        id: 1,
        type: "ticket",
        title: "New support ticket raised",
        description: "Shree Ganesh Industries reported a GST summary mismatch.",
        time: "10 minutes ago",
        icon: MessageSquare,
        iconStyle: "bg-orange-100 text-orange-700",
    },
    {
        id: 2,
        type: "payment",
        title: "AMC payment received",
        description: "Kavya Textiles Pvt Ltd paid ₹18,000 for BillFlow renewal.",
        time: "42 minutes ago",
        icon: ReceiptText,
        iconStyle: "bg-emerald-100 text-emerald-700",
    },
    {
        id: 3,
        type: "client",
        title: "New client added",
        description: "Apex Medical Distributors was added to the workspace.",
        time: "1 hour ago",
        icon: UserRoundPlus,
        iconStyle: "bg-violet-100 text-violet-700",
    },
    {
        id: 4,
        type: "call",
        title: "Client support call completed",
        description: "Rohit More completed a support call with Omkar Traders.",
        time: "2 hours ago",
        icon: PhoneCall,
        iconStyle: "bg-blue-100 text-blue-700",
    },
    {
        id: 5,
        type: "invoice",
        title: "AMC invoice generated",
        description: "Invoice AMC-2026-0048 was generated for GreenLeaf Agro.",
        time: "3 hours ago",
        icon: FileCheck2,
        iconStyle: "bg-slate-100 text-slate-700",
    },
];

const initialClients = [
    {
        id: 1,
        code: "CL-1001",
        companyName: "Shree Ganesh Industries",
        contactPerson: "Ramesh Patil",
        email: "ramesh@shreeganesh.com",
        mobile: "9876543210",
        city: "Pune",
        products: ["NexERP"],
        amcStatus: "Pending",
        nextRenewal: "15 Jul 2026",
        openTickets: 3,
        assignedTo: "Akash Pawar",
        status: "Active",
    },
    {
        id: 2,
        code: "CL-1002",
        companyName: "Kavya Textiles Pvt Ltd",
        contactPerson: "Sunita Sharma",
        email: "sunita@kavyatextiles.com",
        mobile: "9823012456",
        city: "Mumbai",
        products: ["BillFlow", "PayrollIX"],
        amcStatus: "Paid",
        nextRenewal: "03 Aug 2026",
        openTickets: 1,
        assignedTo: "Sneha Kale",
        status: "Active",
    },
    {
        id: 3,
        code: "CL-1003",
        companyName: "Omkar Traders",
        contactPerson: "Vijay Kulkarni",
        email: "vijay@omkartraders.com",
        mobile: "9890123456",
        city: "Nashik",
        products: ["RetailPOS"],
        amcStatus: "Overdue",
        nextRenewal: "21 Jun 2026",
        openTickets: 4,
        assignedTo: "Rohit More",
        status: "Active",
    },
    {
        id: 4,
        code: "CL-1004",
        companyName: "Precision Auto Parts",
        contactPerson: "Anil Deshmukh",
        email: "anil@precisionauto.com",
        mobile: "9765432109",
        city: "Aurangabad",
        products: ["NexERP", "StockPro"],
        amcStatus: "Paid",
        nextRenewal: "09 Nov 2026",
        openTickets: 0,
        assignedTo: "Pooja Shinde",
        status: "Active",
    },
    {
        id: 5,
        code: "CL-1005",
        companyName: "GreenLeaf Agro",
        contactPerson: "Priya Joshi",
        email: "priya@greenleafagro.com",
        mobile: "9012345678",
        city: "Kolhapur",
        products: ["StockPro"],
        amcStatus: "Pending",
        nextRenewal: "17 Jul 2026",
        openTickets: 2,
        assignedTo: "Akash Pawar",
        status: "Active",
    },
    {
        id: 6,
        code: "CL-1006",
        companyName: "Apex Medical Distributors",
        contactPerson: "Rahul Shah",
        email: "rahul@apexmedical.com",
        mobile: "9988776655",
        city: "Satara",
        products: ["NexERP"],
        amcStatus: "Not Started",
        nextRenewal: "12 Jan 2027",
        openTickets: 0,
        assignedTo: "Sneha Kale",
        status: "Inactive",
    },
];

const productInformation = {
    NexERP: {
        version: "v3.4.2",
        purchaseDate: "12 Jul 2024",
        installationDate: "18 Jul 2024",
        users: 12,
        supportType: "Premium",
        expiryDate: "15 Jul 2026",
        installationStatus: "Installed",
    },
    BillFlow: {
        version: "v2.8.1",
        purchaseDate: "03 Aug 2024",
        installationDate: "06 Aug 2024",
        users: 5,
        supportType: "Standard",
        expiryDate: "03 Aug 2026",
        installationStatus: "Installed",
    },
    PayrollIX: {
        version: "v1.9.0",
        purchaseDate: "10 Mar 2025",
        installationDate: "14 Mar 2025",
        users: 8,
        supportType: "Standard",
        expiryDate: "10 Mar 2027",
        installationStatus: "Installed",
    },
    RetailPOS: {
        version: "v4.1.3",
        purchaseDate: "21 Jun 2024",
        installationDate: "25 Jun 2024",
        users: 6,
        supportType: "Standard",
        expiryDate: "21 Jun 2026",
        installationStatus: "Installed",
    },
    StockPro: {
        version: "v2.5.0",
        purchaseDate: "17 Jul 2024",
        installationDate: "20 Jul 2024",
        users: 10,
        supportType: "Premium",
        expiryDate: "17 Jul 2026",
        installationStatus: "Installed",
    },
    APP: {
        version: "v1.0.0",
        purchaseDate: "22 Jul 2025",
        installationDate: "24 Jul 2025",
        users: 3,
        supportType: "Basic",
        expiryDate: "22 Jul 2026",
        installationStatus: "Installed",
    },
};
const clientAmcRecords = [
    {
        id: 1,
        invoiceNo: "AMC-2026-0048",
        client: "Shree Ganesh Industries",
        product: "NexERP",
        period: "16 Jul 2026 - 15 Jul 2027",
        invoiceDate: "01 Jul 2026",
        dueDate: "15 Jul 2026",
        amount: 45000,
        paidAmount: 0,
        status: "Pending",
        reminderStatus: "Sent",
    },
    {
        id: 2,
        invoiceNo: "AMC-2025-0031",
        client: "Shree Ganesh Industries",
        product: "NexERP",
        period: "16 Jul 2025 - 15 Jul 2026",
        invoiceDate: "01 Jul 2025",
        dueDate: "15 Jul 2025",
        amount: 42000,
        paidAmount: 42000,
        status: "Paid",
        reminderStatus: "Not Required",
    },
    {
        id: 3,
        invoiceNo: "AMC-2026-0051",
        client: "Kavya Textiles Pvt Ltd",
        product: "BillFlow",
        period: "04 Aug 2026 - 03 Aug 2027",
        invoiceDate: "20 Jul 2026",
        dueDate: "03 Aug 2026",
        amount: 18000,
        paidAmount: 18000,
        status: "Paid",
        reminderStatus: "Not Required",
    },
    {
        id: 4,
        invoiceNo: "AMC-2026-0039",
        client: "Omkar Traders",
        product: "RetailPOS",
        period: "22 Jun 2026 - 21 Jun 2027",
        invoiceDate: "05 Jun 2026",
        dueDate: "21 Jun 2026",
        amount: 12000,
        paidAmount: 0,
        status: "Overdue",
        reminderStatus: "Sent",
    },
    {
        id: 5,
        invoiceNo: "AMC-2026-0049",
        client: "GreenLeaf Agro",
        product: "StockPro",
        period: "18 Jul 2026 - 17 Jul 2027",
        invoiceDate: "02 Jul 2026",
        dueDate: "17 Jul 2026",
        amount: 25000,
        paidAmount: 10000,
        status: "Partially Paid",
        reminderStatus: "Sent",
    },
];
export default function Admin({ onLogout }) {
    const [clientTicketFilter, setClientTicketFilter] = useState("All");
    const [activeMenu, setActiveMenu] = useState("overview");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [clientsError, setClientsError] = useState("");
    const [savingClient, setSavingClient] = useState(false);
    const [deletingClientId, setDeletingClientId] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState("");

    const [clientSearch, setClientSearch] = useState("");
    const [clientStatusFilter, setClientStatusFilter] = useState("All");
    const [clientAmcFilter, setClientAmcFilter] = useState("All");
    const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientDetailsTab, setClientDetailsTab] = useState("overview");
    const [editingClientId, setEditingClientId] = useState(null);
    const [productDrawerOpen, setProductDrawerOpen] = useState(false);
    const [savingProduct, setSavingProduct] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [clientAmcData, setClientAmcData] = useState(null);
    const [clientAmcLoading, setClientAmcLoading] = useState(false);
    const [clientAmcError, setClientAmcError] = useState("");

    const [clientPaymentsData, setClientPaymentsData] = useState([]);
    const [clientPaymentsLoading, setClientPaymentsLoading] = useState(false);
    const [clientPaymentsError, setClientPaymentsError] = useState("");

    const [clientDocumentsData, setClientDocumentsData] = useState([]);
    const [clientDocumentsLoading, setClientDocumentsLoading] = useState(false);
    const [clientDocumentsError, setClientDocumentsError] = useState("");
    const [savingClientDocument, setSavingClientDocument] = useState(false);
    const [documentDrawerOpen, setDocumentDrawerOpen] = useState(false);
    const [documentForm, setDocumentForm] = useState({
        name: "",
        type: "PDF",
        category: "Agreement",
        size: "",
        notes: "",
    });

    const [clientActivityData, setClientActivityData] = useState([]);
    const [clientActivityLoading, setClientActivityLoading] = useState(false);
    const [clientActivityError, setClientActivityError] = useState("");

    const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
    const [paymentTarget, setPaymentTarget] = useState(null);
    const [savingPayment, setSavingPayment] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        paymentDate: "",
        mode: "Bank Transfer",
        referenceNo: "",
        notes: "",
    });
    const [amcLoading, setAmcLoading] = useState(false);
    const [deletingProductId, setDeletingProductId] = useState(null);
    const [productMasters, setProductMasters] = useState([]);
    const [productMastersLoading, setProductMastersLoading] =
        useState(false);
    const [productMastersError, setProductMastersError] =
        useState("");
    const [dashboardStats, setDashboardStats] = useState([]);
    const [amcRenewals, setAmcRenewals] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [recentTickets, setRecentTickets] = useState([]);
    const [activeTasks, setActiveTasks] = useState([]);
    const [clientActivities, setClientActivities] = useState([]);

    // Loading & error states (per data set or a global loading flag)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] =
        useState(false);
    const [employeesError, setEmployeesError] =
        useState("");

    const [productForm, setProductForm] = useState({
        productId: "",
        productCode: "",
        productName: "",
        version: "v1.0.0",
        purchaseDate: "",
        installationDate: "",
        licensedUsers: 1,
        supportType: "Standard",
        amcStatus: "Not Started",
        expiryDate: "",
        installationStatus: "Installed",
        notes: "",
    });
    const [clientForm, setClientForm] = useState({
        code: "",
        companyName: "",
        contactPerson: "",
        email: "",
        mobile: "",
        city: "",

        productId: "",
        productVersion: "v1.0.0",
        licensedUsers: 1,
        supportType: "Standard",
        installationStatus: "Installed",

        amcStatus: "Not Started",
        nextRenewal: "",
        assignedEmployeeId: "",
        assignedEmployeeCode: "",
        assignedEmployeeName: "",
        status: "Active",
        createLogin: true,
        temporaryPassword: "",
    });
    const getAuthToken = () => {
        return (
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token") ||
            ""
        );
    };

    const normalizeClientFromApi = (client = {}) => ({
        ...client,

        id:
            client.id ||
            client._id ||
            "",

        _id:
            client._id ||
            client.id ||
            "",

        code:
            client.clientCode ||
            client.code ||
            "",

        clientCode:
            client.clientCode ||
            client.code ||
            "",

        companyName:
            client.companyName ||
            "",

        contactPerson:
            client.contactPerson ||
            "",

        email:
            client.email ||
            "",

        mobile:
            client.mobile ||
            "",

        city:
            client.city ||
            "",

        products:
            Array.isArray(client.products)
                ? client.products.map((product) => ({
                    ...product,

                    id:
                        product.id ||
                        product._id ||
                        "",

                    _id:
                        product._id ||
                        product.id ||
                        "",

                    productId:
                        product.productId ||
                        "",

                    productCode:
                        product.productCode ||
                        "",

                    productName:
                        product.productName ||
                        "",

                    version:
                        product.version ||
                        "v1.0.0",

                    purchaseDate:
                        product.purchaseDate ||
                        "",

                    installationDate:
                        product.installationDate ||
                        "",

                    licensedUsers:
                        Number(
                            product.licensedUsers ||
                            1
                        ),

                    supportType:
                        product.supportType ||
                        "Standard",

                    amcStatus:
                        product.amcStatus ||
                        "Not Started",

                    expiryDate:
                        product.expiryDate ||
                        "",

                    installationStatus:
                        product.installationStatus ||
                        "Installed",

                    notes:
                        product.notes ||
                        "",
                }))
                : [],

        amcStatus:
            client.amcStatus ||
            "Not Started",

        nextRenewal:
            client.nextRenewal ||
            "",

        openTickets:
            Number(
                client.openTickets ||
                0
            ),

        assignedEmployeeId:
            client.assignedEmployeeId?._id ||
            client.assignedEmployeeId ||
            "",

        assignedEmployeeCode:
            client.assignedEmployeeCode ||
            "",

        assignedEmployeeName:
            client.assignedEmployeeName ||
            "Unassigned",

        status:
            client.status ||
            "Active",
    });

    const loadClients = async () => {
        try {
            setClientsLoading(true);
            setClientsError("");

            const response = await fetch(
                `${API_URL}/api/admin/clients`,
                {
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to load clients."
                );
            }

            const normalizedClients = Array.isArray(result.data)
                ? result.data.map(normalizeClientFromApi)
                : [];

            setClients(normalizedClients);
        } catch (error) {
            console.error("Load clients error:", error);

            setClientsError(
                error.message || "Unable to load clients."
            );

            setClients([]);
        } finally {
            setClientsLoading(false);
        }
    };
    const loadClientDetails = async (
        clientId
    ) => {
        if (!clientId) {
            throw new Error(
                "Client ID is missing."
            );
        }

        const response = await fetch(
            `${API_URL}/api/admin/client/${clientId}`,
            {
                method: "GET",

                headers: {
                    Accept:
                        "application/json",

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
                "Unable to load client details."
            );
        }

        return normalizeClientFromApi(
            result.data
        );
    };

    const loadClientAmc = async (clientId) => {
        if (!clientId) return;

        try {
            setClientAmcLoading(true);
            setClientAmcError("");

            const response = await fetch(
                `${API_URL}/api/admin/client/${clientId}/amc`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load AMC records.");
            }

            setClientAmcData(result.data);
        } catch (error) {
            console.error("Load client AMC error:", error);
            setClientAmcError(error.message || "Unable to load AMC records.");
            setClientAmcData(null);
        } finally {
            setClientAmcLoading(false);
        }
    };

    const loadClientPayments = async (clientId) => {
        if (!clientId) return;

        try {
            setClientPaymentsLoading(true);
            setClientPaymentsError("");

            const response = await fetch(
                `${API_URL}/api/admin/client/${clientId}/payments`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load payments.");
            }

            setClientPaymentsData(result.data || []);
        } catch (error) {
            console.error("Load client payments error:", error);
            setClientPaymentsError(error.message || "Unable to load payments.");
            setClientPaymentsData([]);
        } finally {
            setClientPaymentsLoading(false);
        }
    };

    const loadClientDocuments = async (clientId) => {
        if (!clientId) return;

        try {
            setClientDocumentsLoading(true);
            setClientDocumentsError("");

            const response = await fetch(
                `${API_URL}/api/admin/client/${clientId}/documents`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load documents.");
            }

            setClientDocumentsData(result.data || []);
        } catch (error) {
            console.error("Load client documents error:", error);
            setClientDocumentsError(error.message || "Unable to load documents.");
            setClientDocumentsData([]);
        } finally {
            setClientDocumentsLoading(false);
        }
    };

    const addClientDocument = async (event) => {
        event.preventDefault();

        const clientId = selectedClient?._id || selectedClient?.id;
        if (!clientId) return;

        try {
            setSavingClientDocument(true);

            const response = await fetch(
                `${API_URL}/api/admin/client/${clientId}/documents`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                    body: JSON.stringify(documentForm),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to add document.");
            }

            setDocumentDrawerOpen(false);
            setDocumentForm({
                name: "",
                type: "PDF",
                category: "Agreement",
                size: "",
                notes: "",
            });

            await loadClientDocuments(clientId);
        } catch (error) {
            console.error("Add client document error:", error);
            alert(error.message || "Unable to add document.");
        } finally {
            setSavingClientDocument(false);
        }
    };

    const deleteClientDocument = async (docId) => {
        const clientId = selectedClient?._id || selectedClient?.id;
        if (!clientId || !docId) return;

        if (!window.confirm("Remove this document record?")) return;

        try {
            const response = await fetch(
                `${API_URL}/api/admin/client/${clientId}/documents/${docId}`,
                {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to delete document.");
            }

            await loadClientDocuments(clientId);
        } catch (error) {
            console.error("Delete client document error:", error);
            alert(error.message || "Unable to delete document.");
        }
    };

    const loadClientActivity = async (clientId) => {
        if (!clientId) return;

        try {
            setClientActivityLoading(true);
            setClientActivityError("");

            const response = await fetch(
                `${API_URL}/api/admin/activities?clientId=${clientId}&limit=50`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load activity.");
            }

            const activities = result.data || [];

            setClientActivityData(
                activities.map((item) => ({
                    id: item._id,
                    type: item.action,
                    description: item.description,
                    user: item.performedByName || "System",
                    date: item.createdAt,
                }))
            );
        } catch (error) {
            console.error("Load client activity error:", error);
            setClientActivityError(error.message || "Unable to load activity.");
            setClientActivityData([]);
        } finally {
            setClientActivityLoading(false);
        }
    };

    const openRecordPayment = (record) => {
        const balance = Math.max((record.amount || 0) - (record.paidAmount || 0), 0);

        setPaymentTarget(record);
        setPaymentForm({
            amount: balance > 0 ? String(balance) : "",
            paymentDate: new Date().toISOString().slice(0, 10),
            mode: "Bank Transfer",
            referenceNo: "",
            notes: "",
        });
        setPaymentDrawerOpen(true);
    };

    const submitRecordPayment = async (event) => {
        event.preventDefault();

        const clientId = selectedClient?._id || selectedClient?.id;
        if (!clientId || !paymentTarget) return;

        try {
            setSavingPayment(true);

            const response = await fetch(
                `${API_URL}/api/admin/amc/payment`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                    body: JSON.stringify({
                        amcInvoiceId: paymentTarget.id,
                        amount: Number(paymentForm.amount),
                        paymentDate: paymentForm.paymentDate,
                        mode: paymentForm.mode,
                        referenceNo: paymentForm.referenceNo,
                        notes: paymentForm.notes,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to record payment.");
            }

            setPaymentDrawerOpen(false);
            setPaymentTarget(null);

            await Promise.all([
                loadClientAmc(clientId),
                loadClientPayments(clientId),
            ]);

            try {
                const fullClient = await loadClientDetails(clientId);
                setSelectedClient(fullClient);
            } catch (refreshError) {
                console.error("Refresh client after payment error:", refreshError);
            }
        } catch (error) {
            console.error("Record payment error:", error);
            alert(error.message || "Unable to record payment.");
        } finally {
            setSavingPayment(false);
        }
    };

    const loadProductMasters = async () => {
        try {
            setProductMastersLoading(true);
            setProductMastersError("");

            const response = await fetch(
                `${API_URL}/api/admin/products`,
                {
                    method: "GET",

                    headers: {
                        Accept: "application/json",

                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                    "Unable to load Product Master."
                );
            }

            const sourceProducts =
                Array.isArray(result.data)
                    ? result.data
                    : Array.isArray(result.products)
                        ? result.products
                        : [];

            const normalizedProducts =
                sourceProducts
                    .map((product) => ({
                        id:
                            product.id ||
                            product._id ||
                            "",

                        _id:
                            product._id ||
                            product.id ||
                            "",

                        productCode:
                            String(
                                product.productCode ||
                                ""
                            ).trim(),

                        productName:
                            String(
                                product.productName ||
                                ""
                            ).trim(),

                        currentVersion:
                            String(
                                product.currentVersion ||
                                product.version ||
                                "v1.0.0"
                            ).trim(),

                        category:
                            product.category ||
                            "Software",

                        platform:
                            product.platform ||
                            "Web",

                        status:
                            product.status ||
                            "Active",
                    }))
                    .filter(
                        (product) =>
                            product.id &&
                            product.productName &&
                            product.status === "Active"
                    )
                    .sort((first, second) =>
                        first.productName.localeCompare(
                            second.productName
                        )
                    );

            setProductMasters(
                normalizedProducts
            );

            if (
                normalizedProducts.length === 0
            ) {
                setProductMastersError(
                    "No active products found in Product Master."
                );
            }
        } catch (error) {
            console.error(
                "Load Product Master error:",
                error
            );

            setProductMasters([]);

            setProductMastersError(
                error.message ||
                "Unable to load Product Master."
            );
        } finally {
            setProductMastersLoading(false);
        }
    };
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };
    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };
    const timeAgo = (dateString) => {
        const now = Date.now();
        const diff = now - new Date(dateString).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? "s" : ""} ago`;
    };
    const formatMinutes = (minutes) => {
        if (!minutes) return "0h";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    const formatWorkingTime = (minutes) => {
        if (!minutes) return "0h";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m.toString().padStart(2, "0")}m`;
    };
    // Mapping for activity icons
    const getIconForActivity = (category) => {
        const map = {
            Ticket: MessageSquare,
            Payment: ReceiptText,
            Client: UserRoundPlus,
            Call: PhoneCall,
            Invoice: FileCheck2,
        };
        return map[category] || Activity;
    };

    const getIconStyleForActivity = (category) => {
        const map = {
            Ticket: "bg-orange-100 text-orange-700",
            Payment: "bg-emerald-100 text-emerald-700",
            Client: "bg-violet-100 text-violet-700",
            Call: "bg-blue-100 text-blue-700",
            Invoice: "bg-slate-100 text-slate-700",
        };
        return map[category] || "bg-slate-100 text-slate-600";
    };

    const fetchDashboardStats = async () => {
        const response = await fetch(`${API_URL}/api/admin/dashboard`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message);
        return result.data; // { totalClients, amcCollected, amcPending, openTickets }
    };

    const fetchAmcRenewals = async () => {
        const response = await fetch(`${API_URL}/api/admin/amc/contracts?status=Pending&status=Overdue&limit=5`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message);
        // Transform result.data to match the shape of `amcRenewals` in the UI
        return result.data.map(contract => ({
            id: contract._id,
            client: contract.clientName,
            contact: contract.contactPerson || '',
            product: contract.productName,
            amount: `₹${contract.totalAmount.toLocaleString()}`,
            dueDate: formatDate(contract.dueDate),
            status: contract.status, // "Pending", "Overdue", etc.
        }));
    };
    const fetchTeamMembers = async () => {
        const response = await fetch(`${API_URL}/api/employee/employees`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message);
        // Transform to match the teamMembers shape
        return result.data.map(emp => ({
            id: emp._id,
            name: emp.name,
            initials: emp.initials || emp.name.split(' ').map(w => w[0]).join(''),
            role: emp.role,
            currentTask: emp.currentTask || 'Available',
            loginTime: emp.loginTime ? new Date(emp.loginTime).toLocaleTimeString() : '—',
            workingTime: formatWorkingTime(emp.activeMinutes),
            status: emp.status === 'Free' ? 'Free' : emp.status === 'Leave' ? 'Leave' : 'Working',
            taskCount: emp.openTasks || 0,
        }));
    };
    const fetchRecentTickets = async () => {
        const response = await fetch(`${API_URL}/api/admin/tickets?limit=4`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message);
        return result.data.map(ticket => ({
            id: ticket.ticketCode,
            title: ticket.title,
            client: ticket.clientName,
            product: ticket.productName,
            assignedTo: ticket.assignedEmployeeName || 'Unassigned',
            priority: ticket.priority,
            status: ticket.status,
            createdAt: formatDate(ticket.createdAt),
            resolvedAt: ticket.resolvedAt ? formatDate(ticket.resolvedAt) : '—',
            source: ticket.source,
        }));
    };
    const fetchActiveTasks = async () => {
        const response = await fetch(`${API_URL}/api/admin/tasks?status=In Progress&status=Testing&limit=3`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message);
        return result.data.map(task => ({
            id: task.taskCode,
            title: task.title,
            client: task.clientName || 'Internal',
            product: task.productName || '',
            assignedTo: task.assignedEmployeeName,
            priority: task.priority,
            status: task.status,
            dueDate: formatDate(task.dueDate),
            estimatedTime: formatMinutes(task.estimatedMinutes),
            spentTime: formatMinutes(task.spentMinutes),
            progress: task.progress || 0,
        }));
    };
    const fetchClientActivities = async () => {
        const response = await fetch(`${API_URL}/api/admin/activities?limit=5`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message);
        // Transform to match clientActivities shape
        return result.data.map(activity => ({
            id: activity._id,
            type: activity.category.toLowerCase(), // 'ticket', 'payment', etc.
            title: activity.action,
            description: activity.description,
            time: timeAgo(activity.createdAt),
            icon: getIconForActivity(activity.category),
            iconStyle: getIconStyleForActivity(activity.category),
        }));
    };
    const loadDashboard = async () => {
        try {
            setDashboardLoading(true);
            const data = await fetchDashboardStats();
            setDashboardStats([
                { id: 1, label: "Total Clients", value: data.totalClients, change: "+4 this quarter", trend: "up", icon: Building2, iconStyle: "bg-violet-100 text-violet-700" },
                { id: 2, label: "AMC Collected", value: `₹${Number(data.amcCollected).toLocaleString()}`, change: "+12.4% from last year", trend: "up", icon: IndianRupee, iconStyle: "bg-emerald-100 text-emerald-700" },
                { id: 3, label: "AMC Pending", value: `₹${Number(data.amcPending).toLocaleString()}`, change: "8 renewals pending", trend: "down", icon: CreditCard, iconStyle: "bg-amber-100 text-amber-700" },
                { id: 4, label: "Open Tickets", value: data.openTickets, change: "3 need attention", trend: "down", icon: TicketCheck, iconStyle: "bg-rose-100 text-rose-700" },
            ]);
            setDashboardError(null);
        } catch (error) {
            console.error("Dashboard load error:", error);
            setDashboardError(error.message);
        } finally {
            setDashboardLoading(false);
        }
    };
    const loadEmployees = async () => {
        try {
            setEmployeesLoading(true);
            setEmployeesError("");

            const response = await fetch(
                `${API_URL}/api/employee/employees`,
                {
                    method: "GET",

                    headers: {
                        Accept: "application/json",

                        Authorization:
                            `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result.message ||
                    "Unable to load employees."
                );
            }

            const sourceEmployees =
                Array.isArray(result.data)
                    ? result.data
                    : Array.isArray(result.employees)
                        ? result.employees
                        : [];

            const normalizedEmployees =
                sourceEmployees
                    .map((employee) => ({
                        id:
                            employee.id ||
                            employee._id ||
                            "",

                        _id:
                            employee._id ||
                            employee.id ||
                            "",

                        employeeCode:
                            employee.employeeCode ||
                            employee.code ||
                            "",

                        name:
                            employee.name ||
                            employee.employeeName ||
                            employee.fullName ||
                            "",

                        department:
                            employee.department ||
                            "",

                        designation:
                            employee.designation ||
                            employee.role ||
                            "",

                        status:
                            employee.status ||
                            (
                                employee.isActive === false
                                    ? "Inactive"
                                    : "Active"
                            ),

                        isActive:
                            employee.isActive !== false &&
                            employee.status !== "Inactive",
                    }))
                    .filter(
                        (employee) =>
                            employee.id &&
                            employee.name &&
                            employee.isActive
                    )
                    .sort((first, second) =>
                        first.name.localeCompare(
                            second.name
                        )
                    );

            setEmployees(
                normalizedEmployees
            );

            if (
                normalizedEmployees.length === 0
            ) {
                setEmployeesError(
                    "No active employees found."
                );
            }
        } catch (error) {
            console.error(
                "Load employees error:",
                error
            );

            setEmployees([]);

            setEmployeesError(
                error.message ||
                "Unable to load employees."
            );
        } finally {
            setEmployeesLoading(false);
        }
    };

    useEffect(() => {
        const loadAllData = async () => {
            try {
                // Load clients, products, employees (already existing)
                await Promise.all([
                    loadClients(),
                    loadProductMasters(),
                    loadEmployees(),
                    loadDashboard(),
                ]);

                // Load other widgets in parallel
                const [renewals, team, tickets, tasks, activities] = await Promise.all([
                    fetchAmcRenewals(),
                    fetchTeamMembers(),
                    fetchRecentTickets(),
                    fetchActiveTasks(),
                    fetchClientActivities(),
                ]);

                setAmcRenewals(renewals);
                setTeamMembers(team);
                setRecentTickets(tickets);
                setActiveTasks(tasks);
                setClientActivities(activities);
            } catch (error) {
                console.error("Load all data error:", error);
                setDashboardError(error.message);
            }
        };
        loadAllData();
    }, []);

    useEffect(() => {
        const clientId = selectedClient?._id || selectedClient?.id;
        if (!clientId) return;

        if (clientDetailsTab === "amc" && !clientAmcData) {
            loadClientAmc(clientId);
        } else if (clientDetailsTab === "payments" && clientPaymentsData.length === 0) {
            loadClientPayments(clientId);
        } else if (clientDetailsTab === "documents" && clientDocumentsData.length === 0) {
            loadClientDocuments(clientId);
        } else if (clientDetailsTab === "activity" && clientActivityData.length === 0) {
            loadClientActivity(clientId);
        }
    }, [clientDetailsTab, selectedClient]);

    useEffect(() => {
        if (
            !sidebarOpen &&
            !clientDrawerOpen &&
            !productDrawerOpen &&
            !paymentDrawerOpen
        ) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [
        sidebarOpen,
        clientDrawerOpen,
        productDrawerOpen,
        paymentDrawerOpen,
    ]);

    const selectedMenu =
        menuItems.find((item) => item.id === activeMenu) || menuItems[0];



    const filteredClients = clients.filter((client) => {
        const searchValue = clientSearch.trim().toLowerCase();

        const matchesSearch =
            !searchValue ||
            [
                client.code,
                client.companyName,
                client.contactPerson,
                client.email,
                client.mobile,
                client.city,
                client.assignedEmployeeName,
                client.assignedEmployeeCode,
                ...(Array.isArray(client.products)
                    ? client.products.map((product) =>
                        typeof product === "string"
                            ? product
                            : product.productName
                    )
                    : []),
            ].some((value) =>
                String(value || "").toLowerCase().includes(searchValue)
            );

        const matchesStatus =
            clientStatusFilter === "All" ||
            client.status === clientStatusFilter;

        const matchesAmc =
            clientAmcFilter === "All" ||
            client.amcStatus === clientAmcFilter;

        return matchesSearch && matchesStatus && matchesAmc;
    });

    const handleClientInputChange = (event) => {
        const { name, value } = event.target;

        setClientForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const resetClientForm = () => {
        setClientForm({
            code: "",
            companyName: "",
            contactPerson: "",
            email: "",
            mobile: "",
            city: "",

            productId: "",
            productVersion: "v1.0.0",
            licensedUsers: 1,
            supportType: "Standard",
            installationStatus: "Installed",

            amcStatus: "Not Started",
            nextRenewal: "",
            assignedEmployeeId: "",
            assignedEmployeeCode: "",
            assignedEmployeeName: "",
            status: "Active",
        });
    };
    const openClientDrawer = (client = null) => {
        if (client) {
            setEditingClientId(client._id || client.id);

            setClientForm({
                code: client.clientCode || client.code || "",
                companyName: client.companyName || "",
                contactPerson: client.contactPerson || "",
                email: client.email || "",
                mobile: client.mobile || "",
                city: client.city || "",

                productId: "",
                productVersion: "v1.0.0",
                licensedUsers: 1,
                supportType: "Standard",
                installationStatus: "Installed",

                amcStatus: client.amcStatus || "Not Started",
                nextRenewal: client.nextRenewal || "",
                assignedEmployeeId:
                    client.assignedEmployeeId || "",

                assignedEmployeeCode:
                    client.assignedEmployeeCode || "",

                assignedEmployeeName:
                    client.assignedEmployeeName || "",
                status: client.status || "Active",
            });

            setClientDrawerOpen(true);
            return;
        }

        const highestClientNumber =
            clients.reduce(
                (
                    highest,
                    currentClient
                ) => {
                    const code =
                        String(
                            currentClient.clientCode ||
                            currentClient.code ||
                            ""
                        ).trim();

                    const match =
                        code.match(
                            /^CL-(\d+)$/i
                        );

                    if (!match) {
                        return highest;
                    }

                    return Math.max(
                        highest,
                        Number(match[1]) ||
                        0
                    );
                },
                1000
            );

        setEditingClientId(null);

        setClientForm({
            code:
                `CL-${highestClientNumber + 1}`,

            companyName: "",
            contactPerson: "",
            email: "",
            mobile: "",
            city: "",

            productId: "",
            productVersion: "v1.0.0",
            licensedUsers: 1,
            supportType: "Standard",
            installationStatus:
                "Installed",

            amcStatus:
                "Not Started",

            nextRenewal: "",
            assignedEmployeeId: "",
            assignedEmployeeCode: "",
            assignedEmployeeName: "",
            status: "Active",
        });

        setClientDrawerOpen(true);
    };
    const closeClientDrawer = () => {
        setClientDrawerOpen(false);
        setEditingClientId(null);
        resetClientForm();
    };

    const openClientDetails = async (
        client
    ) => {
        const clientId =
            client?._id ||
            client?.id;

        if (!clientId) {
            alert(
                "Client ID is missing."
            );
            return;
        }

        /*
         * Show current list data immediately.
         */
        setSelectedClient(
            normalizeClientFromApi(
                client
            )
        );

        setClientDetailsTab(
            "overview"
        );

        setClientAmcData(null);
        setClientPaymentsData([]);
        setClientDocumentsData([]);
        setClientActivityData([]);

        /*
         * Reload complete client record,
         * including assigned products.
         */
        try {
            const fullClient =
                await loadClientDetails(
                    clientId
                );

            setSelectedClient(
                fullClient
            );

            setClients(
                (currentClients) =>
                    currentClients.map(
                        (currentClient) =>
                            String(
                                currentClient._id ||
                                currentClient.id
                            ) ===
                                String(clientId)
                                ? fullClient
                                : currentClient
                    )
            );
        } catch (error) {
            console.error(
                "Load client details error:",
                error
            );

            alert(
                error.message ||
                "Unable to load client products."
            );
        }
    };

    const closeClientDetails = () => {
        setSelectedClient(null);
        setClientDetailsTab("overview");
        setClientAmcData(null);
        setClientPaymentsData([]);
        setClientDocumentsData([]);
        setClientActivityData([]);
    };
    const resetProductForm = () => {
        setProductForm({
            productId: "",
            productCode: "",
            productName: "",
            version: "v1.0.0",
            purchaseDate: "",
            installationDate: "",
            licensedUsers: 1,
            supportType: "Standard",
            amcStatus: "Not Started",
            expiryDate: "",
            installationStatus: "Installed",
            notes: "",
        });
    };

    const openProductDrawer = async (
        product = null
    ) => {
        if (!selectedClient) {
            alert(
                "Please select a client first."
            );
            return;
        }

        /*
         * Reload Product Master so newly created
         * products appear immediately.
         */
        await loadProductMasters();

        const isActualProduct =
            product &&
            typeof product === "object" &&
            !("nativeEvent" in product) &&
            (
                product._id ||
                product.id ||
                product.productId
            );

        if (isActualProduct) {
            const assignmentId =
                product._id ||
                product.id;

            if (!assignmentId) {
                alert(
                    "Product assignment ID is missing."
                );
                return;
            }

            setEditingProductId(
                assignmentId
            );

            setProductForm({
                productId:
                    product.productId ||
                    "",

                productCode:
                    product.productCode ||
                    "",

                productName:
                    product.productName ||
                    "",

                version:
                    product.version ||
                    "v1.0.0",

                purchaseDate:
                    product.purchaseDate &&
                        product.purchaseDate !==
                        "Not available"
                        ? String(
                            product.purchaseDate
                        ).slice(0, 10)
                        : "",

                installationDate:
                    product.installationDate &&
                        product.installationDate !==
                        "Not available"
                        ? String(
                            product.installationDate
                        ).slice(0, 10)
                        : "",

                licensedUsers:
                    Math.max(
                        Number(
                            product.licensedUsers ||
                            product.users ||
                            1
                        ),
                        1
                    ),

                supportType:
                    product.supportType ||
                    "Standard",

                amcStatus:
                    product.amcStatus ||
                    "Not Started",

                expiryDate:
                    product.expiryDate &&
                        product.expiryDate !==
                        "Not available"
                        ? String(
                            product.expiryDate
                        ).slice(0, 10)
                        : "",

                installationStatus:
                    product.installationStatus ||
                    "Installed",

                notes:
                    product.notes ||
                    "",
            });

            setProductDrawerOpen(true);
            return;
        }

        setEditingProductId(null);
        resetProductForm();
        setProductDrawerOpen(true);
    };

    const closeProductDrawer = () => {
        if (savingProduct) {
            return;
        }

        setProductDrawerOpen(false);
        setEditingProductId(null);
        resetProductForm();
    };
    const handleProductInputChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setProductForm(
            (current) => ({
                ...current,
                [name]: value,
            })
        );
    };
    const handleAssignProduct = async (
        event
    ) => {
        event.preventDefault();

        if (!selectedClient) {
            alert(
                "Client information is missing."
            );
            return;
        }

        const clientId =
            selectedClient._id ||
            selectedClient.id;

        const productId =
            productForm.productId;

        if (!clientId) {
            alert(
                "Client ID is missing."
            );
            return;
        }

        if (!productId) {
            alert(
                "Please select a product."
            );
            return;
        }

        const isEditing =
            Boolean(
                editingProductId
            );

        const duplicateProduct =
            getSelectedClientProducts().some(
                (product) => {
                    const assignmentId =
                        product._id ||
                        product.id;

                    return (
                        String(
                            assignmentId
                        ) !==
                        String(
                            editingProductId ||
                            ""
                        ) &&
                        String(
                            product.productId ||
                            ""
                        ) ===
                        String(
                            productId
                        )
                    );
                }
            );

        if (duplicateProduct) {
            alert(
                "This product is already assigned to the client."
            );
            return;
        }

        try {
            setSavingProduct(true);

            const endpoint =
                isEditing
                    ? `${API_URL}/api/admin/client/${clientId}/product/${editingProductId}`
                    : `${API_URL}/api/admin/client/${clientId}/product`;

            const response =
                await fetch(
                    endpoint,
                    {
                        method:
                            isEditing
                                ? "PUT"
                                : "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json",

                            Authorization:
                                `Bearer ${getAuthToken()}`,
                        },

                        body:
                            JSON.stringify({
                                productId:
                                    productForm.productId,

                                version:
                                    productForm.version.trim() ||
                                    "v1.0.0",

                                purchaseDate:
                                    productForm.purchaseDate,

                                installationDate:
                                    productForm.installationDate,

                                licensedUsers:
                                    Math.max(
                                        Number(
                                            productForm.licensedUsers ||
                                            1
                                        ),
                                        1
                                    ),

                                supportType:
                                    productForm.supportType,

                                amcStatus:
                                    productForm.amcStatus,

                                expiryDate:
                                    productForm.expiryDate,

                                installationStatus:
                                    productForm.installationStatus,

                                notes:
                                    productForm.notes.trim(),
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
                    `Unable to ${isEditing
                        ? "update"
                        : "assign"
                    } product.`
                );
            }
            /*
             * First use API response.
             */
            let updatedClient =
                normalizeClientFromApi(
                    result.data
                );

            /*
             * Then fetch complete MongoDB record
             * so assigned products are guaranteed
             * to be present in Client Details.
             */
            try {
                updatedClient =
                    await loadClientDetails(
                        clientId
                    );
            } catch (
            refreshError
            ) {
                console.warn(
                    "Product saved, but client refresh failed:",
                    refreshError
                );
            }

            setClients(
                (currentClients) =>
                    currentClients.map(
                        (client) =>
                            String(
                                client._id ||
                                client.id
                            ) ===
                                String(clientId)
                                ? updatedClient
                                : client
                    )
            );

            setSelectedClient(
                updatedClient
            );

            setProductDrawerOpen(
                false
            );

            setEditingProductId(
                null
            );

            resetProductForm();

            alert(
                isEditing
                    ? "Product updated successfully."
                    : "Product assigned successfully."
            );
        } catch (error) {
            console.error(
                "Save product error:",
                error
            );

            alert(
                error.message ||
                "Unable to save product."
            );
        } finally {
            setSavingProduct(false);
        }
    };
    const handleDeleteProduct = async (product) => {
        if (!selectedClient) {
            alert("Client information is missing.");
            return;
        }

        const clientId =
            selectedClient._id || selectedClient.id;

        const productId =
            product._id || product.id;

        const productName =
            product.productName ||
            product.name ||
            "this product";

        if (!clientId || !productId) {
            alert("Client or product ID is missing.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete ${productName}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingProductId(productId);

            const response = await fetch(
                `${API_URL}/api/admin/client/${clientId}/product/${productId}`,
                {
                    method: "DELETE",

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
                    "Unable to delete product."
                );
            }

            const updatedClient =
                normalizeClientFromApi(result.data);

            setClients((currentClients) =>
                currentClients.map((client) =>
                    (client._id || client.id) === clientId
                        ? updatedClient
                        : client
                )
            );

            setSelectedClient(updatedClient);

            alert("Product deleted successfully.");
        } catch (error) {
            console.error("Delete product error:", error);

            alert(
                error.message ||
                "Unable to delete product."
            );
        } finally {
            setDeletingProductId(null);
        }
    };

    const formatClientDate = (dateValue) => {
        if (!dateValue) return "Not scheduled";

        const date = new Date(`${dateValue}T00:00:00`);

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const handleSaveClient = async (
        event
    ) => {
        event.preventDefault();

        const clientCode =
            clientForm.code
                .trim()
                .toUpperCase();

        const companyName =
            clientForm.companyName.trim();

        const mobile =
            clientForm.mobile.trim();

        if (
            !clientCode ||
            !companyName
        ) {
            alert(
                "Client code and company name are required."
            );
            return;
        }

        const duplicateCode =
            clients.some(
                (client) => {
                    const currentId =
                        client._id ||
                        client.id;

                    return (
                        String(
                            currentId
                        ) !==
                        String(
                            editingClientId ||
                            ""
                        ) &&
                        String(
                            client.code ||
                            client.clientCode ||
                            ""
                        )
                            .trim()
                            .toLowerCase() ===
                        clientCode.toLowerCase()
                    );
                }
            );

        if (duplicateCode) {
            alert(
                "This client code already exists."
            );
            return;
        }

        const duplicateMobile =
            mobile &&
            clients.some(
                (client) => {
                    const currentId =
                        client._id ||
                        client.id;

                    return (
                        String(
                            currentId
                        ) !==
                        String(
                            editingClientId ||
                            ""
                        ) &&
                        String(
                            client.mobile ||
                            ""
                        ).trim() ===
                        mobile
                    );
                }
            );

        if (duplicateMobile) {
            alert(
                "A client with this mobile number already exists."
            );
            return;
        }

        try {
            setSavingClient(true);

            const isEditing =
                Boolean(
                    editingClientId
                );

            const endpoint =
                isEditing
                    ? `${API_URL}/api/admin/client/${editingClientId}`
                    : `${API_URL}/api/admin/client`;

            const body = {
                clientCode,
                companyName,

                contactPerson:
                    clientForm.contactPerson.trim(),

                email:
                    clientForm.email
                        .trim()
                        .toLowerCase(),
                createLogin: clientForm.createLogin,
                temporaryPassword:
                    clientForm.temporaryPassword,

                mobile,

                city:
                    clientForm.city.trim(),

                amcStatus:
                    clientForm.amcStatus,

                nextRenewal:
                    clientForm.nextRenewal ||
                    "",

                assignedEmployeeId:
                    clientForm.assignedEmployeeId || "",

                status:
                    clientForm.status,
            };

            /*
             * Only new clients receive an empty
             * product list. Editing a client must
             * not remove assigned products.
             */
            if (!isEditing) {
                body.products =
                    clientForm.productId
                        ? [
                            {
                                productId:
                                    clientForm.productId,

                                version:
                                    clientForm.productVersion.trim() ||
                                    "v1.0.0",

                                purchaseDate:
                                    new Date()
                                        .toISOString()
                                        .slice(0, 10),

                                installationDate:
                                    "",

                                licensedUsers:
                                    Math.max(
                                        Number(
                                            clientForm.licensedUsers ||
                                            1
                                        ),
                                        1
                                    ),

                                supportType:
                                    clientForm.supportType ||
                                    "Standard",

                                amcStatus:
                                    clientForm.amcStatus ||
                                    "Not Started",

                                expiryDate:
                                    clientForm.nextRenewal ||
                                    "",

                                installationStatus:
                                    clientForm.installationStatus ||
                                    "Installed",

                                notes: "",
                            },
                        ]
                        : [];
            }

            const response =
                await fetch(
                    endpoint,
                    {
                        method:
                            isEditing
                                ? "PUT"
                                : "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json",

                            Authorization:
                                `Bearer ${getAuthToken()}`,
                        },

                        body:
                            JSON.stringify(
                                body
                            ),
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
                    `Unable to ${isEditing
                        ? "update"
                        : "save"
                    } client.`
                );
            }

            const savedClient =
                normalizeClientFromApi(
                    result.data
                );

            /*
             * Reload the complete Client list from MongoDB.
             * Do not manually append savedClient after this,
             * otherwise the same client appears twice.
             */
            await loadClients();

            if (
                isEditing &&
                selectedClient &&
                String(
                    selectedClient._id ||
                    selectedClient.id
                ) ===
                String(editingClientId)
            ) {
                setSelectedClient(
                    savedClient
                );
            }

            closeClientDrawer();

            alert(
                isEditing
                    ? "Client updated successfully."
                    : "Client added successfully."
            );
        } catch (error) {
            console.error(
                "Save client error:",
                error
            );

            alert(
                error.message ||
                "Unable to save client."
            );
        } finally {
            setSavingClient(false);
        }
    };
    const handleDeleteClient = async (client) => {
        const clientId = client._id || client.id;

        if (!clientId) {
            alert("Client ID is missing.");
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete ${client.companyName}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingClientId(clientId);

            const response = await fetch(
                `${API_URL}/api/admin/client/${clientId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to delete client."
                );
            }

            setClients((currentClients) =>
                currentClients.filter(
                    (currentClient) =>
                        (currentClient._id || currentClient.id) !== clientId
                )
            );

            if (
                selectedClient &&
                (selectedClient._id || selectedClient.id) === clientId
            ) {
                closeClientDetails();
            }

            alert("Client deleted successfully.");
        } catch (error) {
            console.error("Delete client error:", error);
            alert(error.message || "Unable to delete client.");
        } finally {
            setDeletingClientId(null);
        }
    };

    const getStatusClasses = (status) => {
        if (status === "Paid") {
            return "enterprise-badge bg-emerald-50 text-emerald-700 ring-emerald-600/10";
        }

        if (status === "Overdue") {
            return "enterprise-badge bg-rose-50 text-rose-700 ring-rose-600/10";
        }

        return "enterprise-badge bg-amber-50 text-amber-700 ring-amber-600/10";
    };

    const getPriorityClasses = (priority) => {
        if (priority === "Critical") {
            return "enterprise-badge bg-rose-50 text-rose-700 ring-rose-600/10";
        }

        if (priority === "High") {
            return "enterprise-badge bg-orange-50 text-orange-700 ring-orange-600/10";
        }

        if (priority === "Medium") {
            return "enterprise-badge bg-amber-50 text-amber-700 ring-amber-600/10";
        }

        return "enterprise-badge bg-slate-100 text-slate-600 ring-slate-500/10";
    };

    const getTicketStatusClasses = (status) => {
        if (status === "Resolved") {
            return "enterprise-badge bg-emerald-50 text-emerald-700 ring-emerald-600/10";
        }

        if (status === "In Progress") {
            return "enterprise-badge bg-violet-50 text-violet-700 ring-violet-600/10";
        }

        if (status === "Waiting") {
            return "enterprise-badge bg-amber-50 text-amber-700 ring-amber-600/10";
        }

        return "enterprise-badge bg-blue-50 text-blue-700 ring-blue-600/10";
    };

    const getTaskStatusClasses = (status) => {
        if (status === "Testing") {
            return "enterprise-badge bg-blue-50 text-blue-700 ring-blue-600/10";
        }

        if (status === "Completed") {
            return "enterprise-badge bg-emerald-50 text-emerald-700 ring-emerald-600/10";
        }

        return "enterprise-badge bg-violet-50 text-violet-700 ring-violet-600/10";
    };

    const getClientAmcClasses = (status) => {
        if (status === "Paid") {
            return "enterprise-badge bg-emerald-50 text-emerald-700 ring-emerald-600/10";
        }

        if (status === "Overdue") {
            return "enterprise-badge bg-rose-50 text-rose-700 ring-rose-600/10";
        }

        if (status === "Pending") {
            return "enterprise-badge bg-amber-50 text-amber-700 ring-amber-600/10";
        }

        return "enterprise-badge bg-slate-100 text-slate-600 ring-slate-500/10";
    };
    const getSelectedClientProducts =
        () => {
            const products =
                selectedClient?.products;

            if (
                !Array.isArray(products)
            ) {
                return [];
            }

            return products
                .filter(Boolean)
                .map(
                    (
                        product,
                        index
                    ) => {
                        const assignmentId =
                            product._id ||
                            product.id ||
                            "";

                        return {
                            ...product,

                            id:
                                assignmentId ||
                                `client-product-${index}`,

                            _id:
                                assignmentId,

                            productId:
                                product.productId?._id ||
                                product.productId ||
                                "",

                            productCode:
                                product.productCode ||
                                product.productId
                                    ?.productCode ||
                                "",

                            productName:
                                product.productName ||
                                product.productId
                                    ?.productName ||
                                "Unnamed Product",

                            name:
                                product.productName ||
                                product.productId
                                    ?.productName ||
                                "Unnamed Product",

                            version:
                                product.version ||
                                product.productId
                                    ?.currentVersion ||
                                "v1.0.0",

                            licensedUsers:
                                Math.max(
                                    Number(
                                        product.licensedUsers ||
                                        product.users ||
                                        1
                                    ),
                                    1
                                ),

                            users:
                                Math.max(
                                    Number(
                                        product.licensedUsers ||
                                        product.users ||
                                        1
                                    ),
                                    1
                                ),

                            purchaseDate:
                                product.purchaseDate ||
                                "Not available",

                            installationDate:
                                product.installationDate ||
                                "Not available",

                            supportType:
                                product.supportType ||
                                "Standard",

                            amcStatus:
                                product.amcStatus ||
                                "Not Started",

                            expiryDate:
                                product.expiryDate ||
                                "Not available",

                            installationStatus:
                                product.installationStatus ||
                                "Installed",

                            notes:
                                product.notes ||
                                "",
                        };
                    }
                );
        };


    const getSelectedClientTickets = () => {
        if (!selectedClient) return [];

        return recentTickets.filter(
            (ticket) => ticket.client === selectedClient.companyName
        );
    };

    const getFilteredSelectedClientTickets = () => {
        const tickets = getSelectedClientTickets();

        if (clientTicketFilter === "All") {
            return tickets;
        }

        return tickets.filter(
            (ticket) => ticket.status === clientTicketFilter
        );
    };
    const getSelectedClientAmcRecords = () => {
        if (!clientAmcData?.invoices) return [];

        return clientAmcData.invoices.map((invoice) => ({
            id: invoice.id,
            invoiceNo: invoice.invoiceCode,
            invoiceDate: invoice.invoiceDate,
            product: invoice.productName,
            period: `${invoice.startDate} - ${invoice.endDate}`,
            amount: invoice.totalAmount,
            paidAmount: invoice.paidAmount,
            dueDate: invoice.dueDate,
            status: invoice.paymentStatus,
            reminderStatus: invoice.reminderStatus || 'Not Sent',
        }));
    };

    const getAmcPaymentStatusClasses = (status) => {
        if (status === "Paid") {
            return "enterprise-badge bg-emerald-50 text-emerald-700 ring-emerald-600/10";
        }

        if (status === "Overdue") {
            return "enterprise-badge bg-rose-50 text-rose-700 ring-rose-600/10";
        }

        if (status === "Partially Paid") {
            return "enterprise-badge bg-blue-50 text-blue-700 ring-blue-600/10";
        }

        return "enterprise-badge bg-amber-50 text-amber-700 ring-amber-600/10";
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getSelectedClientPayments = () => {
        if (!selectedClient) return [];

        return clientPaymentsData;
    };

    const getSelectedClientPendingAmount = () => {
        return getSelectedClientAmcRecords().reduce(
            (total, record) =>
                total + Math.max(record.amount - record.paidAmount, 0),
            0
        );
    };

    const getLatestClientPayment = () => {
        const payments = getSelectedClientPayments();

        if (payments.length === 0) {
            return null;
        }

        return payments[0];
    };

    const getSelectedClientDocuments = () => {
        if (!selectedClient) return [];

        return clientDocumentsData;
    };
    const getSelectedClientActivity = () => {
        if (!selectedClient) return [];

        return clientActivityData;
    };
    return (
        <div className="enterprise-shell min-h-screen bg-[#f4f6fa] text-slate-900">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={() => setSidebarOpen(false)}
                    className="enterprise-backdrop fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`enterprise-sidebar fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-white/10 text-white transition-transform duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Sidebar Brand */}
                <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-950/30">
                            <span className="text-sm font-bold">CC</span>
                        </div>

                        <div className="min-w-0">
                            <h1 className="truncate text-sm font-semibold tracking-tight">
                                Client Connect
                            </h1>
                            <p className="truncate text-[11px] text-slate-400">
                                Admin Workspace
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
                    >
                        <X size={19} />
                    </button>
                </div>

                {/* Workspace */}
                <div className="px-4 pt-5">
                    <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-left transition hover:bg-white/[0.08]"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 text-sm font-semibold text-cyan-300">
                                TS
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-white">
                                    Total Solution
                                </p>
                                <p className="truncate text-[10px] text-slate-400">
                                    Main workspace
                                </p>
                            </div>
                        </div>

                        <ChevronDown size={15} className="text-slate-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="mt-6 flex-1 overflow-y-auto px-3">
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Workspace
                    </p>

                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeMenu === item.id;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveMenu(item.id);
                                        setSidebarOpen(false);
                                    }}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`enterprise-sidebar-nav-item group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive
                                        ? "bg-white text-slate-950 shadow-sm"
                                        : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                                        }`}
                                >
                                    <Icon
                                        size={18}
                                        strokeWidth={isActive ? 2.2 : 1.8}
                                        className={
                                            isActive
                                                ? "text-violet-600"
                                                : "text-slate-500 group-hover:text-cyan-300"
                                        }
                                    />

                                    <span>{item.label}</span>

                                    {item.id === "tickets" && (
                                        <span
                                            className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${isActive
                                                ? "bg-rose-100 text-rose-600"
                                                : "bg-rose-500/15 text-rose-300"
                                                }`}
                                        >
                                            3
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Management
                    </p>

                    <div className="space-y-1">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveMenu("settings");
                                setSidebarOpen(false);
                            }}
                            aria-current={activeMenu === "settings" ? "page" : undefined}
                            className={`enterprise-sidebar-nav-item group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${activeMenu === "settings"
                                ? "bg-white text-slate-950 shadow-sm"
                                : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                                }`}
                        >
                            <Settings
                                size={18}
                                strokeWidth={activeMenu === "settings" ? 2.2 : 1.8}
                                className={
                                    activeMenu === "settings"
                                        ? "text-violet-600"
                                        : "text-slate-500 group-hover:text-cyan-300"
                                }
                            />

                            <span>Settings</span>
                        </button>

                        <button
                            type="button"
                            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                        >
                            <CircleHelp
                                size={18}
                                className="text-slate-500 group-hover:text-cyan-300"
                            />
                            Help Center
                        </button>
                    </div>
                </nav>

                {/* Sidebar User */}
                <div className="shrink-0 border-t border-white/10 p-3">
                    <div className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.05]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-xs font-semibold">
                            MK
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-white">
                                Mangesh Kondhare
                            </p>
                            <p className="truncate text-[10px] text-slate-500">
                                Owner / Administrator
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onLogout}
                            title="Logout"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                        >
                            <LogOut size={17} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <div className="min-h-screen lg:pl-[272px]">
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-[76px] items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
                    <button
                        type="button"
                        aria-label="Open navigation"
                        onClick={() => setSidebarOpen(true)}
                        className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold tracking-[-0.02em] text-slate-950">
                            {activeMenu === "settings" ? "Settings" : selectedMenu.label}
                        </h2>
                        <p className="hidden text-xs text-slate-500 sm:block">
                            Manage your clients, support and company work
                        </p>
                    </div>

                    <div className="ml-auto flex items-center gap-2 sm:gap-3">
                        {/* Search */}
                        <div className="relative hidden md:block">
                            <Search
                                size={17}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="search"
                                placeholder="Search clients, tickets, tasks..."
                                className="h-10 w-[240px] rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:w-[300px] focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100 xl:w-[300px]"
                            />
                        </div>

                        <button
                            type="button"
                            aria-label="Notifications"
                            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                        >
                            <Bell size={18} />

                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
                        </button>

                        <button
                            type="button"
                            className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex"
                        >
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100 text-[10px] font-bold text-violet-700">
                                MK
                            </span>

                            Admin
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                {/* Page Content */}
                <main className="enterprise-workspace p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-[1600px]">
                        {activeMenu === "overview" ? (
                            <div className="enterprise-page">
                                {/* Dashboard Heading */}
                                <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-violet-600">
                                            <span className="h-2 w-2 rounded-full bg-violet-600" />
                                            Admin Workspace
                                        </div>

                                        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                                            Good morning, Mangesh
                                        </h1>

                                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                            Here is a clear overview of your clients, AMC collections,
                                            support tickets and company workload.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm">
                                            <CalendarDays size={17} className="text-slate-400" />

                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                    Today
                                                </p>

                                                <p className="text-xs font-semibold text-slate-700">
                                                    13 July 2026
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={openClientDrawer}
                                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 active:translate-y-0"
                                        >
                                            <Plus size={18} />
                                            Add Client
                                        </button>
                                    </div>
                                </section>

                                {/* Summary Statistics */}
                                <section
                                    aria-busy={dashboardLoading}
                                    aria-live="polite"
                                    className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
                                >
                                    {dashboardLoading ? (
                                        Array.from({ length: 4 }).map((_, index) => (
                                            <div
                                                key={index}
                                                aria-hidden="true"
                                                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="space-y-3">
                                                        <div className="h-3 w-24 rounded bg-slate-100" />
                                                        <div className="h-8 w-28 rounded bg-slate-200" />
                                                    </div>
                                                    <div className="h-11 w-11 rounded-xl bg-slate-100" />
                                                </div>
                                                <div className="mt-6 h-3 w-36 rounded bg-slate-100" />
                                            </div>
                                        ))
                                    ) : dashboardError ? (
                                        <div className="enterprise-empty-state col-span-full flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                                    <AlertCircle size={19} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        Dashboard data could not be loaded
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {dashboardError}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={loadDashboard}
                                                className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                            >
                                                <RefreshCw size={15} />
                                                Retry
                                            </button>
                                        </div>
                                    ) : dashboardStats.map((stat, index) => {
                                        const Icon = stat.icon;
                                        const isPositive = stat.trend === "up";

                                        return (
                                            <article
                                                key={stat.id}
                                                className="enterprise-metric enterprise-surface--interactive group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                                                style={{ "--ts-enter-delay": `${index * 55}ms` }}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            {stat.label}
                                                        </p>

                                                        <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                                            {stat.value}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}
                                                    >
                                                        <Icon size={20} strokeWidth={1.9} />
                                                    </div>
                                                </div>

                                                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                                    <div
                                                        className={`flex items-center gap-1.5 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-amber-600"
                                                            }`}
                                                    >
                                                        {isPositive ? (
                                                            <TrendingUp size={15} />
                                                        ) : (
                                                            <TrendingDown size={15} />
                                                        )}

                                                        <span>{stat.change}</span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition group-hover:bg-slate-100 group-hover:text-slate-700"
                                                        aria-label={`View ${stat.label}`}
                                                    >
                                                        <ArrowUpRight size={16} />
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </section>

                                <div className="mt-8 grid gap-6 xl:grid-cols-[1.55fr_0.85fr] xl:items-stretch">


                                    {/* Temporary Next Section Placeholder */}
                                    {/* AMC Renewals */}
                                    <section className="self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                                        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-950">
                                                    AMC Renewals — Due & Overdue
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Monitor upcoming renewals and pending annual charges.
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                                >
                                                    <Download size={15} />
                                                    Export
                                                </button>

                                                <button
                                                    type="button"
                                                    className="flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-violet-600"
                                                >
                                                    <Plus size={15} />
                                                    Add Renewal
                                                </button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                            Client
                                                        </th>

                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Product
                                                        </th>

                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Amount
                                                        </th>

                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Due Date
                                                        </th>

                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Status
                                                        </th>

                                                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                            Bill
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {amcRenewals.map((renewal) => (
                                                        <tr
                                                            key={renewal.id}
                                                            className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                                        >
                                                            <td className="px-5 py-4 lg:px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                                                                        {renewal.client
                                                                            .split(" ")
                                                                            .slice(0, 2)
                                                                            .map((word) => word[0])
                                                                            .join("")}
                                                                    </div>

                                                                    <div className="min-w-[180px]">
                                                                        <p className="text-sm font-semibold text-slate-900">
                                                                            {renewal.client}
                                                                        </p>

                                                                        <p className="mt-0.5 text-[11px] text-slate-500">
                                                                            {renewal.contact}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-5 py-4 text-sm font-medium text-slate-600">
                                                                {renewal.product}
                                                            </td>

                                                            <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                                                {renewal.amount}
                                                            </td>

                                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                                {renewal.dueDate}
                                                            </td>

                                                            <td className="px-5 py-4">
                                                                <span
                                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getStatusClasses(
                                                                        renewal.status
                                                                    )}`}
                                                                >
                                                                    {renewal.status}
                                                                </span>
                                                            </td>

                                                            <td className="px-5 py-4 lg:px-6">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        type="button"
                                                                        className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                                    >
                                                                        <FileText size={14} />
                                                                        PDF
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                                                        aria-label={`More actions for ${renewal.client}`}
                                                                    >
                                                                        <MoreHorizontal size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                                            <p>Showing 5 upcoming and overdue AMC renewals</p>

                                            <button
                                                type="button"
                                                className="flex items-center gap-1 font-semibold text-violet-600 transition hover:text-violet-700"
                                            >
                                                View all renewals
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </div>
                                    </section>
                                    {/* Team Status */}
                                    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-950">
                                                    Team Status
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Live workload and employee availability.
                                                </p>
                                            </div>

                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                                                <Circle size={7} fill="currentColor" />
                                                2 free now
                                            </span>
                                        </div>

                                        <div className="flex-1 divide-y divide-slate-100">
                                            {teamMembers.slice(0, 4).map((member) => {
                                                const isFree = member.status === "Free";
                                                const isLeave = member.status === "Leave";

                                                return (
                                                    <div
                                                        key={member.id}
                                                        className="px-5 py-4 transition hover:bg-slate-50/80"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative shrink-0">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                                                                    {member.initials}
                                                                </div>

                                                                <span
                                                                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${isFree
                                                                        ? "bg-emerald-500"
                                                                        : isLeave
                                                                            ? "bg-slate-300"
                                                                            : "bg-amber-400"
                                                                        }`}
                                                                />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                                        {member.name}
                                                                    </p>

                                                                    <span className="shrink-0 text-[11px] font-semibold text-slate-500">
                                                                        {member.workingTime}
                                                                    </span>
                                                                </div>

                                                                <div className="mt-1 flex items-center justify-between gap-3">
                                                                    <p
                                                                        className={`truncate text-xs ${isFree
                                                                            ? "font-medium text-emerald-600"
                                                                            : isLeave
                                                                                ? "text-slate-400"
                                                                                : "text-slate-600"
                                                                            }`}
                                                                    >
                                                                        {member.currentTask}
                                                                    </p>

                                                                    <span
                                                                        className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${isFree
                                                                            ? "bg-emerald-50 text-emerald-700"
                                                                            : isLeave
                                                                                ? "bg-slate-100 text-slate-500"
                                                                                : "bg-amber-50 text-amber-700"
                                                                            }`}
                                                                    >
                                                                        {member.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isFree && (
                                                            <button
                                                                type="button"
                                                                className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                                            >
                                                                <UserPlus size={14} />
                                                                Assign Task
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-4">
                                            <button
                                                type="button"
                                                className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-violet-600 transition hover:text-violet-700"
                                            >
                                                View full team
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </div>
                                    </section>






                                </div>

                                {/* SECOND DASHBOARD ROW */}
                                <div className="mt-6 grid gap-6 xl:grid-cols-2">



                                    {/* Recent Support Tickets */}
                                    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                                        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-950">
                                                    Recent Support Tickets
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Latest client issues that require attention from your support team.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                            >
                                                View All Tickets
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </div>

                                        <div className="flex-1 divide-y divide-slate-100">
                                            {recentTickets.slice(0, 4).map((ticket) => (
                                                <article
                                                    key={ticket.id}
                                                    className="group px-5 py-4 transition hover:bg-slate-50/70 lg:px-6"
                                                >
                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                                            <div
                                                                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ticket.priority === "Critical"
                                                                    ? "bg-rose-100 text-rose-700"
                                                                    : ticket.priority === "High"
                                                                        ? "bg-orange-100 text-orange-700"
                                                                        : "bg-slate-100 text-slate-600"
                                                                    }`}
                                                            >
                                                                {ticket.status === "Resolved" ? (
                                                                    <CheckCircle2 size={18} />
                                                                ) : ticket.priority === "Critical" ? (
                                                                    <AlertCircle size={18} />
                                                                ) : (
                                                                    <MessageSquare size={18} />
                                                                )}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <p className="text-sm font-semibold text-slate-900">
                                                                        {ticket.title}
                                                                    </p>

                                                                    <span className="text-[11px] font-semibold text-violet-600">
                                                                        {ticket.id}
                                                                    </span>
                                                                </div>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {ticket.client} · {ticket.product}
                                                                </p>

                                                                <p className="mt-2 text-[11px] text-slate-400">
                                                                    Assigned to{" "}
                                                                    <span className="font-semibold text-slate-600">
                                                                        {ticket.assignedTo}
                                                                    </span>{" "}
                                                                    · {ticket.createdAt}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                                            <span
                                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getPriorityClasses(
                                                                    ticket.priority
                                                                )}`}
                                                            >
                                                                {ticket.priority}
                                                            </span>

                                                            <span
                                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getTicketStatusClasses(
                                                                    ticket.status
                                                                )}`}
                                                            >
                                                                {ticket.status}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                            >
                                                                Open
                                                                <ArrowUpRight size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Active Tasks */}
                                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                                        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-950">
                                                    Active Tasks
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Current assigned work and employee progress.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className="flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-violet-600"
                                            >
                                                <Plus size={15} />
                                                Assign
                                            </button>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {activeTasks.slice(0, 2).map((task) => (
                                                <article
                                                    key={task.id}
                                                    className="px-5 py-4 transition hover:bg-slate-50/70"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                                            {task.status === "Testing" ? (
                                                                <CircleDot size={18} />
                                                            ) : (
                                                                <PlayCircle size={18} />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-semibold text-slate-900">
                                                                        {task.title}
                                                                    </p>

                                                                    <p className="mt-0.5 text-[10px] font-semibold text-violet-600">
                                                                        {task.id}
                                                                    </p>
                                                                </div>

                                                                <span
                                                                    className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${getPriorityClasses(
                                                                        task.priority
                                                                    )}`}
                                                                >
                                                                    {task.priority}
                                                                </span>
                                                            </div>

                                                            <p className="mt-1 truncate text-[11px] text-slate-500">
                                                                {task.client} · {task.product}
                                                            </p>

                                                            <p className="mt-2 text-[10px] text-slate-400">
                                                                Assigned to{" "}
                                                                <span className="font-semibold text-slate-600">
                                                                    {task.assignedTo}
                                                                </span>
                                                            </p>

                                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Flag size={11} />
                                                                    {task.dueDate}
                                                                </span>

                                                                <span className="inline-flex items-center gap-1">
                                                                    <Timer size={11} />
                                                                    {task.spentTime} / {task.estimatedTime}
                                                                </span>
                                                            </div>

                                                            <div className="mt-3">
                                                                <div className="mb-1.5 flex items-center justify-between">
                                                                    <span className="text-[9px] font-medium text-slate-400">
                                                                        Progress
                                                                    </span>

                                                                    <span className="text-[9px] font-semibold text-slate-600">
                                                                        {task.progress}%
                                                                    </span>
                                                                </div>

                                                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                                    <div
                                                                        className="h-full rounded-full bg-violet-600"
                                                                        style={{ width: `${task.progress}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                                <span
                                                                    className={`inline-flex rounded-full px-2 py-1 text-[9px] font-bold ring-1 ring-inset ${getTaskStatusClasses(
                                                                        task.status
                                                                    )}`}
                                                                >
                                                                    {task.status}
                                                                </span>

                                                                <button
                                                                    type="button"
                                                                    className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                                >
                                                                    Open
                                                                    <ArrowUpRight size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>

                                        <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-4">
                                            <button
                                                type="button"
                                                className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-violet-600 transition hover:text-violet-700"
                                            >
                                                View all tasks
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </div>
                                    </section>


                                </div>

                                {/* THIRD DASHBOARD ROW */}
                                {/* Recent Client Activity */}
                                <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-950">
                                                Recent Client Activity
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Latest client, billing and support updates across the workspace.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                        >
                                            <Activity size={15} />
                                            View Activity
                                        </button>
                                    </div>

                                    <div className="relative px-5 py-2 lg:px-6">
                                        <div className="absolute bottom-6 left-[43px] top-6 w-px bg-slate-200 lg:left-[47px]" />

                                        {clientActivities.map((activity) => {
                                            const Icon = activity.icon;

                                            return (
                                                <article
                                                    key={activity.id}
                                                    className="relative flex gap-4 border-b border-slate-100 py-5 last:border-b-0"
                                                >
                                                    <div
                                                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-4 ring-white ${activity.iconStyle}`}
                                                    >
                                                        <Icon size={17} />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-slate-900">
                                                                    {activity.title}
                                                                </p>

                                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                                    {activity.description}
                                                                </p>
                                                            </div>

                                                            <span className="shrink-0 text-[10px] font-medium text-slate-400">
                                                                {activity.time}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>

                                    <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-4 lg:px-6">
                                        <button
                                            type="button"
                                            className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-violet-600 transition hover:text-violet-700"
                                        >
                                            View complete activity log
                                            <ArrowUpRight size={14} />
                                        </button>
                                    </div>
                                </section>







                            </div>

                        ) : activeMenu === "clients" ? (
                            selectedClient ? (
                                <div className="enterprise-page">
                                    <div>
                                        {/* Client Details Header */}
                                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                                            <div className="border-b border-slate-200 px-5 py-5 lg:px-6">
                                                <button
                                                    type="button"
                                                    onClick={closeClientDetails}
                                                    className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-violet-600"
                                                >
                                                    <ArrowLeft size={16} />
                                                    Back to clients
                                                </button>

                                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="flex min-w-0 items-start gap-4">
                                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-lg font-bold text-violet-700">
                                                            {selectedClient.companyName
                                                                .split(" ")
                                                                .slice(0, 2)
                                                                .map((word) => word[0])
                                                                .join("")}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                                                                    {selectedClient.companyName}
                                                                </h1>

                                                                <span
                                                                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedClient.status === "Active"
                                                                        ? "bg-emerald-50 text-emerald-700"
                                                                        : "bg-slate-100 text-slate-500"
                                                                        }`}
                                                                >
                                                                    {selectedClient.status}
                                                                </span>
                                                            </div>

                                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <Hash size={14} />
                                                                    {selectedClient.code}
                                                                </span>

                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <MapPinned size={14} />
                                                                    {selectedClient.city}
                                                                </span>

                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <UserRound size={14} />
                                                                    {selectedClient.contactPerson}
                                                                </span>
                                                            </div>

                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {(Array.isArray(selectedClient.products)
                                                                    ? selectedClient.products
                                                                    : []
                                                                ).map((product, index) => {
                                                                    const productName =
                                                                        typeof product === "string"
                                                                            ? product
                                                                            : product?.productName || "Unnamed Product";

                                                                    const productKey =
                                                                        typeof product === "string"
                                                                            ? `${product}-${index}`
                                                                            : product?._id || `${productName}-${index}`;

                                                                    return (
                                                                        <span
                                                                            key={productKey}
                                                                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                                                                        >
                                                                            {productName}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openClientDrawer(selectedClient)}
                                                            className="flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-xs font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                                                        >
                                                            <Pencil size={15} />
                                                            Edit Client
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                deletingClientId ===
                                                                (selectedClient?._id || selectedClient?.id)
                                                            }
                                                            onClick={() => handleDeleteClient(selectedClient)}
                                                            className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {deletingClientId ===
                                                                (selectedClient?._id || selectedClient?.id) ? (
                                                                <>
                                                                    <RefreshCw size={15} className="animate-spin" />
                                                                    Deleting...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Trash2 size={15} />
                                                                    Delete Client
                                                                </>
                                                            )}
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                                        >
                                                            <Phone size={15} />
                                                            Call
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                                        >
                                                            <Mail size={15} />
                                                            Email
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                                        >
                                                            <ExternalLink size={15} />
                                                            Open Workspace
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Stats */}
                                            <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
                                                <div className="px-5 py-4 lg:px-6">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                        AMC Status
                                                    </p>

                                                    <span
                                                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getClientAmcClasses(
                                                            selectedClient.amcStatus
                                                        )}`}
                                                    >
                                                        {selectedClient.amcStatus}
                                                    </span>
                                                </div>

                                                <div className="px-5 py-4 lg:px-6">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                        Next Renewal
                                                    </p>

                                                    <p className="mt-2 text-sm font-semibold text-slate-800">
                                                        {selectedClient.nextRenewal}
                                                    </p>
                                                </div>

                                                <div className="px-5 py-4 lg:px-6">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                        Open Tickets
                                                    </p>

                                                    <p className="mt-2 text-sm font-semibold text-slate-800">
                                                        {selectedClient.openTickets}
                                                    </p>
                                                </div>

                                                <div className="px-5 py-4 lg:px-6">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                        Assigned Employee
                                                    </p>

                                                    <p className="mt-2 text-sm font-semibold text-slate-800">
                                                        {selectedClient.assignedEmployeeName || "Unassigned"}
                                                    </p>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Client Detail Tabs */}
                                        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                                            <div className="overflow-x-auto border-b border-slate-200 px-4">
                                                <div className="flex min-w-max gap-1">
                                                    {[
                                                        "overview",
                                                        "products",
                                                        "tickets",
                                                        "amc",
                                                        "payments",
                                                        "documents",
                                                        "activity",
                                                    ].map((tab) => (
                                                        <button
                                                            key={tab}
                                                            type="button"
                                                            onClick={() => setClientDetailsTab(tab)}
                                                            className={`border-b-2 px-4 py-4 text-xs font-semibold capitalize transition ${clientDetailsTab === tab
                                                                ? "border-violet-600 text-violet-700"
                                                                : "border-transparent text-slate-500 hover:text-slate-800"
                                                                }`}
                                                        >
                                                            {tab}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {clientDetailsTab === "overview" ? (
                                                <div className="grid gap-6 p-5 lg:grid-cols-2 lg:p-6">
                                                    {/* Company Information */}
                                                    <section className="rounded-2xl border border-slate-200 p-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                                                <BriefcaseBusiness size={18} />
                                                            </div>

                                                            <div>
                                                                <h3 className="text-sm font-semibold text-slate-900">
                                                                    Company Information
                                                                </h3>

                                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                                    Primary client account details
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <dl className="mt-5 divide-y divide-slate-100">
                                                            <div className="flex items-start justify-between gap-5 py-3 first:pt-0">
                                                                <dt className="text-xs text-slate-500">Company</dt>
                                                                <dd className="text-right text-xs font-semibold text-slate-800">
                                                                    {selectedClient.companyName}
                                                                </dd>
                                                            </div>

                                                            <div className="flex items-start justify-between gap-5 py-3">
                                                                <dt className="text-xs text-slate-500">Client Code</dt>
                                                                <dd className="text-right text-xs font-semibold text-slate-800">
                                                                    {selectedClient.code}
                                                                </dd>
                                                            </div>

                                                            <div className="flex items-start justify-between gap-5 py-3">
                                                                <dt className="text-xs text-slate-500">City</dt>
                                                                <dd className="text-right text-xs font-semibold text-slate-800">
                                                                    {selectedClient.city}
                                                                </dd>
                                                            </div>

                                                            <div className="flex items-start justify-between gap-5 py-3 last:pb-0">
                                                                <dt className="text-xs text-slate-500">
                                                                    Account Status
                                                                </dt>
                                                                <dd className="text-right text-xs font-semibold text-slate-800">
                                                                    {selectedClient.status}
                                                                </dd>
                                                            </div>
                                                        </dl>
                                                    </section>

                                                    {/* Contact Information */}
                                                    <section className="rounded-2xl border border-slate-200 p-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                                                <UserRound size={18} />
                                                            </div>

                                                            <div>
                                                                <h3 className="text-sm font-semibold text-slate-900">
                                                                    Primary Contact
                                                                </h3>

                                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                                    Contact and communication details
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <dl className="mt-5 divide-y divide-slate-100">
                                                            <div className="flex items-start justify-between gap-5 py-3 first:pt-0">
                                                                <dt className="text-xs text-slate-500">Name</dt>
                                                                <dd className="text-right text-xs font-semibold text-slate-800">
                                                                    {selectedClient.contactPerson}
                                                                </dd>
                                                            </div>

                                                            <div className="flex items-start justify-between gap-5 py-3">
                                                                <dt className="text-xs text-slate-500">Mobile</dt>
                                                                <dd className="text-right text-xs font-semibold text-slate-800">
                                                                    {selectedClient.mobile}
                                                                </dd>
                                                            </div>

                                                            <div className="flex items-start justify-between gap-5 py-3">
                                                                <dt className="text-xs text-slate-500">Email</dt>
                                                                <dd className="max-w-[220px] break-all text-right text-xs font-semibold text-slate-800">
                                                                    {selectedClient.email}
                                                                </dd>
                                                            </div>

                                                            <div className="flex items-start justify-between gap-5 py-3 last:pb-0">
                                                                <dt className="text-xs text-slate-500">
                                                                    Support Owner
                                                                </dt>
                                                                <dd className="text-right text-xs font-semibold text-slate-800">
                                                                    {selectedClient.assignedEmployeeName || selectedClient.assignedTo || "Unassigned"}
                                                                </dd>
                                                            </div>
                                                        </dl>
                                                    </section>

                                                    {/* Products */}
                                                    <section className="rounded-2xl border border-slate-200 p-5 lg:col-span-2">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                                                    <Globe2 size={18} />
                                                                </div>

                                                                <div>
                                                                    <h3 className="text-sm font-semibold text-slate-900">
                                                                        Software Products
                                                                    </h3>

                                                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                                                        Products currently assigned to this client
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                className="text-xs font-semibold text-violet-600 transition hover:text-violet-700"
                                                            >
                                                                Manage Products
                                                            </button>
                                                        </div>

                                                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                            {(Array.isArray(selectedClient.products)
                                                                ? selectedClient.products
                                                                : []
                                                            ).map((product, index) => {
                                                                const productName =
                                                                    typeof product === "string"
                                                                        ? product
                                                                        : product?.productName || "Unnamed Product";

                                                                const productKey =
                                                                    typeof product === "string"
                                                                        ? `${product}-${index}`
                                                                        : product?._id || `${productName}-${index}`;

                                                                return (
                                                                    <div
                                                                        key={productKey}
                                                                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                                                    >
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-slate-900">
                                                                                    {productName}
                                                                                </p>

                                                                                <p className="mt-1 text-[10px] text-slate-500">
                                                                                    Active installation
                                                                                </p>
                                                                            </div>

                                                                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                                                                                Active
                                                                            </span>
                                                                        </div>

                                                                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                                                                            <span className="text-[10px] text-slate-400">
                                                                                AMC
                                                                            </span>

                                                                            <span className="text-[10px] font-semibold text-slate-700">
                                                                                {selectedClient.amcStatus}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </section>
                                                </div>
                                            )
                                                : clientDetailsTab === "products" ? (
                                                    <div>
                                                        <div>
                                                            {/* Products Header */}
                                                            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                                                                <div>
                                                                    <h3 className="text-sm font-semibold text-slate-950">
                                                                        Client Products
                                                                    </h3>

                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        Software licences, installation and support information.
                                                                    </p>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => openProductDrawer()}
                                                                    className="flex h-9 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                                                >
                                                                    <Plus size={15} />
                                                                    Assign Product
                                                                </button>
                                                            </div>

                                                            {/* Product Summary */}
                                                            <div className="grid border-b border-slate-200 sm:grid-cols-3">
                                                                <div className="border-b border-slate-200 px-5 py-4 sm:border-b-0 sm:border-r lg:px-6">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                        Assigned Products
                                                                    </p>

                                                                    <p className="mt-2 text-xl font-semibold text-slate-900">
                                                                        {getSelectedClientProducts().length}
                                                                    </p>
                                                                </div>

                                                                <div className="border-b border-slate-200 px-5 py-4 sm:border-b-0 sm:border-r lg:px-6">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                        Total Licensed Users
                                                                    </p>

                                                                    <p className="mt-2 text-xl font-semibold text-slate-900">
                                                                        {getSelectedClientProducts().reduce(
                                                                            (total, product) => total + product.users,
                                                                            0
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                <div className="px-5 py-4 lg:px-6">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                        Active Installations
                                                                    </p>

                                                                    <p className="mt-2 text-xl font-semibold text-emerald-700">
                                                                        {
                                                                            getSelectedClientProducts().filter(
                                                                                (product) =>
                                                                                    product.installationStatus === "Installed"
                                                                            ).length
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Product Table */}
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-[1050px] w-full">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-200 bg-slate-50/80">
                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                                                Product
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Version
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Purchase
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Users
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Support
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                AMC
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Expiry
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Installation
                                                                            </th>

                                                                            <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                                                Actions
                                                                            </th>
                                                                        </tr>
                                                                    </thead>

                                                                    <tbody>
                                                                        {getSelectedClientProducts()
                                                                            .length === 0 ? (
                                                                            <tr>
                                                                                <td
                                                                                    colSpan={9}
                                                                                    className="px-6 py-10 text-center"
                                                                                >
                                                                                    <Box
                                                                                        size={28}
                                                                                        className="mx-auto text-slate-300"
                                                                                    />

                                                                                    <p className="mt-3 text-sm font-semibold text-slate-700">
                                                                                        No products assigned
                                                                                    </p>

                                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                                        Click Assign Product to add software and licence details.
                                                                                    </p>
                                                                                </td>
                                                                            </tr>
                                                                        ) : (
                                                                            getSelectedClientProducts().map(
                                                                                (product) => (
                                                                                    <tr
                                                                                        key={
                                                                                            product.id ||
                                                                                            product.productId
                                                                                        }
                                                                                        className="border-b border-slate-100 last:border-b-0"
                                                                                    >
                                                                                        <td className="px-5 py-4">
                                                                                            <p className="text-sm font-semibold text-slate-900">
                                                                                                {product.productName}
                                                                                            </p>

                                                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                                                {product.productCode ||
                                                                                                    "No product code"}
                                                                                            </p>
                                                                                        </td>

                                                                                        <td className="px-5 py-4 text-sm text-slate-600">
                                                                                            {product.version}
                                                                                        </td>

                                                                                        <td className="px-5 py-4 text-sm text-slate-600">
                                                                                            {formatClientDate(
                                                                                                product.purchaseDate
                                                                                            )}
                                                                                        </td>

                                                                                        <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                                                                                            {product.licensedUsers}
                                                                                        </td>

                                                                                        <td className="px-5 py-4 text-sm text-slate-600">
                                                                                            {product.supportType}
                                                                                        </td>

                                                                                        <td className="px-5 py-4">
                                                                                            <span
                                                                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getClientAmcClasses(
                                                                                                    product.amcStatus
                                                                                                )}`}
                                                                                            >
                                                                                                {product.amcStatus}
                                                                                            </span>
                                                                                        </td>

                                                                                        <td className="px-5 py-4 text-sm text-slate-600">
                                                                                            {formatClientDate(
                                                                                                product.expiryDate
                                                                                            )}
                                                                                        </td>

                                                                                        <td className="px-5 py-4">
                                                                                            <span
                                                                                                className={
                                                                                                    product.installationStatus ===
                                                                                                        "Installed"
                                                                                                        ? "text-xs font-semibold text-emerald-700"
                                                                                                        : "text-xs font-semibold text-amber-700"
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    product.installationStatus
                                                                                                }
                                                                                            </span>
                                                                                        </td>

                                                                                        <td className="px-5 py-4">
                                                                                            <div className="flex justify-end gap-2">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        openProductDrawer(
                                                                                                            product
                                                                                                        )
                                                                                                    }
                                                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                                                                >
                                                                                                    <Pencil size={14} />
                                                                                                </button>

                                                                                                <button
                                                                                                    type="button"
                                                                                                    disabled={
                                                                                                        deletingProductId ===
                                                                                                        product.id
                                                                                                    }
                                                                                                    onClick={() =>
                                                                                                        handleDeleteProduct(
                                                                                                            product
                                                                                                        )
                                                                                                    }
                                                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                                                                                >
                                                                                                    <Trash2 size={14} />
                                                                                                </button>
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                )
                                                                            )
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                                                                <p>
                                                                    Showing {getSelectedClientProducts().length} assigned products
                                                                </p>

                                                                <button
                                                                    type="button"
                                                                    className="flex items-center gap-1 font-semibold text-violet-600 transition hover:text-violet-700"
                                                                >
                                                                    View licence history
                                                                    <ArrowUpRight size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : clientDetailsTab === "tickets" ? (
                                                    <div>
                                                        <div>
                                                            {/* Tickets Header */}
                                                            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                                                                <div>
                                                                    <h3 className="text-sm font-semibold text-slate-950">
                                                                        Client Support Tickets
                                                                    </h3>

                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        Issues, assignments and resolution status for this client.
                                                                    </p>
                                                                </div>

                                                                <div className="flex flex-col gap-3 sm:flex-row">
                                                                    <div className="relative">
                                                                        <ClipboardList
                                                                            size={15}
                                                                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                                        />

                                                                        <select
                                                                            value={clientTicketFilter}
                                                                            onChange={(event) =>
                                                                                setClientTicketFilter(event.target.value)
                                                                            }
                                                                            className="h-9 min-w-[160px] appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-600 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                                        >
                                                                            <option value="All">All Tickets</option>
                                                                            <option value="New">New</option>
                                                                            <option value="In Progress">In Progress</option>
                                                                            <option value="Waiting">Waiting</option>
                                                                            <option value="Resolved">Resolved</option>
                                                                            <option value="Closed">Closed</option>
                                                                        </select>

                                                                        <ChevronDown
                                                                            size={14}
                                                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                                        />
                                                                    </div>

                                                                    <button
                                                                        type="button"
                                                                        className="flex h-9 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                                                    >
                                                                        <Plus size={15} />
                                                                        Raise Ticket
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Ticket Summary */}
                                                            <div className="grid border-b border-slate-200 sm:grid-cols-4">
                                                                <div className="border-b border-slate-200 px-5 py-4 sm:border-b-0 sm:border-r lg:px-6">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                        Total Tickets
                                                                    </p>

                                                                    <p className="mt-2 text-xl font-semibold text-slate-900">
                                                                        {getSelectedClientTickets().length}
                                                                    </p>
                                                                </div>

                                                                <div className="border-b border-slate-200 px-5 py-4 sm:border-b-0 sm:border-r lg:px-6">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                        Open
                                                                    </p>

                                                                    <p className="mt-2 text-xl font-semibold text-rose-700">
                                                                        {
                                                                            getSelectedClientTickets().filter(
                                                                                (ticket) =>
                                                                                    !["Resolved", "Closed"].includes(ticket.status)
                                                                            ).length
                                                                        }
                                                                    </p>
                                                                </div>

                                                                <div className="border-b border-slate-200 px-5 py-4 sm:border-b-0 sm:border-r lg:px-6">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                        Resolved
                                                                    </p>

                                                                    <p className="mt-2 text-xl font-semibold text-emerald-700">
                                                                        {
                                                                            getSelectedClientTickets().filter(
                                                                                (ticket) => ticket.status === "Resolved"
                                                                            ).length
                                                                        }
                                                                    </p>
                                                                </div>

                                                                <div className="px-5 py-4 lg:px-6">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                        Critical
                                                                    </p>

                                                                    <p className="mt-2 text-xl font-semibold text-orange-700">
                                                                        {
                                                                            getSelectedClientTickets().filter(
                                                                                (ticket) => ticket.priority === "Critical"
                                                                            ).length
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Tickets Table */}
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-[1100px] w-full">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-200 bg-slate-50/80">
                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                                                Ticket
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Product
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Priority
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Assigned To
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Source
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Created
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Resolved
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Status
                                                                            </th>

                                                                            <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                                                Action
                                                                            </th>
                                                                        </tr>
                                                                    </thead>

                                                                    <tbody>
                                                                        {getFilteredSelectedClientTickets().length > 0 ? (
                                                                            getFilteredSelectedClientTickets().map((ticket) => (
                                                                                <tr
                                                                                    key={ticket.id}
                                                                                    className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                                                                >
                                                                                    <td className="px-5 py-4 lg:px-6">
                                                                                        <div className="flex min-w-[260px] items-start gap-3">
                                                                                            <div
                                                                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ticket.priority === "Critical"
                                                                                                    ? "bg-rose-100 text-rose-700"
                                                                                                    : ticket.status === "Resolved" ||
                                                                                                        ticket.status === "Closed"
                                                                                                        ? "bg-emerald-100 text-emerald-700"
                                                                                                        : "bg-violet-100 text-violet-700"
                                                                                                    }`}
                                                                                            >
                                                                                                {ticket.status === "Resolved" ||
                                                                                                    ticket.status === "Closed" ? (
                                                                                                    <CheckCircle2 size={18} />
                                                                                                ) : ticket.priority === "Critical" ? (
                                                                                                    <AlertCircle size={18} />
                                                                                                ) : (
                                                                                                    <Headphones size={18} />
                                                                                                )}
                                                                                            </div>

                                                                                            <div>
                                                                                                <p className="text-sm font-semibold text-slate-900">
                                                                                                    {ticket.title}
                                                                                                </p>

                                                                                                <p className="mt-1 text-[10px] font-semibold text-violet-600">
                                                                                                    {ticket.id}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>

                                                                                    <td className="px-5 py-4">
                                                                                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                                                                                            {ticket.product}
                                                                                        </span>
                                                                                    </td>

                                                                                    <td className="px-5 py-4">
                                                                                        <span
                                                                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getPriorityClasses(
                                                                                                ticket.priority
                                                                                            )}`}
                                                                                        >
                                                                                            {ticket.priority}
                                                                                        </span>
                                                                                    </td>

                                                                                    <td className="px-5 py-4">
                                                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                                                            <UserCog
                                                                                                size={14}
                                                                                                className="text-slate-400"
                                                                                            />
                                                                                            {ticket.assignedTo}
                                                                                        </span>
                                                                                    </td>

                                                                                    <td className="px-5 py-4 text-xs text-slate-600">
                                                                                        {ticket.source}
                                                                                    </td>

                                                                                    <td className="px-5 py-4">
                                                                                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                                                                                            <Calendar
                                                                                                size={14}
                                                                                                className="text-slate-400"
                                                                                            />
                                                                                            {ticket.createdAt}
                                                                                        </span>
                                                                                    </td>

                                                                                    <td className="px-5 py-4 text-xs text-slate-600">
                                                                                        {ticket.resolvedAt}
                                                                                    </td>

                                                                                    <td className="px-5 py-4">
                                                                                        <span
                                                                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getTicketStatusClasses(
                                                                                                ticket.status
                                                                                            )}`}
                                                                                        >
                                                                                            {ticket.status}
                                                                                        </span>
                                                                                    </td>

                                                                                    <td className="px-5 py-4 lg:px-6">
                                                                                        <div className="flex justify-end">
                                                                                            <button
                                                                                                type="button"
                                                                                                className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                                                            >
                                                                                                Open
                                                                                                <ArrowUpRight size={14} />
                                                                                            </button>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan="9" className="px-6 py-16 text-center">
                                                                                    <Headphones
                                                                                        size={30}
                                                                                        className="mx-auto text-slate-300"
                                                                                    />

                                                                                    <p className="mt-3 text-sm font-semibold text-slate-700">
                                                                                        No tickets found
                                                                                    </p>

                                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                                        No client tickets match the selected status.
                                                                                    </p>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                                                                <p>
                                                                    Showing {getFilteredSelectedClientTickets().length} of{" "}
                                                                    {getSelectedClientTickets().length} tickets
                                                                </p>

                                                                <button
                                                                    type="button"
                                                                    className="flex items-center gap-1 font-semibold text-violet-600 transition hover:text-violet-700"
                                                                >
                                                                    Open complete ticket history
                                                                    <ArrowUpRight size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                ) : clientDetailsTab === "amc" ? (
                                                    <div>
                                                        {clientAmcLoading && (
                                                            <div className="px-5 py-3 text-xs text-slate-500 lg:px-6">Loading AMC records...</div>
                                                        )}
                                                        {clientAmcError && (
                                                            <div className="px-5 py-3 text-xs text-rose-600 lg:px-6">{clientAmcError}</div>
                                                        )}
                                                        <div>
                                                            {/* AMC Header */}
                                                            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                                                                <div>
                                                                    <h3 className="text-sm font-semibold text-slate-950">
                                                                        AMC Management
                                                                    </h3>

                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        Annual maintenance invoices, payment status and renewal history.
                                                                    </p>
                                                                </div>

                                                                <div className="flex flex-col gap-2 sm:flex-row">
                                                                    <button
                                                                        type="button"
                                                                        className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                                                    >
                                                                        <RefreshCw size={15} />
                                                                        Send Reminder
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="flex h-9 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                                                    >
                                                                        <Plus size={15} />
                                                                        Generate AMC Invoice
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* AMC Summary */}
                                                            <div className="grid border-b border-slate-200 sm:grid-cols-2 xl:grid-cols-4">
                                                                <div className="border-b border-slate-200 px-5 py-4 sm:border-r xl:border-b-0 lg:px-6">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                        Total AMC Value
                                                                    </p>

                                                                    <p className="mt-2 text-xl font-semibold text-slate-900">
                                                                        {formatCurrency(
                                                                            getSelectedClientAmcRecords().reduce(
                                                                                (total, record) => total + record.amount,
                                                                                0
                                                                            )
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                <div className="border-b border-slate-200 px-5 py-4 xl:border-b-0 xl:border-r lg:px-6">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                        Amount Collected
                                                                    </p>

                                                                    <p className="mt-2 text-xl font-semibold text-emerald-700">
                                                                        {formatCurrency(
                                                                            getSelectedClientAmcRecords().reduce(
                                                                                (total, record) => total + record.paidAmount,
                                                                                0
                                                                            )
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                <div className="border-b border-slate-200 px-5 py-4 sm:border-r xl:border-b-0 lg:px-6">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                        Balance Pending
                                                                    </p>

                                                                    <p className="mt-2 text-xl font-semibold text-amber-700">
                                                                        {formatCurrency(
                                                                            getSelectedClientAmcRecords().reduce(
                                                                                (total, record) =>
                                                                                    total + (record.amount - record.paidAmount),
                                                                                0
                                                                            )
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                <div className="px-5 py-4 lg:px-6">
                                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                        AMC Records
                                                                    </p>

                                                                    <p className="mt-2 text-xl font-semibold text-slate-900">
                                                                        {getSelectedClientAmcRecords().length}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* AMC Records */}
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-[1200px] w-full">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-200 bg-slate-50/80">
                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                                                Invoice
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Product
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                AMC Period
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Amount
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Paid
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Balance
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Due Date
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Status
                                                                            </th>

                                                                            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                                Reminder
                                                                            </th>

                                                                            <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                                                Actions
                                                                            </th>
                                                                        </tr>
                                                                    </thead>

                                                                    <tbody>
                                                                        {getSelectedClientAmcRecords().length > 0 ? (
                                                                            getSelectedClientAmcRecords().map((record) => {
                                                                                const balance = record.amount - record.paidAmount;

                                                                                return (
                                                                                    <tr
                                                                                        key={record.id}
                                                                                        className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                                                                    >
                                                                                        <td className="px-5 py-4 lg:px-6">
                                                                                            <div className="flex min-w-[160px] items-center gap-3">
                                                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                                                                                    <ReceiptIndianRupee size={18} />
                                                                                                </div>

                                                                                                <div>
                                                                                                    <p className="text-xs font-semibold text-slate-900">
                                                                                                        {record.invoiceNo}
                                                                                                    </p>

                                                                                                    <p className="mt-1 text-[10px] text-slate-400">
                                                                                                        {record.invoiceDate}
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                        </td>

                                                                                        <td className="px-5 py-4">
                                                                                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                                                                                                {record.product}
                                                                                            </span>
                                                                                        </td>

                                                                                        <td className="px-5 py-4">
                                                                                            <div className="min-w-[175px]">
                                                                                                <p className="text-xs font-medium text-slate-700">
                                                                                                    {record.period}
                                                                                                </p>
                                                                                            </div>
                                                                                        </td>

                                                                                        <td className="px-5 py-4 text-xs font-semibold text-slate-900">
                                                                                            {formatCurrency(record.amount)}
                                                                                        </td>

                                                                                        <td className="px-5 py-4 text-xs font-semibold text-emerald-700">
                                                                                            {formatCurrency(record.paidAmount)}
                                                                                        </td>

                                                                                        <td className="px-5 py-4">
                                                                                            <span
                                                                                                className={`text-xs font-semibold ${balance > 0
                                                                                                    ? "text-amber-700"
                                                                                                    : "text-slate-500"
                                                                                                    }`}
                                                                                            >
                                                                                                {formatCurrency(balance)}
                                                                                            </span>
                                                                                        </td>

                                                                                        <td className="px-5 py-4">
                                                                                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                                                                                                <CalendarClock
                                                                                                    size={14}
                                                                                                    className="text-slate-400"
                                                                                                />
                                                                                                {record.dueDate}
                                                                                            </span>
                                                                                        </td>

                                                                                        <td className="px-5 py-4">
                                                                                            <span
                                                                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getAmcPaymentStatusClasses(
                                                                                                    record.status
                                                                                                )}`}
                                                                                            >
                                                                                                {record.status}
                                                                                            </span>
                                                                                        </td>

                                                                                        <td className="px-5 py-4">
                                                                                            <span
                                                                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${record.reminderStatus === "Sent"
                                                                                                    ? "bg-blue-50 text-blue-700"
                                                                                                    : "bg-slate-100 text-slate-500"
                                                                                                    }`}
                                                                                            >
                                                                                                {record.reminderStatus}
                                                                                            </span>
                                                                                        </td>

                                                                                        <td className="px-5 py-4 lg:px-6">
                                                                                            <div className="flex justify-end gap-2">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                                                                    title="Download invoice PDF"
                                                                                                >
                                                                                                    <FileDown size={15} />
                                                                                                </button>

                                                                                                {balance > 0 && (
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => openRecordPayment(record)}
                                                                                                        className="flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[10px] font-semibold text-white transition hover:bg-violet-600"
                                                                                                    >
                                                                                                        <Banknote size={14} />
                                                                                                        Record Payment
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan="10" className="px-6 py-16 text-center">
                                                                                    <BadgeIndianRupee
                                                                                        size={30}
                                                                                        className="mx-auto text-slate-300"
                                                                                    />

                                                                                    <p className="mt-3 text-sm font-semibold text-slate-700">
                                                                                        No AMC records found
                                                                                    </p>

                                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                                        Generate the first AMC invoice for this client.
                                                                                    </p>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>

                                                            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                                                                <p>
                                                                    Showing {getSelectedClientAmcRecords().length} AMC records
                                                                </p>

                                                                <button
                                                                    type="button"
                                                                    className="flex items-center gap-1 font-semibold text-violet-600 transition hover:text-violet-700"
                                                                >
                                                                    Open complete AMC history
                                                                    <ArrowUpRight size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                ) : clientDetailsTab === "payments" ? (
                                                    <div>
                                                        {clientPaymentsLoading && (
                                                            <div className="px-5 py-3 text-xs text-slate-500 lg:px-6">Loading payments...</div>
                                                        )}
                                                        {clientPaymentsError && (
                                                            <div className="px-5 py-3 text-xs text-rose-600 lg:px-6">{clientPaymentsError}</div>
                                                        )}
                                                        {/* Payments Header */}
                                                        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                                                            <div>
                                                                <h3 className="text-sm font-semibold text-slate-950">
                                                                    Payment History
                                                                </h3>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    AMC collections, receipts and payment references for this client.
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                className="flex h-9 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
                                                            >
                                                                <Plus size={15} />
                                                                Record Payment
                                                            </button>
                                                        </div>

                                                        {/* Payment Summary */}
                                                        <div className="grid border-b border-slate-200 sm:grid-cols-2 xl:grid-cols-4">
                                                            <div className="border-b border-slate-200 px-5 py-4 sm:border-r xl:border-b-0 lg:px-6">
                                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                    Total Received
                                                                </p>

                                                                <p className="mt-2 text-xl font-semibold text-emerald-700">
                                                                    {formatCurrency(
                                                                        getSelectedClientPayments().reduce(
                                                                            (total, payment) => total + payment.amount,
                                                                            0
                                                                        )
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <div className="border-b border-slate-200 px-5 py-4 xl:border-b-0 xl:border-r lg:px-6">
                                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                    Pending Amount
                                                                </p>

                                                                <p className="mt-2 text-xl font-semibold text-amber-700">
                                                                    {formatCurrency(getSelectedClientPendingAmount())}
                                                                </p>
                                                            </div>

                                                            <div className="border-b border-slate-200 px-5 py-4 sm:border-r xl:border-b-0 lg:px-6">
                                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                    Last Payment
                                                                </p>

                                                                <p className="mt-2 text-sm font-semibold text-slate-900">
                                                                    {getLatestClientPayment()
                                                                        ? getLatestClientPayment().paymentDate
                                                                        : "No payments"}
                                                                </p>

                                                                {getLatestClientPayment() && (
                                                                    <p className="mt-1 text-[10px] text-slate-400">
                                                                        {formatCurrency(getLatestClientPayment().amount)}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="px-5 py-4 lg:px-6">
                                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                    Payment Records
                                                                </p>

                                                                <p className="mt-2 text-xl font-semibold text-slate-900">
                                                                    {getSelectedClientPayments().length}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Payments Table */}
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-[1100px] w-full">
                                                                <thead>
                                                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                                            Receipt
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Invoice
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Product
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Date
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Amount
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Mode
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Reference
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Received By
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Status
                                                                        </th>

                                                                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                                            Receipt
                                                                        </th>
                                                                    </tr>
                                                                </thead>

                                                                <tbody>
                                                                    {getSelectedClientPayments().length > 0 ? (
                                                                        getSelectedClientPayments().map((payment) => (
                                                                            <tr
                                                                                key={payment.id}
                                                                                className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                                                            >
                                                                                <td className="px-5 py-4 lg:px-6">
                                                                                    <div className="flex min-w-[150px] items-center gap-3">
                                                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                                                                            <Receipt size={18} />
                                                                                        </div>

                                                                                        <div>
                                                                                            <p className="text-xs font-semibold text-slate-900">
                                                                                                {payment.receiptNo}
                                                                                            </p>

                                                                                            <p className="mt-1 text-[10px] text-slate-400">
                                                                                                Payment receipt
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>

                                                                                <td className="px-5 py-4 text-xs font-semibold text-violet-600">
                                                                                    {payment.invoiceNo}
                                                                                </td>

                                                                                <td className="px-5 py-4">
                                                                                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                                                                                        {payment.product}
                                                                                    </span>
                                                                                </td>

                                                                                <td className="px-5 py-4">
                                                                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                                                                                        <Calendar
                                                                                            size={14}
                                                                                            className="text-slate-400"
                                                                                        />
                                                                                        {payment.paymentDate}
                                                                                    </span>
                                                                                </td>

                                                                                <td className="px-5 py-4 text-xs font-semibold text-emerald-700">
                                                                                    {formatCurrency(payment.amount)}
                                                                                </td>

                                                                                <td className="px-5 py-4">
                                                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                                                        {payment.mode === "Bank Transfer" ? (
                                                                                            <Landmark
                                                                                                size={14}
                                                                                                className="text-blue-500"
                                                                                            />
                                                                                        ) : payment.mode === "UPI" ? (
                                                                                            <CreditCardIcon
                                                                                                size={14}
                                                                                                className="text-violet-500"
                                                                                            />
                                                                                        ) : (
                                                                                            <Banknote
                                                                                                size={14}
                                                                                                className="text-emerald-500"
                                                                                            />
                                                                                        )}

                                                                                        {payment.mode}
                                                                                    </span>
                                                                                </td>

                                                                                <td className="px-5 py-4 text-xs font-medium text-slate-600">
                                                                                    {payment.referenceNo}
                                                                                </td>

                                                                                <td className="px-5 py-4 text-xs font-medium text-slate-600">
                                                                                    {payment.receivedBy}
                                                                                </td>

                                                                                <td className="px-5 py-4">
                                                                                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                                                                                        {payment.status}
                                                                                    </span>
                                                                                </td>

                                                                                <td className="px-5 py-4 lg:px-6">
                                                                                    <div className="flex justify-end">
                                                                                        <button
                                                                                            type="button"
                                                                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                                                            title="Download receipt"
                                                                                        >
                                                                                            <FileDown size={15} />
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan="10" className="px-6 py-16 text-center">
                                                                                <WalletCards
                                                                                    size={30}
                                                                                    className="mx-auto text-slate-300"
                                                                                />

                                                                                <p className="mt-3 text-sm font-semibold text-slate-700">
                                                                                    No payments found
                                                                                </p>

                                                                                <p className="mt-1 text-xs text-slate-500">
                                                                                    No payment has been recorded for this client.
                                                                                </p>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                                                            <p>
                                                                Showing {getSelectedClientPayments().length} payment records
                                                            </p>

                                                            <button
                                                                type="button"
                                                                className="flex items-center gap-1 font-semibold text-violet-600 transition hover:text-violet-700"
                                                            >
                                                                View complete payment history
                                                                <ArrowUpRight size={14} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                ) : clientDetailsTab === "documents" ? (

                                                    <div>
                                                        {clientDocumentsLoading && (
                                                            <div className="px-5 py-3 text-xs text-slate-500 lg:px-6">Loading documents...</div>
                                                        )}
                                                        {clientDocumentsError && (
                                                            <div className="px-5 py-3 text-xs text-rose-600 lg:px-6">{clientDocumentsError}</div>
                                                        )}
                                                        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">

                                                            <div>
                                                                <h3 className="text-sm font-semibold text-slate-950">
                                                                    Client Documents
                                                                </h3>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Agreements, GST, quotations, invoices and installation files.
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => setDocumentDrawerOpen(true)}
                                                                className="flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white"
                                                            >
                                                                <Upload size={15} />
                                                                Upload Document
                                                            </button>

                                                        </div>

                                                        {documentDrawerOpen && (
                                                            <form
                                                                onSubmit={addClientDocument}
                                                                className="grid gap-3 border-b border-slate-200 bg-slate-50/60 px-5 py-4 sm:grid-cols-2 lg:px-6"
                                                            >
                                                                <input
                                                                    required
                                                                    placeholder="Document name (e.g. AMC Agreement.pdf)"
                                                                    value={documentForm.name}
                                                                    onChange={(e) =>
                                                                        setDocumentForm({ ...documentForm, name: e.target.value })
                                                                    }
                                                                    className="h-10 rounded-lg border border-slate-200 px-3 text-xs"
                                                                />

                                                                <select
                                                                    value={documentForm.type}
                                                                    onChange={(e) =>
                                                                        setDocumentForm({ ...documentForm, type: e.target.value })
                                                                    }
                                                                    className="h-10 rounded-lg border border-slate-200 px-3 text-xs"
                                                                >
                                                                    <option value="PDF">PDF</option>
                                                                    <option value="Excel">Excel</option>
                                                                    <option value="Word">Word</option>
                                                                    <option value="Image">Image</option>
                                                                    <option value="ZIP">ZIP</option>
                                                                    <option value="Other">Other</option>
                                                                </select>

                                                                <select
                                                                    value={documentForm.category}
                                                                    onChange={(e) =>
                                                                        setDocumentForm({ ...documentForm, category: e.target.value })
                                                                    }
                                                                    className="h-10 rounded-lg border border-slate-200 px-3 text-xs"
                                                                >
                                                                    <option value="Agreement">Agreement</option>
                                                                    <option value="Legal">Legal</option>
                                                                    <option value="Quotation">Quotation</option>
                                                                    <option value="Invoice">Invoice</option>
                                                                    <option value="Installation">Installation</option>
                                                                    <option value="Other">Other</option>
                                                                </select>

                                                                <input
                                                                    placeholder="Size (e.g. 1.4 MB)"
                                                                    value={documentForm.size}
                                                                    onChange={(e) =>
                                                                        setDocumentForm({ ...documentForm, size: e.target.value })
                                                                    }
                                                                    className="h-10 rounded-lg border border-slate-200 px-3 text-xs"
                                                                />

                                                                <div className="flex gap-2 sm:col-span-2">
                                                                    <button
                                                                        type="submit"
                                                                        disabled={savingClientDocument}
                                                                        className="flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white disabled:opacity-60"
                                                                    >
                                                                        {savingClientDocument ? "Saving..." : "Save Document"}
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDocumentDrawerOpen(false)}
                                                                        className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        )}

                                                        {/* Documents Table */}
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-[950px] w-full">
                                                                <thead>
                                                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                                            File
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Category
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Type
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Uploaded
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Uploaded By
                                                                        </th>

                                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                                            Size
                                                                        </th>

                                                                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                                            Actions
                                                                        </th>
                                                                    </tr>
                                                                </thead>

                                                                <tbody>
                                                                    {getSelectedClientDocuments().length > 0 ? (
                                                                        getSelectedClientDocuments().map((document) => (
                                                                            <tr
                                                                                key={document.id}
                                                                                className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                                                            >
                                                                                <td className="px-5 py-4 lg:px-6">
                                                                                    <div className="flex min-w-[220px] items-center gap-3">
                                                                                        <div
                                                                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${document.type === "PDF"
                                                                                                ? "bg-rose-100 text-rose-700"
                                                                                                : document.type === "Excel"
                                                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                                                    : document.type === "ZIP"
                                                                                                        ? "bg-amber-100 text-amber-700"
                                                                                                        : "bg-blue-100 text-blue-700"
                                                                                                }`}
                                                                                        >
                                                                                            {document.type === "PDF" ? (
                                                                                                <FileText size={18} />
                                                                                            ) : document.type === "Excel" ? (
                                                                                                <FileSpreadsheet size={18} />
                                                                                            ) : document.type === "ZIP" ? (
                                                                                                <FileArchive size={18} />
                                                                                            ) : (
                                                                                                <Image size={18} />
                                                                                            )}
                                                                                        </div>

                                                                                        <div>
                                                                                            <p className="text-sm font-semibold text-slate-900">
                                                                                                {document.name}
                                                                                            </p>

                                                                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                                                                Client document
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>

                                                                                <td className="px-5 py-4">
                                                                                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                                                                                        {document.category}
                                                                                    </span>
                                                                                </td>

                                                                                <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                                                                                    {document.type}
                                                                                </td>

                                                                                <td className="px-5 py-4 text-xs text-slate-600">
                                                                                    {document.uploadedOn}
                                                                                </td>

                                                                                <td className="px-5 py-4 text-xs font-medium text-slate-700">
                                                                                    {document.uploadedBy}
                                                                                </td>

                                                                                <td className="px-5 py-4 text-xs text-slate-600">
                                                                                    {document.size}
                                                                                </td>

                                                                                <td className="px-5 py-4 lg:px-6">
                                                                                    <div className="flex justify-end gap-2">
                                                                                        <button
                                                                                            type="button"
                                                                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                                                            title="Preview document"
                                                                                        >
                                                                                            <Eye size={15} />
                                                                                        </button>

                                                                                        <button
                                                                                            type="button"
                                                                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                                                            title="Download document"
                                                                                        >
                                                                                            <Download size={15} />
                                                                                        </button>

                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => deleteClientDocument(document.id)}
                                                                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                                                            title="Delete document"
                                                                                        >
                                                                                            <Trash2 size={15} />
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan="7" className="px-6 py-16 text-center">
                                                                                <Archive
                                                                                    size={30}
                                                                                    className="mx-auto text-slate-300"
                                                                                />

                                                                                <p className="mt-3 text-sm font-semibold text-slate-700">
                                                                                    No documents found
                                                                                </p>

                                                                                <p className="mt-1 text-xs text-slate-500">
                                                                                    Upload the first document for this client.
                                                                                </p>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                                                            <p>
                                                                Showing {getSelectedClientDocuments().length} client documents
                                                            </p>

                                                            <button
                                                                type="button"
                                                                className="flex items-center gap-1 font-semibold text-violet-600 transition hover:text-violet-700"
                                                            >
                                                                Open document archive
                                                                <ArrowUpRight size={14} />
                                                            </button>
                                                        </div>

                                                        <div className="grid border-b border-slate-200 sm:grid-cols-4">

                                                            <div className="px-6 py-5">
                                                                <p className="text-[10px] uppercase font-semibold tracking-[0.12em] text-slate-400">
                                                                    Documents
                                                                </p>

                                                                <p className="mt-2 text-2xl font-semibold">
                                                                    {getSelectedClientDocuments().length}
                                                                </p>
                                                            </div>

                                                            <div className="px-6 py-5 border-l">
                                                                <p className="text-[10px] uppercase font-semibold tracking-[0.12em] text-slate-400">
                                                                    PDF
                                                                </p>

                                                                <p className="mt-2 text-2xl font-semibold">
                                                                    {
                                                                        getSelectedClientDocuments().filter(d => d.type === "PDF").length
                                                                    }
                                                                </p>
                                                            </div>

                                                            <div className="px-6 py-5 border-l">
                                                                <p className="text-[10px] uppercase font-semibold tracking-[0.12em] text-slate-400">
                                                                    Excel
                                                                </p>

                                                                <p className="mt-2 text-2xl font-semibold">
                                                                    {
                                                                        getSelectedClientDocuments().filter(d => d.type === "Excel").length
                                                                    }
                                                                </p>
                                                            </div>

                                                            <div className="px-6 py-5 border-l">
                                                                <p className="text-[10px] uppercase font-semibold tracking-[0.12em] text-slate-400">
                                                                    Storage
                                                                </p>

                                                                <p className="mt-2 text-2xl font-semibold">
                                                                    20 MB
                                                                </p>
                                                            </div>

                                                        </div>

                                                    </div>


                                                ) : clientDetailsTab === "activity" ? (

                                                    <div>
                                                        {clientActivityLoading && (
                                                            <div className="px-6 py-3 text-xs text-slate-500">Loading activity...</div>
                                                        )}
                                                        {clientActivityError && (
                                                            <div className="px-6 py-3 text-xs text-rose-600">{clientActivityError}</div>
                                                        )}
                                                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                                                            <div>

                                                                <h3 className="text-sm font-semibold">
                                                                    Activity Timeline
                                                                </h3>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Complete audit history of this client.
                                                                </p>

                                                            </div>

                                                            <button className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white">

                                                                <Activity size={15} />

                                                                Export Timeline

                                                            </button>

                                                        </div>

                                                        <div className="relative px-10 py-8">

                                                            <div className="absolute left-[37px] top-0 bottom-0 w-[2px] bg-slate-200" />

                                                            {
                                                                getSelectedClientActivity().map(item => (
                                                                    <div
                                                                        key={item.id}
                                                                        className="relative mb-10 flex gap-5"
                                                                    >

                                                                        <div
                                                                            className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg"
                                                                        >

                                                                            {
                                                                                item.type === "Client Created"
                                                                                    ? <UserPlus size={18} />

                                                                                    : item.type === "Software Installed"
                                                                                        ? <Laptop size={18} />

                                                                                        : item.type === "AMC Generated"
                                                                                            ? <ReceiptIndianRupee size={18} />

                                                                                            : item.type === "Payment Received"
                                                                                                ? <Banknote size={18} />

                                                                                                : item.type === "Ticket Raised"
                                                                                                    ? <Headphones size={18} />

                                                                                                    : item.type === "Ticket Assigned"
                                                                                                        ? <UserCheck size={18} />

                                                                                                        : item.type === "Ticket Closed"
                                                                                                            ? <CheckCheck size={18} />

                                                                                                            : item.type === "Document Uploaded"
                                                                                                                ? <Upload size={18} />

                                                                                                                : <BellRing size={18} />
                                                                            }

                                                                        </div>

                                                                        <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                                                                            <div className="flex items-center justify-between">

                                                                                <h4 className="font-semibold text-slate-900">

                                                                                    {item.type}

                                                                                </h4>

                                                                                <span className="text-xs text-slate-400">

                                                                                    {item.date}

                                                                                </span>

                                                                            </div>

                                                                            <p className="mt-2 text-sm text-slate-600">

                                                                                {item.description}

                                                                            </p>

                                                                            <p className="mt-4 text-xs text-slate-400">

                                                                                Performed by

                                                                                <span className="ml-1 font-semibold text-slate-700">

                                                                                    {item.user}

                                                                                </span>

                                                                            </p>

                                                                        </div>

                                                                    </div>
                                                                ))
                                                            }

                                                        </div>
                                                    </div>


                                                ) : null}
                                        </section>
                                    </div>
                                </div>
                            ) : (

                                <div className="enterprise-page">
                                    {/* Clients Page Header */}
                                    <section className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-violet-600">
                                                <span className="h-2 w-2 rounded-full bg-violet-600" />
                                                Client Management
                                            </div>

                                            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                                                Clients
                                            </h1>

                                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                                Manage software clients, assigned products, AMC renewals,
                                                support workload and account status.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={openClientDrawer}
                                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 active:translate-y-0"
                                        >
                                            <Plus size={18} />
                                            Add Client
                                        </button>
                                    </section>

                                    {/* Client Summary */}
                                    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                Total Clients
                                            </p>

                                            <p className="mt-3 text-2xl font-semibold text-slate-950">
                                                {clients.length}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                Active Clients
                                            </p>

                                            <p className="mt-3 text-2xl font-semibold text-emerald-700">
                                                {clients.filter((client) => client.status === "Active").length}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                AMC Pending
                                            </p>

                                            <p className="mt-3 text-2xl font-semibold text-amber-700">
                                                {
                                                    clients.filter(
                                                        (client) => client.amcStatus === "Pending"
                                                    ).length
                                                }
                                            </p>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                AMC Overdue
                                            </p>

                                            <p className="mt-3 text-2xl font-semibold text-rose-700">
                                                {
                                                    clients.filter(
                                                        (client) => client.amcStatus === "Overdue"
                                                    ).length
                                                }
                                            </p>
                                        </div>
                                    </section>

                                    {/* Filters and Table */}
                                    <section className="enterprise-surface mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                                        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                                            <div className="relative w-full lg:max-w-[420px]">
                                                <Search
                                                    size={17}
                                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                                />

                                                <input
                                                    type="search"
                                                    value={clientSearch}
                                                    onChange={(event) =>
                                                        setClientSearch(event.target.value)
                                                    }
                                                    placeholder="Search client, contact, product, city..."
                                                    className="enterprise-input h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-3 sm:flex-row">
                                                <div className="relative">
                                                    <UserCheck
                                                        size={15}
                                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                    />

                                                    <select
                                                        value={clientStatusFilter}
                                                        onChange={(event) =>
                                                            setClientStatusFilter(event.target.value)
                                                        }
                                                        className="enterprise-input h-10 min-w-[145px] appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-semibold text-slate-600 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="All">All Status</option>
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>

                                                    <ChevronDown
                                                        size={14}
                                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <Filter
                                                        size={15}
                                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                    />

                                                    <select
                                                        value={clientAmcFilter}
                                                        onChange={(event) =>
                                                            setClientAmcFilter(event.target.value)
                                                        }
                                                        className="enterprise-input h-10 min-w-[155px] appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-semibold text-slate-600 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                    >
                                                        <option value="All">All AMC Status</option>
                                                        <option value="Paid">Paid</option>
                                                        <option value="Pending">Pending</option>
                                                        <option value="Overdue">Overdue</option>
                                                        <option value="Not Started">Not Started</option>
                                                    </select>

                                                    <ChevronDown
                                                        size={14}
                                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setClientSearch("");
                                                        setClientStatusFilter("All");
                                                        setClientAmcFilter("All");
                                                    }}
                                                    className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                                >
                                                    <SlidersHorizontal size={15} />
                                                    Reset
                                                </button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="enterprise-table min-w-[1200px] w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                            Client
                                                        </th>

                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Contact
                                                        </th>

                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Products
                                                        </th>

                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            AMC
                                                        </th>

                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Renewal
                                                        </th>

                                                        <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Tickets
                                                        </th>

                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Assigned To
                                                        </th>

                                                        <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                                            Status
                                                        </th>

                                                        <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:px-6">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {clientsLoading ? (
                                                        <tr>
                                                            <td colSpan="9" className="px-6 py-16 text-center">
                                                                <div
                                                                    aria-busy="true"
                                                                    aria-label="Loading clients"
                                                                    className="mx-auto grid max-w-4xl grid-cols-[1.25fr_1fr_0.9fr_0.7fr_0.8fr_0.45fr_0.9fr_0.7fr] gap-5 animate-pulse"
                                                                >
                                                                    {Array.from({ length: 8 }).map((_, index) => (
                                                                        <div
                                                                            key={index}
                                                                            className={`h-5 rounded bg-slate-100 ${index === 0 ? "w-full" : "w-4/5"}`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="sr-only">Loading clients...</span>
                                                            </td>
                                                        </tr>
                                                    ) : clientsError ? (
                                                        <tr>
                                                            <td colSpan="9" className="px-6 py-16 text-center">
                                                                <AlertCircle
                                                                    size={30}
                                                                    className="mx-auto text-rose-500"
                                                                />
                                                                <p className="mt-3 text-sm font-semibold text-rose-700">
                                                                    {clientsError}
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={loadClients}
                                                                    className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                                                                >
                                                                    Retry
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ) : filteredClients.length > 0 ? (
                                                        filteredClients.map((client) => (
                                                            <tr
                                                                key={client.id}
                                                                className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                                            >
                                                                <td className="px-5 py-4 lg:px-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                                                                            {client.companyName
                                                                                .split(" ")
                                                                                .slice(0, 2)
                                                                                .map((word) => word[0])
                                                                                .join("")}
                                                                        </div>

                                                                        <div className="min-w-[190px]">
                                                                            <p className="text-sm font-semibold text-slate-900">
                                                                                {client.companyName}
                                                                            </p>

                                                                            <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                                                                                <span>{client.code}</span>

                                                                                <span className="inline-flex items-center gap-1">
                                                                                    <MapPin size={11} />
                                                                                    {client.city}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                <td className="px-5 py-4">
                                                                    <p className="text-xs font-semibold text-slate-700">
                                                                        {client.contactPerson}
                                                                    </p>

                                                                    <div className="mt-1 space-y-1 text-[10px] text-slate-400">
                                                                        <p className="flex items-center gap-1.5">
                                                                            <Phone size={11} />
                                                                            {client.mobile}
                                                                        </p>

                                                                        <p className="flex items-center gap-1.5">
                                                                            <Mail size={11} />
                                                                            {client.email}
                                                                        </p>
                                                                    </div>
                                                                </td>

                                                                <td className="px-5 py-4">
                                                                    <div className="flex max-w-[200px] flex-wrap gap-1.5">
                                                                        {(Array.isArray(client.products) ? client.products : []).map(
                                                                            (product, index) => {
                                                                                const productName =
                                                                                    typeof product === "string"
                                                                                        ? product
                                                                                        : product?.productName || "Unnamed Product";

                                                                                const productKey =
                                                                                    typeof product === "string"
                                                                                        ? `${product}-${index}`
                                                                                        : product?._id || `${productName}-${index}`;

                                                                                return (
                                                                                    <span
                                                                                        key={productKey}
                                                                                        className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600"
                                                                                    >
                                                                                        {productName}
                                                                                    </span>
                                                                                );
                                                                            }
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                <td className="px-5 py-4">
                                                                    <span
                                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getClientAmcClasses(
                                                                            client.amcStatus
                                                                        )}`}
                                                                    >
                                                                        {client.amcStatus}
                                                                    </span>
                                                                </td>

                                                                <td className="px-5 py-4 text-xs font-medium text-slate-600">
                                                                    {client.nextRenewal}
                                                                </td>

                                                                <td className="px-5 py-4 text-center">
                                                                    <span
                                                                        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[10px] font-bold ${client.openTickets > 0
                                                                            ? "bg-rose-50 text-rose-700"
                                                                            : "bg-slate-100 text-slate-500"
                                                                            }`}
                                                                    >
                                                                        {client.openTickets}
                                                                    </span>
                                                                </td>

                                                                <td className="px-5 py-4">
                                                                    <p className="text-xs font-semibold text-slate-700">
                                                                        {client.assignedEmployeeName || "Unassigned"}
                                                                    </p>
                                                                </td>

                                                                <td className="px-5 py-4">
                                                                    <span
                                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${client.status === "Active"
                                                                            ? "bg-emerald-50 text-emerald-700"
                                                                            : "bg-slate-100 text-slate-500"
                                                                            }`}
                                                                    >
                                                                        {client.status}
                                                                    </span>
                                                                </td>

                                                                <td className="px-5 py-4 lg:px-6">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openClientDetails(client)}
                                                                            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                                        >
                                                                            View
                                                                            <ArrowUpRight size={14} />
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                                                            aria-label={`More actions for ${client.companyName}`}
                                                                        >
                                                                            <MoreHorizontal size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="9" className="px-6 py-16 text-center">
                                                                <Building2
                                                                    size={30}
                                                                    className="mx-auto text-slate-300"
                                                                />

                                                                <p className="mt-3 text-sm font-semibold text-slate-700">
                                                                    No clients found
                                                                </p>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Change your search or filters and try again.
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-6">
                                            <p>
                                                Showing {filteredClients.length} of {clients.length} clients
                                            </p>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    disabled
                                                    className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-400 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>

                                                <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-violet-600 px-2 text-[11px] font-bold text-white">
                                                    1
                                                </span>

                                                <button
                                                    type="button"
                                                    disabled
                                                    className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-400 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )

                        ) : activeMenu === "tickets" ? (
                            <div className="enterprise-page"><SupportTickets /></div>
                        ) : activeMenu === "billing" ? (
                            <div className="enterprise-page"><AmcBilling /></div>
                        ) : activeMenu === "team" ? (
                            <div className="enterprise-page"><Team /></div>
                        ) : activeMenu === "tasks" ? (
                            <div className="enterprise-page"><Tasks /></div>
                        ) : activeMenu === "attendance" ? (
                            <div className="enterprise-page"><Attendance /></div>
                        ) : activeMenu === "settings" ? (
                            <div className="enterprise-page"><SystemSettings /></div>
                        ) : (
                            <div className="flex min-h-[calc(100vh-140px)] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {selectedMenu.label}
                                    </h3>

                                    <p className="mt-2 text-sm text-slate-500">
                                        This module will be created after completing the Dashboard
                                        Overview.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div >
            {/* Add Client Drawer */}
            {clientDrawerOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close add client form"
                        onClick={closeClientDrawer}
                        className="enterprise-backdrop fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="enterprise-drawer fixed inset-y-0 right-0 z-[80] flex w-full max-w-[620px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)]">
                        {/* Drawer Header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-600">
                                    <span className="h-2 w-2 rounded-full bg-violet-600" />
                                    Client Management
                                </div>

                                <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">
                                    {editingClientId ? "Edit Client" : "Add New Client"}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {editingClientId
                                        ? "Update the client, product and AMC details."
                                        : "Enter the client, product and AMC details."}
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Close client form"
                                onClick={closeClientDrawer}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSaveClient}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Client Code
                                        </label>

                                        <input
                                            name="code"
                                            value={clientForm.code}
                                            onChange={handleClientInputChange}
                                            required
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Account Status
                                        </label>

                                        <select
                                            name="status"
                                            value={clientForm.status}
                                            onChange={handleClientInputChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Company Name
                                        </label>

                                        <div className="relative">
                                            <Building2
                                                size={17}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                name="companyName"
                                                value={clientForm.companyName}
                                                onChange={handleClientInputChange}
                                                placeholder="Enter company name"
                                                required
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Contact Person
                                        </label>

                                        <div className="relative">
                                            <UserRound
                                                size={17}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                name="contactPerson"
                                                value={clientForm.contactPerson}
                                                onChange={handleClientInputChange}
                                                placeholder="Full name"
                                                required
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Mobile Number
                                        </label>

                                        <div className="relative">
                                            <Phone
                                                size={17}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                name="mobile"
                                                value={clientForm.mobile}
                                                onChange={(event) => {
                                                    const mobileValue = event.target.value
                                                        .replace(/\D/g, "")
                                                        .slice(0, 10);

                                                    setClientForm((current) => ({
                                                        ...current,
                                                        mobile: mobileValue,
                                                    }));
                                                }}
                                                placeholder="10-digit mobile number"
                                                inputMode="numeric"
                                                pattern="[0-9]{10}"
                                                maxLength={10}
                                                required
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Email Address
                                        </label>

                                        <div className="relative">
                                            <Mail
                                                size={17}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                type="email"
                                                name="email"
                                                value={clientForm.email}
                                                onChange={handleClientInputChange}
                                                placeholder="name@company.com"
                                                required
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>

                                    </div>
                                    {/* ================= CLIENT LOGIN ACCOUNT ================= */}
                                    {!editingClientId && (
                                        <div className="sm:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                            {/* Header */}
                                            <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-4 py-3.5">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div
                                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${clientForm.createLogin
                                                                ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                                                                : "bg-slate-100 text-slate-500"
                                                            }`}
                                                    >
                                                        <ShieldCheck size={19} />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-sm font-semibold text-slate-900">
                                                                Client Portal Login
                                                            </h3>

                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${clientForm.createLogin
                                                                        ? "bg-emerald-100 text-emerald-700"
                                                                        : "bg-slate-100 text-slate-500"
                                                                    }`}
                                                            >
                                                                {clientForm.createLogin
                                                                    ? "ENABLED"
                                                                    : "DISABLED"}
                                                            </span>
                                                        </div>

                                                        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                                                            Create portal access using the client's email address.
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Premium Toggle */}
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={clientForm.createLogin}
                                                    onClick={() =>
                                                        setClientForm((current) => ({
                                                            ...current,
                                                            createLogin: !current.createLogin,
                                                            temporaryPassword:
                                                                current.createLogin
                                                                    ? ""
                                                                    : current.temporaryPassword,
                                                        }))
                                                    }
                                                    className={`relative h-7 w-12 shrink-0 rounded-full transition-all duration-200 ${clientForm.createLogin
                                                            ? "bg-violet-600 shadow-inner"
                                                            : "bg-slate-300"
                                                        }`}
                                                >
                                                    <span
                                                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200 ${clientForm.createLogin
                                                                ? "left-6"
                                                                : "left-1"
                                                            }`}
                                                    />
                                                </button>
                                            </div>

                                            {/* Login Details */}
                                            {clientForm.createLogin && (
                                                <div className="space-y-4 p-4">
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        {/* Login Email */}
                                                        <div>
                                                            <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                                <Mail size={14} className="text-violet-600" />
                                                                Login Email
                                                            </label>

                                                            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
                                                                <Mail
                                                                    size={16}
                                                                    className="mr-2 shrink-0 text-slate-400"
                                                                />

                                                                <span className="min-w-0 truncate text-xs font-medium text-slate-700">
                                                                    {clientForm.email.trim() ||
                                                                        "Enter client email above"}
                                                                </span>
                                                            </div>

                                                            {!clientForm.email.trim() && (
                                                                <p className="mt-1.5 text-[10px] font-medium text-amber-600">
                                                                    Email is required to create login access.
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Temporary Password */}
                                                        <div>
                                                            <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                                <Shield size={14} className="text-violet-600" />
                                                                Temporary Password
                                                            </label>

                                                            <div className="flex h-11 overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
                                                                <input
                                                                    type="text"
                                                                    name="temporaryPassword"
                                                                    value={clientForm.temporaryPassword}
                                                                    onChange={handleClientInputChange}
                                                                    placeholder="Auto-generated if blank"
                                                                    autoComplete="new-password"
                                                                    className="min-w-0 flex-1 bg-transparent px-3 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400"
                                                                />

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const upper =
                                                                            "ABCDEFGHJKLMNPQRSTUVWXYZ";
                                                                        const lower =
                                                                            "abcdefghijkmnopqrstuvwxyz";
                                                                        const numbers =
                                                                            "23456789";
                                                                        const symbols =
                                                                            "@#$!";
                                                                        const all =
                                                                            upper +
                                                                            lower +
                                                                            numbers +
                                                                            symbols;

                                                                        const randomFrom = (characters) =>
                                                                            characters[
                                                                            crypto.getRandomValues(
                                                                                new Uint32Array(1)
                                                                            )[0] % characters.length
                                                                            ];

                                                                        const generatedPassword = [
                                                                            randomFrom(upper),
                                                                            randomFrom(lower),
                                                                            randomFrom(numbers),
                                                                            randomFrom(symbols),
                                                                            ...Array.from(
                                                                                { length: 6 },
                                                                                () => randomFrom(all)
                                                                            ),
                                                                        ]
                                                                            .sort(() => Math.random() - 0.5)
                                                                            .join("");

                                                                        setClientForm((current) => ({
                                                                            ...current,
                                                                            temporaryPassword:
                                                                                generatedPassword,
                                                                        }));
                                                                    }}
                                                                    className="flex shrink-0 items-center gap-1.5 border-l border-slate-200 bg-slate-50 px-3 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-50"
                                                                >
                                                                    <RefreshCw size={13} />
                                                                    Generate
                                                                </button>
                                                            </div>

                                                            <p className="mt-1.5 text-[10px] text-slate-400">
                                                                Leave blank to let the server generate it.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Information Strip */}
                                                    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3">
                                                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                                            <ShieldCheck size={15} />
                                                        </div>

                                                        <div>
                                                            <p className="text-[11px] font-semibold text-blue-900">
                                                                Secure first login
                                                            </p>

                                                            <p className="mt-0.5 text-[10px] leading-4 text-blue-700">
                                                                The client will log in with this temporary
                                                                password and will be required to change it
                                                                after the first login.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {!clientForm.createLogin && (
                                                <div className="flex items-center gap-3 px-4 py-3.5">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                                        <AlertCircle size={15} />
                                                    </div>

                                                    <p className="text-[11px] leading-4 text-slate-500">
                                                        The client record will be created without portal
                                                        access. Login can be enabled later.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            City
                                        </label>

                                        <div className="relative">
                                            <MapPin
                                                size={17}
                                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />

                                            <input
                                                name="city"
                                                value={clientForm.city}
                                                onChange={handleClientInputChange}
                                                placeholder="City"
                                                required
                                                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Product
                                        </label>

                                        <select
                                            name="productId"
                                            value={clientForm.productId}
                                            disabled={
                                                productMastersLoading ||
                                                savingClient
                                            }
                                            onChange={(event) => {
                                                const selectedProduct =
                                                    productMasters.find(
                                                        (product) =>
                                                            String(product.id) ===
                                                            String(event.target.value)
                                                    );

                                                setClientForm((current) => ({
                                                    ...current,

                                                    productId:
                                                        selectedProduct?.id ||
                                                        "",

                                                    productVersion:
                                                        selectedProduct?.currentVersion ||
                                                        "v1.0.0",
                                                }));
                                            }}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
                                        >
                                            <option value="">
                                                {productMastersLoading
                                                    ? "Loading products..."
                                                    : "Select product"}
                                            </option>

                                            {productMasters.map((product) => (
                                                <option
                                                    key={product.id}
                                                    value={product.id}
                                                >
                                                    {product.productCode
                                                        ? `${product.productCode} — ${product.productName}`
                                                        : product.productName}
                                                </option>
                                            ))}
                                        </select>

                                        {productMastersError && (
                                            <p className="mt-2 text-xs font-medium text-rose-600">
                                                {productMastersError}
                                            </p>
                                        )}
                                    </div>

                                    {clientForm.productId && (
                                        <>
                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Product Version
                                                </label>

                                                <input
                                                    type="text"
                                                    name="productVersion"
                                                    value={clientForm.productVersion}
                                                    onChange={handleClientInputChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Licensed Users
                                                </label>

                                                <input
                                                    type="number"
                                                    name="licensedUsers"
                                                    min="1"
                                                    value={clientForm.licensedUsers}
                                                    onChange={handleClientInputChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Support Type
                                                </label>

                                                <select
                                                    name="supportType"
                                                    value={clientForm.supportType}
                                                    onChange={handleClientInputChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                >
                                                    <option value="Basic">Basic</option>
                                                    <option value="Standard">Standard</option>
                                                    <option value="Premium">Premium</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                                    Installation Status
                                                </label>

                                                <select
                                                    name="installationStatus"
                                                    value={clientForm.installationStatus}
                                                    onChange={handleClientInputChange}
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                                >
                                                    <option value="Not Installed">
                                                        Not Installed
                                                    </option>

                                                    <option value="Installation Pending">
                                                        Installation Pending
                                                    </option>

                                                    <option value="Installed">
                                                        Installed
                                                    </option>

                                                    <option value="Inactive">
                                                        Inactive
                                                    </option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            AMC Status
                                        </label>

                                        <select
                                            name="amcStatus"
                                            value={clientForm.amcStatus}
                                            onChange={handleClientInputChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option value="Not Started">Not Started</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Overdue">Overdue</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Next Renewal
                                        </label>

                                        <input
                                            type="date"
                                            name="nextRenewal"
                                            value={clientForm.nextRenewal}
                                            onChange={handleClientInputChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Assigned Employee
                                        </label>

                                        <select
                                            name="assignedEmployeeId"
                                            value={
                                                clientForm.assignedEmployeeId ||
                                                ""
                                            }
                                            onChange={(event) => {
                                                const selectedEmployee =
                                                    employees.find(
                                                        (employee) =>
                                                            String(employee.id) ===
                                                            String(event.target.value)
                                                    );

                                                setClientForm((current) => ({
                                                    ...current,

                                                    assignedEmployeeId:
                                                        event.target.value,

                                                    assignedEmployeeCode:
                                                        selectedEmployee?.employeeCode ||
                                                        "",

                                                    assignedEmployeeName:
                                                        selectedEmployee?.name ||
                                                        "",
                                                }));
                                            }}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option value="">
                                                Unassigned
                                            </option>

                                            {employeesLoading && (
                                                <option disabled>
                                                    Loading employees...
                                                </option>
                                            )}

                                            {employees.map((employee) => (
                                                <option
                                                    key={
                                                        employee.id ||
                                                        employee._id
                                                    }
                                                    value={
                                                        employee.id ||
                                                        employee._id
                                                    }
                                                >
                                                    {employee.employeeCode
                                                        ? `${employee.employeeCode} - ${employee.name}`
                                                        : employee.name}
                                                </option>
                                            ))}
                                        </select>

                                        {employeesError && (
                                            <div className="mt-2 flex items-center justify-between gap-3">
                                                <p className="text-xs font-medium text-rose-600">
                                                    {employeesError}
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={loadEmployees}
                                                    className="text-xs font-semibold text-violet-600 hover:text-violet-700"
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Opening Tickets
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            name="openTickets"
                                            value={clientForm.openTickets}
                                            onChange={handleClientInputChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Drawer Footer */}
                            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                                <button
                                    type="button"
                                    onClick={closeClientDrawer}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={savingClient}
                                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {savingClient ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            {editingClientId ? "Updating..." : "Saving..."}
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            {editingClientId ? "Update Client" : "Save Client"}
                                        </>
                                    )}
                                </button>

                            </div>

                        </form>

                    </aside>

                </>

            )}{/* Assign Product Drawer */}

            {productDrawerOpen && selectedClient && (
                <>
                    <button
                        type="button"
                        aria-label="Close product form"
                        onClick={closeProductDrawer}
                        className="enterprise-backdrop fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="enterprise-drawer fixed inset-y-0 right-0 z-[100] flex w-full max-w-[620px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)]">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-violet-600">
                                    <span className="h-2 w-2 rounded-full bg-violet-600" />
                                    Client Products
                                </div>

                                <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">
                                    {editingProductId
                                        ? "Edit Product"
                                        : "Assign Product"}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    {editingProductId
                                        ? "Update software, licence and support details for "
                                        : "Assign software and licence details to "}
                                    <span className="font-semibold text-slate-700">
                                        {selectedClient.companyName}
                                    </span>
                                    .
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Close product form"
                                disabled={savingProduct}
                                onClick={closeProductDrawer}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleAssignProduct}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Product Name *
                                        </label>

                                        <input
                                            type="text"
                                            name="productName"
                                            value={productForm.productName}
                                            onChange={handleProductInputChange}
                                            placeholder="Example: NexERP"
                                            required
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Version
                                        </label>

                                        <input
                                            type="text"
                                            name="version"
                                            value={productForm.version}
                                            onChange={handleProductInputChange}
                                            placeholder="v1.0.0"
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Licensed Users *
                                        </label>

                                        <input
                                            type="number"
                                            name="licensedUsers"
                                            min="1"
                                            value={productForm.licensedUsers}
                                            onChange={handleProductInputChange}
                                            required
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Purchase Date
                                        </label>

                                        <input
                                            type="date"
                                            name="purchaseDate"
                                            value={productForm.purchaseDate}
                                            onChange={handleProductInputChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Installation Date
                                        </label>

                                        <input
                                            type="date"
                                            name="installationDate"
                                            value={productForm.installationDate}
                                            onChange={handleProductInputChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Support Type
                                        </label>

                                        <select
                                            name="supportType"
                                            value={productForm.supportType}
                                            onChange={handleProductInputChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option value="Basic">Basic</option>
                                            <option value="Standard">
                                                Standard
                                            </option>
                                            <option value="Premium">
                                                Premium
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            AMC Status
                                        </label>

                                        <select
                                            name="amcStatus"
                                            value={productForm.amcStatus}
                                            onChange={handleProductInputChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option value="Not Started">
                                                Not Started
                                            </option>
                                            <option value="Pending">
                                                Pending
                                            </option>
                                            <option value="Partially Paid">
                                                Partially Paid
                                            </option>
                                            <option value="Paid">Paid</option>
                                            <option value="Overdue">
                                                Overdue
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Expiry Date
                                        </label>

                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={productForm.expiryDate}
                                            onChange={handleProductInputChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Installation Status
                                        </label>

                                        <select
                                            name="installationStatus"
                                            value={productForm.installationStatus}
                                            onChange={handleProductInputChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option value="Not Installed">
                                                Not Installed
                                            </option>

                                            <option value="Installation Pending">
                                                Installation Pending
                                            </option>

                                            <option value="Installed">
                                                Installed
                                            </option>

                                            <option value="Inactive">
                                                Inactive
                                            </option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                                            Notes
                                        </label>

                                        <textarea
                                            name="notes"
                                            rows="4"
                                            value={productForm.notes}
                                            onChange={handleProductInputChange}
                                            placeholder="Installation, licence or support notes..."
                                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                                <button
                                    type="button"
                                    disabled={savingProduct}
                                    onClick={closeProductDrawer}
                                    className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={savingProduct}
                                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {savingProduct ? (
                                        <>
                                            <RefreshCw
                                                size={16}
                                                className="animate-spin"
                                            />

                                            {editingProductId
                                                ? "Updating..."
                                                : "Assigning..."}
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />

                                            {editingProductId
                                                ? "Update Product"
                                                : "Assign Product"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </aside>
                </>
            )}

            {paymentDrawerOpen && paymentTarget && (
                <div className="enterprise-backdrop fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 px-4">
                    <form
                        onSubmit={submitRecordPayment}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="payment-dialog-title"
                        className="enterprise-modal w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
                    >
                        <h3 id="payment-dialog-title" className="text-sm font-semibold text-slate-950">
                            Record Payment — {paymentTarget.invoiceNo}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                            {paymentTarget.product} · Balance due:{" "}
                            {formatCurrency(
                                Math.max(
                                    (paymentTarget.amount || 0) - (paymentTarget.paidAmount || 0),
                                    0
                                )
                            )}
                        </p>

                        <div className="mt-4 grid gap-3">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Amount *
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={paymentForm.amount}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, amount: e.target.value })
                                    }
                                    className="enterprise-input h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Payment Date *
                                </label>
                                <input
                                    required
                                    type="date"
                                    value={paymentForm.paymentDate}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                                    }
                                    className="enterprise-input h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Mode
                                </label>
                                <select
                                    value={paymentForm.mode}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, mode: e.target.value })
                                    }
                                    className="enterprise-input h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Card">Card</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    Reference No.
                                </label>
                                <input
                                    value={paymentForm.referenceNo}
                                    onChange={(e) =>
                                        setPaymentForm({ ...paymentForm, referenceNo: e.target.value })
                                    }
                                    className="enterprise-input h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setPaymentDrawerOpen(false);
                                    setPaymentTarget(null);
                                }}
                                className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={savingPayment}
                                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {savingPayment ? "Saving..." : "Save Payment"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div >
    );
}
