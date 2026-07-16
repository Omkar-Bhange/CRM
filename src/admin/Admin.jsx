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
const clientPayments = [
    {
        id: 1,
        receiptNo: "RCT-2026-0081",
        client: "Shree Ganesh Industries",
        invoiceNo: "AMC-2025-0031",
        product: "NexERP",
        paymentDate: "12 Jul 2025",
        amount: 42000,
        mode: "Bank Transfer",
        referenceNo: "UTR92384721",
        receivedBy: "Mangesh Kondhare",
        status: "Completed",
    },
    {
        id: 2,
        receiptNo: "RCT-2026-0092",
        client: "Kavya Textiles Pvt Ltd",
        invoiceNo: "AMC-2026-0051",
        product: "BillFlow",
        paymentDate: "01 Aug 2026",
        amount: 18000,
        mode: "UPI",
        referenceNo: "UPI74839201",
        receivedBy: "Mangesh Kondhare",
        status: "Completed",
    },
    {
        id: 3,
        receiptNo: "RCT-2026-0098",
        client: "GreenLeaf Agro",
        invoiceNo: "AMC-2026-0049",
        product: "StockPro",
        paymentDate: "10 Jul 2026",
        amount: 10000,
        mode: "Cheque",
        referenceNo: "CHQ-674821",
        receivedBy: "Akash Pawar",
        status: "Completed",
    },
    {
        id: 4,
        receiptNo: "RCT-2026-0076",
        client: "Precision Auto Parts",
        invoiceNo: "AMC-2026-0042",
        product: "NexERP",
        paymentDate: "08 Jul 2026",
        amount: 60000,
        mode: "Bank Transfer",
        referenceNo: "UTR98374125",
        receivedBy: "Mangesh Kondhare",
        status: "Completed",
    },
];

const clientDocuments = [
    {
        id: 1,
        client: "Shree Ganesh Industries",
        name: "AMC Agreement.pdf",
        type: "PDF",
        category: "Agreement",
        size: "1.4 MB",
        uploadedOn: "02 Jul 2026",
        uploadedBy: "Mangesh Kondhare",
    },
    {
        id: 2,
        client: "Shree Ganesh Industries",
        name: "GST Certificate.pdf",
        type: "PDF",
        category: "Legal",
        size: "480 KB",
        uploadedOn: "12 Jan 2026",
        uploadedBy: "Akash Pawar",
    },
    {
        id: 3,
        client: "Shree Ganesh Industries",
        name: "Quotation.xlsx",
        type: "Excel",
        category: "Quotation",
        size: "210 KB",
        uploadedOn: "18 Jun 2026",
        uploadedBy: "Sneha Kale",
    },
    {
        id: 4,
        client: "Shree Ganesh Industries",
        name: "ERP Setup Images.zip",
        type: "ZIP",
        category: "Installation",
        size: "18 MB",
        uploadedOn: "20 Jul 2026",
        uploadedBy: "Rohit More",
    },
];
const clientActivity = [
    {
        id: 1,
        client: "Shree Ganesh Industries",
        type: "Client Created",
        description: "Client account created in CRM",
        user: "Mangesh Kondhare",
        date: "10 Jan 2024",
    },
    {
        id: 2,
        client: "Shree Ganesh Industries",
        type: "Software Installed",
        description: "NexERP installed successfully",
        user: "Akash Pawar",
        date: "18 Jul 2024",
    },
    {
        id: 3,
        client: "Shree Ganesh Industries",
        type: "AMC Generated",
        description: "AMC Invoice AMC-2026-0048 generated",
        user: "Mangesh Kondhare",
        date: "01 Jul 2026",
    },
    {
        id: 4,
        client: "Shree Ganesh Industries",
        type: "Ticket Raised",
        description: "GST Report mismatch",
        user: "Client Portal",
        date: "13 Jul 2026",
    },
    {
        id: 5,
        client: "Shree Ganesh Industries",
        type: "Ticket Assigned",
        description: "Assigned to Akash Pawar",
        user: "Admin",
        date: "13 Jul 2026",
    },
    {
        id: 6,
        client: "Shree Ganesh Industries",
        type: "Document Uploaded",
        description: "AMC Agreement uploaded",
        user: "Mangesh Kondhare",
        date: "13 Jul 2026",
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
    const [deletingProductId, setDeletingProductId] = useState(null);

    const [productForm, setProductForm] = useState({
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
        products: "",
        amcStatus: "Not Started",
        nextRenewal: "",
        openTickets: 0,
        assignedTo: "",
        status: "Active",
    });
    const getAuthToken = () => {
        return (
            localStorage.getItem("client-connect-token") ||
            sessionStorage.getItem("client-connect-token") ||
            ""
        );
    };

    const normalizeClientFromApi = (client) => ({
        ...client,

        id: client._id,
        code: client.clientCode,

        products: Array.isArray(client.products)
            ? client.products.map((product) => {
                if (typeof product === "string") {
                    return {
                        productName: product,
                        version: "v1.0.0",
                        purchaseDate: "",
                        installationDate: "",
                        licensedUsers: 1,
                        supportType: "Standard",
                        amcStatus:
                            client.amcStatus || "Not Started",
                        expiryDate:
                            client.nextRenewal || "",
                        installationStatus: "Installed",
                        notes: "",
                    };
                }

                return product;
            })
            : [],

        nextRenewal: client.nextRenewal || "",
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

    useEffect(() => {
        loadClients();
    }, []);

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
                client.assignedTo,
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
            products: "",
            amcStatus: "Not Started",
            nextRenewal: "",
            openTickets: 0,
            assignedTo: "",
            status: "Active",
        });
    };

    const openClientDrawer = (client = null) => {
        if (client) {
            setEditingClientId(client._id || client.id);

            setClientForm({
                code: client.code || client.clientCode || "",
                companyName: client.companyName || "",
                contactPerson: client.contactPerson || "",
                email: client.email || "",
                mobile: client.mobile || "",
                city: client.city || "",
                products: Array.isArray(client.products)
                    ? client.products
                        .map((product) =>
                            typeof product === "string"
                                ? product
                                : product.productName
                        )
                        .filter(Boolean)
                        .join(", ")
                    : "",
                amcStatus: client.amcStatus || "Not Started",
                nextRenewal: client.nextRenewal || "",
                openTickets: Number(client.openTickets || 0),
                assignedTo: client.assignedTo || "",
                status: client.status || "Active",
            });

            setClientDrawerOpen(true);
            return;
        }

        const highestClientNumber = clients.reduce(
            (highest, currentClient) => {
                const number = Number(
                    String(
                        currentClient.code ||
                        currentClient.clientCode ||
                        ""
                    ).replace("CL-", "")
                );

                return Number.isFinite(number)
                    ? Math.max(highest, number)
                    : highest;
            },
            1000
        );

        setEditingClientId(null);

        setClientForm({
            code: `CL-${highestClientNumber + 1}`,
            companyName: "",
            contactPerson: "",
            email: "",
            mobile: "",
            city: "",
            products: "",
            amcStatus: "Not Started",
            nextRenewal: "",
            openTickets: 0,
            assignedTo: "",
            status: "Active",
        });

        setClientDrawerOpen(true);
    };

    const closeClientDrawer = () => {
        setClientDrawerOpen(false);
        setEditingClientId(null);
        resetClientForm();
    };

    const openClientDetails = (client) => {
        setSelectedClient(client);
        setClientDetailsTab("overview");
    };

    const closeClientDetails = () => {
        setSelectedClient(null);
        setClientDetailsTab("overview");
    };
    const resetProductForm = () => {
        setProductForm({
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

   const openProductDrawer = (product = null) => {
    if (!selectedClient) {
        alert("Please select a client first.");
        return;
    }

    const isActualProduct =
        product &&
        typeof product === "object" &&
        !("nativeEvent" in product) &&
        (product._id ||
            product.id ||
            product.productName ||
            product.name);

    if (isActualProduct) {
        const productId = product._id || product.id;

        if (!productId) {
            alert("Product ID is missing.");
            return;
        }

        setEditingProductId(productId);

        setProductForm({
            productName:
                product.productName || product.name || "",
            version: product.version || "v1.0.0",
            purchaseDate:
                product.purchaseDate === "Not available"
                    ? ""
                    : product.purchaseDate || "",
            installationDate:
                product.installationDate === "Not available"
                    ? ""
                    : product.installationDate || "",
            licensedUsers: Number(
                product.licensedUsers || product.users || 1
            ),
            supportType: product.supportType || "Standard",
            amcStatus: product.amcStatus || "Not Started",
            expiryDate:
                product.expiryDate === "Not available"
                    ? ""
                    : product.expiryDate || "",
            installationStatus:
                product.installationStatus || "Installed",
            notes: product.notes || "",
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

    const handleProductInputChange = (event) => {
        const { name, value } = event.target;

        setProductForm((current) => ({
            ...current,
            [name]: value,
        }));
    };
    const handleAssignProduct = async (event) => {
        event.preventDefault();

        if (!selectedClient) {
            alert("Client information is missing.");
            return;
        }

        const clientId =
            selectedClient._id || selectedClient.id;

        const productName =
            productForm.productName.trim();

        if (!clientId) {
            alert("Client ID is missing.");
            return;
        }

        if (!productName) {
            alert("Product name is required.");
            return;
        }

        const isEditing = Boolean(editingProductId);

        const duplicateProduct =
            getSelectedClientProducts().some((product) => {
                const currentProductId =
                    product._id || product.id;

                return (
                    currentProductId !== editingProductId &&
                    String(
                        product.productName ||
                        product.name ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                    productName.toLowerCase()
                );
            });

        if (duplicateProduct) {
            alert(
                "This product is already assigned to the client."
            );
            return;
        }

        try {
            setSavingProduct(true);

            const endpoint = isEditing
                ? `${API_URL}/api/admin/client/${clientId}/product/${editingProductId}`
                : `${API_URL}/api/admin/client/${clientId}/product`;

            const response = await fetch(endpoint, {
                method: isEditing ? "PUT" : "POST",

                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },

                body: JSON.stringify({
                    productName,

                    version:
                        productForm.version.trim() ||
                        "v1.0.0",

                    purchaseDate:
                        productForm.purchaseDate,

                    installationDate:
                        productForm.installationDate,

                    licensedUsers: Math.max(
                        Number(
                            productForm.licensedUsers || 1
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
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    `Unable to ${isEditing ? "update" : "assign"
                    } product.`
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
            setProductDrawerOpen(false);
            setEditingProductId(null);
            resetProductForm();

            alert(
                isEditing
                    ? "Product updated successfully."
                    : "Product assigned successfully."
            );
        } catch (error) {
            console.error("Save product error:", error);

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

    const handleSaveClient = async (event) => {
        event.preventDefault();

        const clientCode = clientForm.code.trim();
        const companyName = clientForm.companyName.trim();
        const mobile = clientForm.mobile.trim();

        if (!clientCode || !companyName) {
            alert("Client code and company name are required.");
            return;
        }

        const duplicateCode = clients.some((client) => {
            const currentId = client._id || client.id;

            return (
                currentId !== editingClientId &&
                String(client.code || client.clientCode || "")
                    .trim()
                    .toLowerCase() === clientCode.toLowerCase()
            );
        });

        if (duplicateCode) {
            alert("This client code already exists.");
            return;
        }

        const duplicateMobile =
            mobile &&
            clients.some((client) => {
                const currentId = client._id || client.id;

                return (
                    currentId !== editingClientId &&
                    String(client.mobile || "").trim() === mobile
                );
            });

        if (duplicateMobile) {
            alert("A client with this mobile number already exists.");
            return;
        }

        const productList = clientForm.products
            .split(",")
            .map((product) => product.trim())
            .filter(Boolean);

        try {
            setSavingClient(true);

            const isEditing = Boolean(editingClientId);

            const endpoint = isEditing
                ? `${API_URL}/api/admin/client/${editingClientId}`
                : `${API_URL}/api/admin/client`;

            const response = await fetch(endpoint, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    clientCode,
                    companyName,
                    contactPerson: clientForm.contactPerson.trim(),
                    email: clientForm.email.trim().toLowerCase(),
                    mobile,
                    city: clientForm.city.trim(),
                    products: productList,
                    amcStatus: clientForm.amcStatus,
                    nextRenewal: clientForm.nextRenewal || "",
                    openTickets: Number(clientForm.openTickets || 0),
                    assignedTo:
                        clientForm.assignedTo.trim() || "Unassigned",
                    status: clientForm.status,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    `Unable to ${isEditing ? "update" : "save"} client.`
                );
            }

            const savedClient = normalizeClientFromApi(result.data);

            if (isEditing) {
                setClients((currentClients) =>
                    currentClients.map((client) =>
                        (client._id || client.id) === editingClientId
                            ? savedClient
                            : client
                    )
                );

                if (
                    selectedClient &&
                    (selectedClient._id || selectedClient.id) ===
                    editingClientId
                ) {
                    setSelectedClient(savedClient);
                }
            } else {
                setClients((currentClients) => [
                    ...currentClients,
                    savedClient,
                ]);
            }

            closeClientDrawer();

            alert(
                isEditing
                    ? "Client updated successfully."
                    : "Client added successfully."
            );
        } catch (error) {
            console.error("Save client error:", error);
            alert(error.message || "Unable to save client.");
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
            return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
        }

        if (status === "Overdue") {
            return "bg-rose-50 text-rose-700 ring-rose-600/10";
        }

        return "bg-amber-50 text-amber-700 ring-amber-600/10";
    };

    const getPriorityClasses = (priority) => {
        if (priority === "Critical") {
            return "bg-rose-50 text-rose-700 ring-rose-600/10";
        }

        if (priority === "High") {
            return "bg-orange-50 text-orange-700 ring-orange-600/10";
        }

        if (priority === "Medium") {
            return "bg-amber-50 text-amber-700 ring-amber-600/10";
        }

        return "bg-slate-100 text-slate-600 ring-slate-500/10";
    };

    const getTicketStatusClasses = (status) => {
        if (status === "Resolved") {
            return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
        }

        if (status === "In Progress") {
            return "bg-violet-50 text-violet-700 ring-violet-600/10";
        }

        if (status === "Waiting") {
            return "bg-amber-50 text-amber-700 ring-amber-600/10";
        }

        return "bg-blue-50 text-blue-700 ring-blue-600/10";
    };

    const getTaskStatusClasses = (status) => {
        if (status === "Testing") {
            return "bg-blue-50 text-blue-700 ring-blue-600/10";
        }

        if (status === "Completed") {
            return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
        }

        return "bg-violet-50 text-violet-700 ring-violet-600/10";
    };

    const getClientAmcClasses = (status) => {
        if (status === "Paid") {
            return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
        }

        if (status === "Overdue") {
            return "bg-rose-50 text-rose-700 ring-rose-600/10";
        }

        if (status === "Pending") {
            return "bg-amber-50 text-amber-700 ring-amber-600/10";
        }

        return "bg-slate-100 text-slate-600 ring-slate-500/10";
    };
    const getSelectedClientProducts = () => {
        if (!selectedClient || !Array.isArray(selectedClient.products)) {
            return [];
        }

        return selectedClient.products.map((product, index) => {
            if (typeof product === "string") {
                return {
                    id: `${selectedClient.id}-${index}`,
                    name: product,
                    productName: product,
                    version: "v1.0.0",
                    purchaseDate: "Not available",
                    installationDate: "Not available",
                    users: 1,
                    licensedUsers: 1,
                    supportType: "Standard",
                    amcStatus:
                        selectedClient.amcStatus || "Not Started",
                    expiryDate:
                        selectedClient.nextRenewal || "Not available",
                    installationStatus: "Installed",
                    notes: "",
                };
            }

            return {
                ...product,
                id: product._id || `${selectedClient.id}-${index}`,
                name: product.productName || "Unnamed Product",
                users: Number(product.licensedUsers || 1),
                licensedUsers: Number(product.licensedUsers || 1),
                purchaseDate:
                    product.purchaseDate || "Not available",
                installationDate:
                    product.installationDate || "Not available",
                expiryDate:
                    product.expiryDate || "Not available",
            };
        });
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
        if (!selectedClient) return [];

        return clientAmcRecords.filter(
            (record) => record.client === selectedClient.companyName
        );
    };

    const getAmcPaymentStatusClasses = (status) => {
        if (status === "Paid") {
            return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
        }

        if (status === "Overdue") {
            return "bg-rose-50 text-rose-700 ring-rose-600/10";
        }

        if (status === "Partially Paid") {
            return "bg-blue-50 text-blue-700 ring-blue-600/10";
        }

        return "bg-amber-50 text-amber-700 ring-amber-600/10";
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

        return clientPayments.filter(
            (payment) => payment.client === selectedClient.companyName
        );
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

        return clientDocuments.filter(
            (doc) => doc.client === selectedClient.companyName
        );
    };
    const getSelectedClientActivity = () => {
        if (!selectedClient) return [];

        return clientActivity.filter(
            (activity) => activity.client === selectedClient.companyName
        );
    };
    return (
        <div className="min-h-screen bg-[#f4f6fa] text-slate-900">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-white/10 bg-[#111827] text-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
                                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive
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
                            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${activeMenu === "settings"
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
                        onClick={() => setSidebarOpen(true)}
                        className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold tracking-[-0.02em] text-slate-950">
                            {selectedMenu.label}
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
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-[1600px]">
                        {activeMenu === "overview" ? (
                            <div>
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
                                <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {dashboardStats.map((stat) => {
                                        const Icon = stat.icon;
                                        const isPositive = stat.trend === "up";

                                        return (
                                            <article
                                                key={stat.id}
                                                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
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

                                <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">


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
                                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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

                                        <div className="divide-y divide-slate-100">
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
                                <div>
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
                                                        {selectedClient.assignedTo}
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
                                                                    {selectedClient.assignedTo}
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
                                                                        {getSelectedClientProducts().map((product) => (
                                                                            <tr
                                                                                key={product.id}
                                                                                className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                                                                            >
                                                                                <td className="px-5 py-4 lg:px-6">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                                                                            <Box size={18} />
                                                                                        </div>

                                                                                        <div>
                                                                                            <p className="text-sm font-semibold text-slate-900">
                                                                                                {product.name}
                                                                                            </p>

                                                                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                                                                Installed {product.installationDate}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>

                                                                                <td className="px-5 py-4">
                                                                                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                                                                                        {product.version}
                                                                                    </span>
                                                                                </td>

                                                                                <td className="px-5 py-4 text-xs font-medium text-slate-600">
                                                                                    {product.purchaseDate}
                                                                                </td>

                                                                                <td className="px-5 py-4">
                                                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                                                        <UsersRound size={14} className="text-slate-400" />
                                                                                        {product.users}
                                                                                    </span>
                                                                                </td>

                                                                                <td className="px-5 py-4">
                                                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                                                                        <ShieldCheck
                                                                                            size={14}
                                                                                            className="text-emerald-500"
                                                                                        />
                                                                                        {product.supportType}
                                                                                    </span>
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

                                                                                <td className="px-5 py-4 text-xs font-medium text-slate-600">
                                                                                    {product.expiryDate}
                                                                                </td>

                                                                                <td className="px-5 py-4">
                                                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                                                                        <MonitorCog size={13} />
                                                                                        {product.installationStatus}
                                                                                    </span>
                                                                                </td>

                                                                                <td className="px-5 py-4 lg:px-6">
                                                                                    <div className="flex justify-end gap-2">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => openProductDrawer(product)}
                                                                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                                                                                            title="Edit product"
                                                                                        >
                                                                                            <Pencil size={15} />
                                                                                        </button>

                                                                                        <button
                                                                                            type="button"
                                                                                            disabled={
                                                                                                deletingProductId ===
                                                                                                (product._id || product.id)
                                                                                            }
                                                                                            onClick={() => handleDeleteProduct(product)}
                                                                                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                                                            title="Delete product"
                                                                                        >
                                                                                            {deletingProductId ===
                                                                                                (product._id || product.id) ? (
                                                                                                <RefreshCw
                                                                                                    size={15}
                                                                                                    className="animate-spin"
                                                                                                />
                                                                                            ) : (
                                                                                                <Trash2 size={15} />
                                                                                            )}
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
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
                                                        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">

                                                            <div>
                                                                <h3 className="text-sm font-semibold text-slate-950">
                                                                    Client Documents
                                                                </h3>

                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    Agreements, GST, quotations, invoices and installation files.
                                                                </p>
                                                            </div>

                                                            <button className="flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-xs font-semibold text-white">
                                                                <Upload size={15} />
                                                                Upload Document
                                                            </button>

                                                        </div>
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

                                <div>
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
                                    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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
                                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
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
                                                        className="h-10 min-w-[145px] appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-semibold text-slate-600 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                                                        className="h-10 min-w-[155px] appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-semibold text-slate-600 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
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
                                            <table className="min-w-[1200px] w-full">
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
                                                                <RefreshCw
                                                                    size={28}
                                                                    className="mx-auto animate-spin text-violet-600"
                                                                />
                                                                <p className="mt-3 text-sm font-semibold text-slate-700">
                                                                    Loading clients...
                                                                </p>
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
                                                                        {client.assignedTo}
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
                            <SupportTickets />
                        ) : activeMenu === "billing" ? (
                            <AmcBilling />
                        ) : activeMenu === "team" ? (
                            <Team />
                        ) : activeMenu === "tasks" ? (
                            <Tasks />
                        ) : activeMenu === "attendance" ? (
                            <Attendance />
                        ) : activeMenu === "settings" ? (
                            <SystemSettings />
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
                        className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[620px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)]">
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
                                            Products
                                        </label>

                                        <input
                                            name="products"
                                            value={clientForm.products}
                                            onChange={handleClientInputChange}
                                            placeholder="NexERP, StockPro, BillFlow"
                                            required
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        />

                                        <p className="mt-1.5 text-[10px] text-slate-400">
                                            Enter multiple products separated by commas.
                                        </p>
                                    </div>

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
                                            name="assignedTo"
                                            value={clientForm.assignedTo}
                                            onChange={handleClientInputChange}
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                                        >
                                            <option value="">Select employee</option>

                                            {teamMembers.map((member) => (
                                                <option key={member.id} value={member.name}>
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>
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
                        className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px]"
                    />

                    <aside className="fixed inset-y-0 right-0 z-[100] flex w-full max-w-[620px] flex-col bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.18)]">
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
        </div >
    );
}