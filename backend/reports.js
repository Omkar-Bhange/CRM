const express = require("express");
const mongoose = require("mongoose");
const authenticateUser = require("./authMiddleware");

const router = express.Router();

/* =========================================================
   REPORTS MODULE

   IMPORTANT:
   - READ ONLY
   - No create/update/delete logic
   - Uses existing mongoose models
   - Admin only
========================================================= */

router.use(authenticateUser);

router.use((req, res, next) => {
    if (req.user?.role === "admin") {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Admin access is required.",
    });
});

/* =========================================================
   MODEL HELPERS

   Models are already registered by:
   admin.js
   employee.js
   attendance-v2.js
========================================================= */

function getModel(name) {
    const model = mongoose.models[name];

    if (!model) {
        throw new Error(
            `${name} model is not registered. Check server route loading order.`
        );
    }

    return model;
}

function getOptionalModel(name) {
    return mongoose.models[name] || null;
}

/* =========================================================
   DATE HELPERS
========================================================= */

function getDateRange(req) {
    const {
        fromDate,
        toDate,
    } = req.query;

    const range = {};

    if (fromDate) {
        const from = new Date(
            `${fromDate}T00:00:00+05:30`
        );

        if (!Number.isNaN(from.getTime())) {
            range.$gte = from;
        }
    }

    if (toDate) {
        const to = new Date(
            `${toDate}T23:59:59.999+05:30`
        );

        if (!Number.isNaN(to.getTime())) {
            range.$lte = to;
        }
    }

    return Object.keys(range).length
        ? range
        : null;
}

function getTodayString() {
    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    ).format(new Date());
}

function escapeRegex(value) {
    return String(value || "")
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );
}

/* =========================================================
   STATUS HELPERS
========================================================= */

const CLOSED_TICKET_STATUSES = [
    "Resolved",
    "Verified",
    "Closed",
    "Cancelled",
];

const ACTIVE_TICKET_STATUSES = [
    "New",
    "Assigned",
    "In Progress",
    "Waiting for Client",
    "Testing",
];

const FINISHED_TASK_STATUSES = [
    "Completed",
    "Closed",
    "Cancelled",
    "Done",
];

/* =========================================================
   REPORTS HEALTH
========================================================= */

router.get(
    "/health",
    async (req, res) => {
        return res.json({
            success: true,
            message:
                "Reports module is active.",
            readOnly: true,
        });
    }
);

/* =========================================================
   MANAGEMENT DASHBOARD
========================================================= */

router.get(
    "/dashboard",
    async (req, res, next) => {
        try {
            const Client =
                getModel("Client");

            const Employee =
                getModel("Employee");

            const Task =
                getModel("Task");

            const SupportTicket =
                getModel("SupportTicket");

            const Attendance =
                getOptionalModel(
                    "AttendanceV2"
                );
            const AmcInvoice =
                getOptionalModel(
                    "AmcInvoice"
                );

            const today =
                getTodayString();

            const now =
                new Date();

            const [
                totalClients,
                activeClients,
                inactiveClients,

                totalEmployees,
                workingEmployees,
                freeEmployees,
                leaveEmployees,
                offlineEmployees,

                totalTasks,
                activeTasks,
                completedTasks,
                overdueTasks,

                totalTickets,
                openTickets,
                resolvedTickets,
                overdueTickets,
            ] = await Promise.all([
                Client.countDocuments({
                    isDeleted: {
                        $ne: true,
                    },
                }),

                Client.countDocuments({
                    isDeleted: {
                        $ne: true,
                    },
                    status: "Active",
                }),

                Client.countDocuments({
                    isDeleted: {
                        $ne: true,
                    },
                    status: {
                        $in: [
                            "Inactive",
                            "Suspended",
                        ],
                    },
                }),

                Employee.countDocuments({
                    isActive: {
                        $ne: false,
                    },
                }),

                Employee.countDocuments({
                    isActive: {
                        $ne: false,
                    },
                    status: "Working",
                }),

                Employee.countDocuments({
                    isActive: {
                        $ne: false,
                    },
                    status: "Free",
                }),

                Employee.countDocuments({
                    isActive: {
                        $ne: false,
                    },
                    status: "Leave",
                }),

                Employee.countDocuments({
                    isActive: {
                        $ne: false,
                    },
                    status: "Offline",
                }),

                Task.countDocuments({
                    isDeleted: {
                        $ne: true,
                    },
                }),

                Task.countDocuments({
                    isDeleted: {
                        $ne: true,
                    },
                    status: {
                        $nin:
                            FINISHED_TASK_STATUSES,
                    },
                }),

                Task.countDocuments({
                    isDeleted: {
                        $ne: true,
                    },
                    status: {
                        $in:
                            FINISHED_TASK_STATUSES,
                    },
                }),

                Task.countDocuments({
                    isDeleted: {
                        $ne: true,
                    },
                    dueDate: {
                        $lt: now,
                    },
                    status: {
                        $nin:
                            FINISHED_TASK_STATUSES,
                    },
                }),

                SupportTicket.countDocuments({
                    isDeleted: {
                        $ne: true,
                    },
                }),

                SupportTicket.countDocuments({
                    isDeleted: {
                        $ne: true,
                    },
                    status: {
                        $in:
                            ACTIVE_TICKET_STATUSES,
                    },
                }),

                SupportTicket.countDocuments({
                    isDeleted: {
                        $ne: true,
                    },
                    status: {
                        $in:
                            CLOSED_TICKET_STATUSES,
                    },
                }),

                SupportTicket.countDocuments({
                    isDeleted: {
                        $ne: true,
                    },
                    dueDate: {
                        $lt: now,
                    },
                    status: {
                        $nin:
                            CLOSED_TICKET_STATUSES,
                    },
                }),
            ]);
            /* =========================================================
         AMC + COLLECTION DASHBOARD SUMMARY
      ========================================================= */

            let amcSummary = {
                total: 0,
                active: 0,
                expiringSoon: 0,
                critical: 0,
                expired: 0,

                totalValue: 0,
                outstanding: 0,
                overdueAmount: 0,
            };

            let collectionSummary = {
                invoiceCount: 0,

                totalBilled: 0,
                collected: 0,
                outstanding: 0,

                overdueInvoices: 0,
                overdueAmount: 0,

                paidInvoices: 0,
                partialInvoices: 0,
            };

            let amcAttention = [];

            let collectionAttention = [];

            let todayAttendance = {
                present: 0,
                late: 0,
                halfDay: 0,
                absent: 0,
                leave: 0,
            };

            if (Attendance) {
                const attendanceSummary =
                    await Attendance.aggregate([
                        {
                            $match: {
                                date: today,

                                isDeleted: {
                                    $ne: true,
                                },
                            },
                        },

                        {
                            $group: {
                                _id: "$status",
                                count: {
                                    $sum: 1,
                                },
                            },
                        },
                    ]);

                for (
                    const item of
                    attendanceSummary
                ) {
                    if (
                        item._id ===
                        "Present"
                    ) {
                        todayAttendance.present =
                            item.count;
                    }

                    if (
                        item._id ===
                        "Late"
                    ) {
                        todayAttendance.late =
                            item.count;
                    }

                    if (
                        item._id ===
                        "Half Day"
                    ) {
                        todayAttendance.halfDay =
                            item.count;
                    }

                    if (
                        item._id ===
                        "Absent"
                    ) {
                        todayAttendance.absent =
                            item.count;
                    }

                    if (
                        item._id ===
                        "On Leave"
                    ) {
                        todayAttendance.leave =
                            item.count;
                    }
                }
            }

            /* =========================================================
   AMC + COLLECTION DASHBOARD DATA

   READ ONLY
   Uses the same AmcInvoice fields as Management Reports.
========================================================= */

if (AmcInvoice) {
  const invoices =
    await AmcInvoice.find({
      isDeleted: {
        $ne: true,
      },

      status: {
        $ne: "Cancelled",
      },
    })
      .select({
        invoiceCode: 1,
        invoiceDate: 1,

        contractCode: 1,
        contractStartDate: 1,
        contractExpiryDate: 1,

        dueDate: 1,

        clientId: 1,
        clientCode: 1,
        clientName: 1,

        productCode: 1,
        productName: 1,
        productVersion: 1,

        totalAmount: 1,
        paidAmount: 1,
        pendingAmount: 1,

        paymentStatus: 1,
        status: 1,
      })
      .lean();

  const amcRiskRows = [];
  const collectionRows = [];

  for (const invoice of invoices) {
    const totalAmount =
      Number(
        invoice.totalAmount ||
          0
      );

    const paidAmount =
      Number(
        invoice.paidAmount ||
          0
      );

    const pendingAmount =
      Number(
        invoice.pendingAmount ||
          0
      );

    /* =========================
       AMC RISK
    ========================= */

    const expiryDate =
      invoice.contractExpiryDate
        ? new Date(
            invoice.contractExpiryDate
          )
        : null;

    let daysLeft = null;

    if (
      expiryDate &&
      !Number.isNaN(
        expiryDate.getTime()
      )
    ) {
      daysLeft =
        Math.ceil(
          (
            expiryDate.getTime() -
            now.getTime()
          ) /
            86400000
        );
    }

    let renewalRisk =
      "Normal";

    if (
      daysLeft !== null &&
      daysLeft < 0
    ) {
      renewalRisk =
        "Expired";
    } else if (
      daysLeft !== null &&
      daysLeft <= 7
    ) {
      renewalRisk =
        "Critical";
    } else if (
      daysLeft !== null &&
      daysLeft <= 30
    ) {
      renewalRisk =
        "Expiring Soon";
    }

    amcSummary.total += 1;

    amcSummary.totalValue +=
      totalAmount;

    amcSummary.outstanding +=
      pendingAmount;

    if (
      renewalRisk ===
      "Expired"
    ) {
      amcSummary.expired +=
        1;
    } else if (
      renewalRisk ===
      "Critical"
    ) {
      amcSummary.critical +=
        1;
    } else if (
      renewalRisk ===
      "Expiring Soon"
    ) {
      amcSummary.expiringSoon +=
        1;
    } else {
      amcSummary.active +=
        1;
    }

    /* =========================
       PAYMENT / COLLECTION
    ========================= */

    const dueDate =
      invoice.dueDate
        ? new Date(
            invoice.dueDate
          )
        : null;

    const isOverdue =
      Boolean(
        pendingAmount > 0 &&
        dueDate &&
        !Number.isNaN(
          dueDate.getTime()
        ) &&
        dueDate < now
      );

    const overdueDays =
      isOverdue
        ? Math.max(
            0,
            Math.floor(
              (
                now.getTime() -
                dueDate.getTime()
              ) /
                86400000
            )
          )
        : 0;

    let collectionStatus =
      "Pending";

    if (
      pendingAmount <= 0 &&
      totalAmount > 0
    ) {
      collectionStatus =
        "Paid";
    } else if (
      isOverdue
    ) {
      collectionStatus =
        "Overdue";
    } else if (
      paidAmount > 0 &&
      pendingAmount > 0
    ) {
      collectionStatus =
        "Partially Paid";
    }

    collectionSummary.invoiceCount +=
      1;

    collectionSummary.totalBilled +=
      totalAmount;

    collectionSummary.collected +=
      paidAmount;

    collectionSummary.outstanding +=
      pendingAmount;

    if (isOverdue) {
      collectionSummary.overdueInvoices +=
        1;

      collectionSummary.overdueAmount +=
        pendingAmount;

      amcSummary.overdueAmount +=
        pendingAmount;
    }

    if (
      collectionStatus ===
      "Paid"
    ) {
      collectionSummary.paidInvoices +=
        1;
    }

    if (
      collectionStatus ===
      "Partially Paid"
    ) {
      collectionSummary.partialInvoices +=
        1;
    }

    amcRiskRows.push({
      id:
        invoice._id,

      clientId:
        invoice.clientId,

      clientCode:
        invoice.clientCode ||
        "",

      clientName:
        invoice.clientName ||
        "",

      invoiceCode:
        invoice.invoiceCode ||
        "",

      contractCode:
        invoice.contractCode ||
        "",

      productCode:
        invoice.productCode ||
        "",

      productName:
        invoice.productName ||
        "",

      contractExpiryDate:
        invoice.contractExpiryDate ||
        null,

      daysLeft,

      renewalRisk,

      totalAmount,
      pendingAmount,
    });

    collectionRows.push({
      id:
        invoice._id,

      clientId:
        invoice.clientId,

      clientCode:
        invoice.clientCode ||
        "",

      clientName:
        invoice.clientName ||
        "",

      invoiceCode:
        invoice.invoiceCode ||
        "",

      dueDate:
        invoice.dueDate ||
        null,

      totalAmount,
      paidAmount,
      pendingAmount,

      isOverdue,
      overdueDays,

      collectionStatus,
    });
  }

  /* =====================================================
     AMC ATTENTION

     Only expired / critical / expiring AMC.
  ===================================================== */

  const amcRiskOrder = {
    Expired: 1,
    Critical: 2,
    "Expiring Soon": 3,
    Normal: 4,
  };

  amcAttention =
    amcRiskRows
      .filter(
        (item) =>
          item.renewalRisk !==
          "Normal"
      )
      .sort((a, b) => {
        const riskDifference =
          (
            amcRiskOrder[
              a.renewalRisk
            ] || 99
          ) -
          (
            amcRiskOrder[
              b.renewalRisk
            ] || 99
          );

        if (
          riskDifference !== 0
        ) {
          return riskDifference;
        }

        return (
          Number(
            a.daysLeft ??
              999999
          ) -
          Number(
            b.daysLeft ??
              999999
          )
        );
      })
      .slice(0, 10);

  /* =====================================================
     COLLECTION ATTENTION

     Highest overdue/outstanding first.
  ===================================================== */

  collectionAttention =
    collectionRows
      .filter(
        (item) =>
          Number(
            item.pendingAmount ||
              0
          ) > 0
      )
      .sort((a, b) => {
        if (
          a.isOverdue !==
          b.isOverdue
        ) {
          return a.isOverdue
            ? -1
            : 1;
        }

        if (
          Number(
            b.overdueDays ||
              0
          ) !==
          Number(
            a.overdueDays ||
              0
          )
        ) {
          return (
            Number(
              b.overdueDays ||
                0
            ) -
            Number(
              a.overdueDays ||
                0
            )
          );
        }

        return (
          Number(
            b.pendingAmount ||
              0
          ) -
          Number(
            a.pendingAmount ||
              0
          )
        );
      })
      .slice(0, 10);
}
            const employeeWorkload =
                await Employee.find({
                    isActive: {
                        $ne: false,
                    },
                })
                    .select({
                        employeeCode: 1,
                        name: 1,
                        department: 1,
                        role: 1,
                        status: 1,
                        currentTask: 1,
                        currentTaskCode: 1,
                        currentTaskTitle: 1,
                        currentClient: 1,
                        currentProject: 1,
                        openTasks: 1,
                        completedToday: 1,
                        lastActivityAt: 1,
                    })
                    .sort({
                        name: 1,
                    })
                    .lean();

            const clientAttention =
                await SupportTicket.aggregate([
                    {
                        $match: {
                            isDeleted: {
                                $ne: true,
                            },

                            status: {
                                $nin:
                                    CLOSED_TICKET_STATUSES,
                            },
                        },
                    },

                    {
                        $group: {
                            _id: "$clientId",

                            clientName: {
                                $first:
                                    "$clientName",
                            },

                            openTickets: {
                                $sum: 1,
                            },

                            highPriorityTickets: {
                                $sum: {
                                    $cond: [
                                        {
                                            $in: [
                                                "$priority",
                                                [
                                                    "High",
                                                    "Critical",
                                                    "Urgent",
                                                ],
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },

                            overdueTickets: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                {
                                                    $ne: [
                                                        "$dueDate",
                                                        null,
                                                    ],
                                                },

                                                {
                                                    $lt: [
                                                        "$dueDate",
                                                        now,
                                                    ],
                                                },
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                        },
                    },

                    {
                        $sort: {
                            overdueTickets: -1,
                            highPriorityTickets: -1,
                            openTickets: -1,
                        },
                    },

                    {
                        $limit: 10,
                    },
                ]);

            return res.json({
                success: true,

                generatedAt:
                    new Date(),

                data: {
                    clients: {
                        total:
                            totalClients,

                        active:
                            activeClients,

                        inactive:
                            inactiveClients,

                        attentionRequired:
                            clientAttention.length,
                    },

                    team: {
                        total:
                            totalEmployees,

                        working:
                            workingEmployees,

                        free:
                            freeEmployees,

                        leave:
                            leaveEmployees,

                        offline:
                            offlineEmployees,
                    },

                    tasks: {
                        total:
                            totalTasks,

                        active:
                            activeTasks,

                        completed:
                            completedTasks,

                        overdue:
                            overdueTasks,
                    },

                    tickets: {
                        total:
                            totalTickets,

                        open:
                            openTickets,

                        resolved:
                            resolvedTickets,

                        overdue:
                            overdueTickets,
                    },

                    attendance:
                        todayAttendance,
                        amc: {
  total:
    amcSummary.total,

  active:
    amcSummary.active,

  expiringSoon:
    amcSummary.expiringSoon,

  critical:
    amcSummary.critical,

  expired:
    amcSummary.expired,

  totalValue:
    amcSummary.totalValue,

  outstanding:
    amcSummary.outstanding,

  overdueAmount:
    amcSummary.overdueAmount,
},

collections: {
  invoiceCount:
    collectionSummary.invoiceCount,

  totalBilled:
    collectionSummary.totalBilled,

  collected:
    collectionSummary.collected,

  outstanding:
    collectionSummary.outstanding,

  overdueInvoices:
    collectionSummary.overdueInvoices,

  overdueAmount:
    collectionSummary.overdueAmount,

  paidInvoices:
    collectionSummary.paidInvoices,

  partialInvoices:
    collectionSummary.partialInvoices,
},

                    employeeWorkload,

clientAttention,

amcAttention,

collectionAttention,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/* =========================================================
   CLIENT SUMMARY REPORT
========================================================= */

router.get(
    "/clients",
    async (req, res, next) => {
        try {
            const Client =
                getModel("Client");

            const SupportTicket =
                getModel("SupportTicket");

            const Task =
                getModel("Task");

            const {
                search = "",
                status = "All",
                employeeId = "",
            } = req.query;

            const query = {
                isDeleted: {
                    $ne: true,
                },
            };

            if (
                status &&
                status !== "All"
            ) {
                query.status =
                    status;
            }

            if (
                employeeId &&
                mongoose.Types.ObjectId.isValid(
                    employeeId
                )
            ) {
                query.assignedEmployeeId =
                    employeeId;
            }

            if (search.trim()) {
                const regex =
                    new RegExp(
                        escapeRegex(
                            search.trim()
                        ),
                        "i"
                    );

                query.$or = [
                    {
                        clientCode:
                            regex,
                    },
                    {
                        companyName:
                            regex,
                    },
                    {
                        contactPerson:
                            regex,
                    },
                    {
                        mobile:
                            regex,
                    },
                    {
                        city:
                            regex,
                    },
                    {
                        assignedEmployeeName:
                            regex,
                    },
                ];
            }

            const clients =
                await Client.find(query)
                    .select({
                        clientCode: 1,
                        companyName: 1,
                        contactPerson: 1,
                        mobile: 1,
                        email: 1,
                        city: 1,
                        state: 1,
                        products: 1,
                        amcStatus: 1,
                        nextRenewal: 1,
                        assignedEmployeeId: 1,
                        assignedEmployeeCode: 1,
                        assignedEmployeeName: 1,
                        status: 1,
                        createdAt: 1,
                    })
                    .sort({
                        companyName: 1,
                    })
                    .lean();

            const clientIds =
                clients.map(
                    (client) =>
                        client._id
                );

            const [
                ticketStats,
                taskStats,
            ] =
                clientIds.length
                    ? await Promise.all([
                        SupportTicket.aggregate([
                            {
                                $match: {
                                    clientId: {
                                        $in:
                                            clientIds,
                                    },

                                    isDeleted: {
                                        $ne: true,
                                    },
                                },
                            },

                            {
                                $group: {
                                    _id:
                                        "$clientId",

                                    totalTickets: {
                                        $sum: 1,
                                    },

                                    openTickets: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $in: [
                                                        "$status",
                                                        ACTIVE_TICKET_STATUSES,
                                                    ],
                                                },
                                                1,
                                                0,
                                            ],
                                        },
                                    },

                                    closedTickets: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $in: [
                                                        "$status",
                                                        CLOSED_TICKET_STATUSES,
                                                    ],
                                                },
                                                1,
                                                0,
                                            ],
                                        },
                                    },
                                },
                            },
                        ]),

                        Task.aggregate([
                            {
                                $match: {
                                    clientId: {
                                        $in:
                                            clientIds,
                                    },

                                    isDeleted: {
                                        $ne: true,
                                    },
                                },
                            },

                            {
                                $group: {
                                    _id:
                                        "$clientId",

                                    totalTasks: {
                                        $sum: 1,
                                    },

                                    pendingTasks: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $in: [
                                                        "$status",
                                                        FINISHED_TASK_STATUSES,
                                                    ],
                                                },
                                                0,
                                                1,
                                            ],
                                        },
                                    },
                                },
                            },
                        ]),
                    ])
                    : [[], []];

            const ticketMap =
                new Map(
                    ticketStats.map(
                        (item) => [
                            String(item._id),
                            item,
                        ]
                    )
                );

            const taskMap =
                new Map(
                    taskStats.map(
                        (item) => [
                            String(item._id),
                            item,
                        ]
                    )
                );

            const data =
                clients.map(
                    (client) => {
                        const ticket =
                            ticketMap.get(
                                String(
                                    client._id
                                )
                            ) || {};

                        const task =
                            taskMap.get(
                                String(
                                    client._id
                                )
                            ) || {};

                        return {
                            id:
                                client._id,

                            clientCode:
                                client.clientCode,

                            companyName:
                                client.companyName,

                            contactPerson:
                                client.contactPerson,

                            mobile:
                                client.mobile,

                            email:
                                client.email,

                            city:
                                client.city,

                            state:
                                client.state,

                            status:
                                client.status,

                            amcStatus:
                                client.amcStatus,

                            nextRenewal:
                                client.nextRenewal,

                            assignedEmployeeId:
                                client.assignedEmployeeId,

                            assignedEmployeeCode:
                                client.assignedEmployeeCode,

                            assignedEmployeeName:
                                client.assignedEmployeeName,

                            productCount:
                                Array.isArray(
                                    client.products
                                )
                                    ? client.products.length
                                    : 0,

                            products:
                                (
                                    client.products ||
                                    []
                                ).map(
                                    (product) => ({
                                        productCode:
                                            product.productCode,

                                        productName:
                                            product.productName,

                                        version:
                                            product.version,

                                        amcStatus:
                                            product.amcStatus,

                                        expiryDate:
                                            product.expiryDate,

                                        installationStatus:
                                            product.installationStatus,
                                    })
                                ),

                            totalTickets:
                                Number(
                                    ticket.totalTickets ||
                                    0
                                ),

                            openTickets:
                                Number(
                                    ticket.openTickets ||
                                    0
                                ),

                            closedTickets:
                                Number(
                                    ticket.closedTickets ||
                                    0
                                ),

                            totalTasks:
                                Number(
                                    task.totalTasks ||
                                    0
                                ),

                            pendingTasks:
                                Number(
                                    task.pendingTasks ||
                                    0
                                ),
                        };
                    }
                );

            return res.json({
                success: true,
                count:
                    data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);

/* =========================================================
   CLIENT AMC REPORT
   GET /api/reports/clients/amc

   READ ONLY

   Filters:
   - clientId
   - productId
   - status
   - fromDate
   - toDate
   - search
========================================================= */

router.get(
    "/clients/amc",
    async (req, res, next) => {
        try {
            const AmcInvoice =
                getModel("AmcInvoice");

            const AmcContract =
                getOptionalModel(
                    "AmcContract"
                );

            const {
                clientId = "",
                productId = "",
                status = "All",
                fromDate = "",
                toDate = "",
                search = "",
            } = req.query;

            const query = {
                isDeleted: {
                    $ne: true,
                },
            };

            /*
             * Client filter
             */
            if (
                clientId &&
                mongoose.Types.ObjectId.isValid(
                    clientId
                )
            ) {
                query.clientId =
                    new mongoose.Types.ObjectId(
                        clientId
                    );
            }

            /*
             * Product filter
             */
            if (
                productId &&
                mongoose.Types.ObjectId.isValid(
                    productId
                )
            ) {
                query.productId =
                    new mongoose.Types.ObjectId(
                        productId
                    );
            }

            /*
             * Invoice Date Filter
             */
            if (
                fromDate ||
                toDate
            ) {
                query.invoiceDate = {};

                if (fromDate) {
                    const from =
                        new Date(
                            `${fromDate}T00:00:00+05:30`
                        );

                    if (
                        !Number.isNaN(
                            from.getTime()
                        )
                    ) {
                        query.invoiceDate.$gte =
                            from;
                    }
                }

                if (toDate) {
                    const to =
                        new Date(
                            `${toDate}T23:59:59.999+05:30`
                        );

                    if (
                        !Number.isNaN(
                            to.getTime()
                        )
                    ) {
                        query.invoiceDate.$lte =
                            to;
                    }
                }
            }

            /*
             * Search
             */
            const normalizedSearch =
                String(
                    search || ""
                ).trim();

            if (normalizedSearch) {
                const regex =
                    new RegExp(
                        escapeRegex(
                            normalizedSearch
                        ),
                        "i"
                    );

                query.$or = [
                    {
                        invoiceCode:
                            regex,
                    },
                    {
                        contractCode:
                            regex,
                    },
                    {
                        clientCode:
                            regex,
                    },
                    {
                        clientName:
                            regex,
                    },
                    {
                        contactPerson:
                            regex,
                    },
                    {
                        contactMobile:
                            regex,
                    },
                    {
                        productCode:
                            regex,
                    },
                    {
                        productName:
                            regex,
                    },
                ];
            }

            /*
             * Load permanent invoices.
             *
             * Do NOT calculate money from contract.
             * AmcInvoice is financial source of truth.
             */
            const invoices =
                await AmcInvoice.find(
                    query
                )
                    .select({
                        invoiceCode: 1,
                        invoiceNumber: 1,
                        invoiceDate: 1,
                        invoiceType: 1,

                        amcContractId: 1,
                        contractCode: 1,

                        contractStartDate: 1,
                        contractExpiryDate: 1,
                        dueDate: 1,

                        clientId: 1,
                        clientCode: 1,
                        clientName: 1,
                        contactPerson: 1,
                        contactMobile: 1,
                        contactEmail: 1,

                        productId: 1,
                        productCode: 1,
                        productName: 1,
                        productVersion: 1,

                        plan: 1,
                        licensedUsers: 1,

                        taxableAmount: 1,

                        cgstRate: 1,
                        cgstAmount: 1,

                        sgstRate: 1,
                        sgstAmount: 1,

                        igstRate: 1,
                        igstAmount: 1,

                        totalTaxAmount: 1,
                        totalAmount: 1,

                        paidAmount: 1,
                        pendingAmount: 1,

                        paymentStatus: 1,
                        status: 1,

                        createdAt: 1,
                        updatedAt: 1,
                    })
                    .sort({
                        invoiceDate: -1,
                        createdAt: -1,
                    })
                    .lean();

            /*
             * Optional contract lookup.
             * Used only for overall AMC status and
             * assigned employee information.
             */
            let contractMap =
                new Map();

            if (
                AmcContract &&
                invoices.length > 0
            ) {
                const contractIds =
                    invoices
                        .map(
                            (invoice) =>
                                invoice.amcContractId
                        )
                        .filter(Boolean);

                const contracts =
                    await AmcContract.find({
                        _id: {
                            $in:
                                contractIds,
                        },

                        isDeleted: {
                            $ne: true,
                        },
                    })
                        .select({
                            contractCode: 1,
                            status: 1,

                            assignedEmployeeId: 1,
                            assignedEmployeeCode: 1,
                            assignedEmployeeName: 1,

                            reminderStatus: 1,
                            lastReminderAt: 1,
                            nextFollowUpDate: 1,
                        })
                        .lean();

                contractMap =
                    new Map(
                        contracts.map(
                            (contract) => [
                                String(
                                    contract._id
                                ),
                                contract,
                            ]
                        )
                    );
            }

            const now =
                new Date();

            let data =
                invoices.map(
                    (invoice) => {
                        const contract =
                            contractMap.get(
                                String(
                                    invoice.amcContractId ||
                                    ""
                                )
                            ) || null;

                        const totalAmount =
                            Number(
                                invoice.totalAmount ||
                                0
                            );

                        const paidAmount =
                            Number(
                                invoice.paidAmount ||
                                0
                            );

                        const pendingAmount =
                            Number(
                                invoice.pendingAmount ||
                                0
                            );

                        const dueDate =
                            invoice.dueDate
                                ? new Date(
                                    invoice.dueDate
                                )
                                : null;

                        const isOverdue =
                            Boolean(
                                pendingAmount > 0 &&
                                dueDate &&
                                !Number.isNaN(
                                    dueDate.getTime()
                                ) &&
                                dueDate.getTime() <
                                now.getTime()
                            );

                        const overdueDays =
                            isOverdue
                                ? Math.max(
                                    0,
                                    Math.floor(
                                        (
                                            now.getTime() -
                                            dueDate.getTime()
                                        ) /
                                        86400000
                                    )
                                )
                                : 0;

                        let reportStatus =
                            invoice.paymentStatus ||
                            "Pending";

                        if (isOverdue) {
                            reportStatus =
                                "Overdue";
                        } else if (
                            pendingAmount <= 0 &&
                            totalAmount > 0
                        ) {
                            reportStatus =
                                "Paid";
                        } else if (
                            paidAmount > 0 &&
                            pendingAmount > 0
                        ) {
                            reportStatus =
                                "Partially Paid";
                        } else if (
                            pendingAmount > 0
                        ) {
                            reportStatus =
                                "Pending";
                        }

                        return {
                            id:
                                invoice._id,

                            invoiceCode:
                                invoice.invoiceCode,

                            invoiceNumber:
                                invoice.invoiceNumber,

                            invoiceDate:
                                invoice.invoiceDate,

                            invoiceType:
                                invoice.invoiceType,

                            amcContractId:
                                invoice.amcContractId,

                            contractCode:
                                invoice.contractCode,

                            contractStartDate:
                                invoice.contractStartDate,

                            contractExpiryDate:
                                invoice.contractExpiryDate,

                            dueDate:
                                invoice.dueDate,

                            clientId:
                                invoice.clientId,

                            clientCode:
                                invoice.clientCode,

                            clientName:
                                invoice.clientName,

                            contactPerson:
                                invoice.contactPerson,

                            contactMobile:
                                invoice.contactMobile,

                            contactEmail:
                                invoice.contactEmail,

                            productId:
                                invoice.productId,

                            productCode:
                                invoice.productCode,

                            productName:
                                invoice.productName,

                            productVersion:
                                invoice.productVersion,

                            plan:
                                invoice.plan,

                            licensedUsers:
                                Number(
                                    invoice.licensedUsers ||
                                    0
                                ),

                            taxableAmount:
                                Number(
                                    invoice.taxableAmount ||
                                    0
                                ),

                            cgstRate:
                                Number(
                                    invoice.cgstRate ||
                                    0
                                ),

                            cgstAmount:
                                Number(
                                    invoice.cgstAmount ||
                                    0
                                ),

                            sgstRate:
                                Number(
                                    invoice.sgstRate ||
                                    0
                                ),

                            sgstAmount:
                                Number(
                                    invoice.sgstAmount ||
                                    0
                                ),

                            igstRate:
                                Number(
                                    invoice.igstRate ||
                                    0
                                ),

                            igstAmount:
                                Number(
                                    invoice.igstAmount ||
                                    0
                                ),

                            totalTaxAmount:
                                Number(
                                    invoice.totalTaxAmount ||
                                    0
                                ),

                            totalAmount,

                            paidAmount,

                            pendingAmount,

                            paymentStatus:
                                invoice.paymentStatus,

                            invoiceStatus:
                                invoice.status,

                            /*
                             * Derived report status:
                             * Paid
                             * Pending
                             * Partially Paid
                             * Overdue
                             */
                            reportStatus,

                            isOverdue,

                            overdueDays,

                            contractStatus:
                                contract?.status ||
                                "",

                            assignedEmployeeId:
                                contract
                                    ?.assignedEmployeeId ||
                                null,

                            assignedEmployeeCode:
                                contract
                                    ?.assignedEmployeeCode ||
                                "",

                            assignedEmployeeName:
                                contract
                                    ?.assignedEmployeeName ||
                                "",

                            reminderStatus:
                                contract
                                    ?.reminderStatus ||
                                "",

                            lastReminderAt:
                                contract
                                    ?.lastReminderAt ||
                                null,

                            nextFollowUpDate:
                                contract
                                    ?.nextFollowUpDate ||
                                null,
                        };
                    }
                );

            /*
             * Report status filter.
             *
             * We apply this after deriving Overdue,
             * because Overdue depends on today's date.
             */
            if (
                status &&
                status !== "All"
            ) {
                data =
                    data.filter(
                        (item) =>
                            item.reportStatus ===
                            status
                    );
            }

            /*
             * Summary is based on filtered report rows.
             */
            const summary =
                data.reduce(
                    (
                        result,
                        item
                    ) => {
                        result.totalInvoices +=
                            1;

                        result.totalAmount +=
                            Number(
                                item.totalAmount ||
                                0
                            );

                        result.paidAmount +=
                            Number(
                                item.paidAmount ||
                                0
                            );

                        result.pendingAmount +=
                            Number(
                                item.pendingAmount ||
                                0
                            );

                        if (
                            item.reportStatus ===
                            "Paid"
                        ) {
                            result.paidCount +=
                                1;
                        }

                        if (
                            item.reportStatus ===
                            "Pending"
                        ) {
                            result.pendingCount +=
                                1;
                        }

                        if (
                            item.reportStatus ===
                            "Partially Paid"
                        ) {
                            result.partiallyPaidCount +=
                                1;
                        }

                        if (
                            item.reportStatus ===
                            "Overdue"
                        ) {
                            result.overdueCount +=
                                1;

                            result.overdueAmount +=
                                Number(
                                    item.pendingAmount ||
                                    0
                                );
                        }

                        return result;
                    },
                    {
                        totalInvoices: 0,

                        totalAmount: 0,
                        paidAmount: 0,
                        pendingAmount: 0,

                        paidCount: 0,
                        pendingCount: 0,
                        partiallyPaidCount: 0,
                        overdueCount: 0,

                        overdueAmount: 0,
                    }
                );

            return res.json({
                success: true,

                summary,

                count:
                    data.length,

                data,
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   CLIENT PAYMENT REPORT
   GET /api/reports/clients/payments

   READ ONLY

   Filters:
   - clientId
   - productId
   - mode
   - fromDate
   - toDate
   - search
========================================================= */

router.get(
    "/clients/payments",
    async (req, res, next) => {
        try {
            const AmcPayment =
                getModel("AmcPayment");

            const {
                clientId = "",
                productId = "",
                mode = "All",
                fromDate = "",
                toDate = "",
                search = "",
            } = req.query;

            const query = {
                isDeleted: {
                    $ne: true,
                },
            };

            /*
             * Client
             */
            if (
                clientId &&
                mongoose.Types.ObjectId.isValid(
                    clientId
                )
            ) {
                query.clientId =
                    new mongoose.Types.ObjectId(
                        clientId
                    );
            }

            /*
             * Product
             */
            if (
                productId &&
                mongoose.Types.ObjectId.isValid(
                    productId
                )
            ) {
                query.productId =
                    new mongoose.Types.ObjectId(
                        productId
                    );
            }

            /*
             * Payment Mode
             */
            if (
                mode &&
                mode !== "All"
            ) {
                query.mode =
                    mode;
            }

            /*
             * Payment Date
             */
            if (
                fromDate ||
                toDate
            ) {
                query.paymentDate =
                    {};

                if (fromDate) {
                    const from =
                        new Date(
                            `${fromDate}T00:00:00+05:30`
                        );

                    if (
                        !Number.isNaN(
                            from.getTime()
                        )
                    ) {
                        query.paymentDate.$gte =
                            from;
                    }
                }

                if (toDate) {
                    const to =
                        new Date(
                            `${toDate}T23:59:59.999+05:30`
                        );

                    if (
                        !Number.isNaN(
                            to.getTime()
                        )
                    ) {
                        query.paymentDate.$lte =
                            to;
                    }
                }
            }

            /*
             * Search
             */
            const normalizedSearch =
                String(
                    search || ""
                ).trim();

            if (normalizedSearch) {
                const regex =
                    new RegExp(
                        escapeRegex(
                            normalizedSearch
                        ),
                        "i"
                    );

                query.$or = [
                    {
                        paymentCode:
                            regex,
                    },
                    {
                        contractCode:
                            regex,
                    },
                    {
                        invoiceCode:
                            regex,
                    },
                    {
                        clientCode:
                            regex,
                    },
                    {
                        clientName:
                            regex,
                    },
                    {
                        productCode:
                            regex,
                    },
                    {
                        productName:
                            regex,
                    },
                    {
                        referenceNo:
                            regex,
                    },
                    {
                        receivedByName:
                            regex,
                    },
                ];
            }

            const payments =
                await AmcPayment.find(
                    query
                )
                    .select({
                        paymentCode: 1,

                        amcContractId: 1,
                        amcInvoiceId: 1,

                        contractCode: 1,
                        invoiceCode: 1,

                        clientId: 1,
                        clientCode: 1,
                        clientName: 1,

                        productId: 1,
                        productCode: 1,
                        productName: 1,

                        amount: 1,
                        paymentDate: 1,

                        mode: 1,
                        referenceNo: 1,

                        notes: 1,

                        receivedBy: 1,
                        receivedByName: 1,

                        createdAt: 1,
                    })
                    .sort({
                        paymentDate: -1,
                        createdAt: -1,
                    })
                    .lean();

            const data =
                payments.map(
                    (payment) => ({
                        id:
                            payment._id,

                        paymentCode:
                            payment.paymentCode,

                        amcContractId:
                            payment.amcContractId,

                        amcInvoiceId:
                            payment.amcInvoiceId,

                        contractCode:
                            payment.contractCode,

                        invoiceCode:
                            payment.invoiceCode,

                        clientId:
                            payment.clientId,

                        clientCode:
                            payment.clientCode,

                        clientName:
                            payment.clientName,

                        productId:
                            payment.productId,

                        productCode:
                            payment.productCode,

                        productName:
                            payment.productName,

                        amount:
                            Number(
                                payment.amount ||
                                0
                            ),

                        paymentDate:
                            payment.paymentDate,

                        mode:
                            payment.mode,

                        referenceNo:
                            payment.referenceNo,

                        notes:
                            payment.notes,

                        receivedBy:
                            payment.receivedBy,

                        receivedByName:
                            payment.receivedByName,

                        createdAt:
                            payment.createdAt,
                    })
                );

            /*
             * Payment mode summary
             */
            const summary =
                data.reduce(
                    (
                        result,
                        payment
                    ) => {
                        const amount =
                            Number(
                                payment.amount ||
                                0
                            );

                        result.paymentCount +=
                            1;

                        result.totalReceived +=
                            amount;

                        if (
                            payment.mode ===
                            "Cash"
                        ) {
                            result.cash +=
                                amount;
                        }

                        if (
                            payment.mode ===
                            "Bank Transfer"
                        ) {
                            result.bankTransfer +=
                                amount;
                        }

                        if (
                            payment.mode ===
                            "UPI"
                        ) {
                            result.upi +=
                                amount;
                        }

                        if (
                            payment.mode ===
                            "Cheque"
                        ) {
                            result.cheque +=
                                amount;
                        }

                        if (
                            payment.mode ===
                            "Card"
                        ) {
                            result.card +=
                                amount;
                        }

                        if (
                            payment.mode ===
                            "Other"
                        ) {
                            result.other +=
                                amount;
                        }

                        return result;
                    },
                    {
                        paymentCount: 0,

                        totalReceived: 0,

                        cash: 0,
                        bankTransfer: 0,
                        upi: 0,
                        cheque: 0,
                        card: 0,
                        other: 0,
                    }
                );

            return res.json({
                success: true,

                summary,

                count:
                    data.length,

                data,
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   CLIENT OUTSTANDING REPORT
   GET /api/reports/clients/outstanding

   READ ONLY

   Outstanding comes directly from:
   AmcInvoice.pendingAmount

   Filters:
   - clientId
   - productId
   - overdueOnly
   - fromDate
   - toDate
   - search
========================================================= */

router.get(
    "/clients/outstanding",
    async (req, res, next) => {
        try {
            const AmcInvoice =
                getModel("AmcInvoice");

            const {
                clientId = "",
                productId = "",
                overdueOnly = "false",
                fromDate = "",
                toDate = "",
                search = "",
            } = req.query;

            const query = {
                isDeleted: {
                    $ne: true,
                },

                /*
                 * Only invoices with balance.
                 */
                pendingAmount: {
                    $gt: 0,
                },
            };

            /*
             * Client
             */
            if (
                clientId &&
                mongoose.Types.ObjectId.isValid(
                    clientId
                )
            ) {
                query.clientId =
                    new mongoose.Types.ObjectId(
                        clientId
                    );
            }

            /*
             * Product
             */
            if (
                productId &&
                mongoose.Types.ObjectId.isValid(
                    productId
                )
            ) {
                query.productId =
                    new mongoose.Types.ObjectId(
                        productId
                    );
            }

            /*
             * Invoice Date
             */
            if (
                fromDate ||
                toDate
            ) {
                query.invoiceDate =
                    {};

                if (fromDate) {
                    const from =
                        new Date(
                            `${fromDate}T00:00:00+05:30`
                        );

                    if (
                        !Number.isNaN(
                            from.getTime()
                        )
                    ) {
                        query.invoiceDate.$gte =
                            from;
                    }
                }

                if (toDate) {
                    const to =
                        new Date(
                            `${toDate}T23:59:59.999+05:30`
                        );

                    if (
                        !Number.isNaN(
                            to.getTime()
                        )
                    ) {
                        query.invoiceDate.$lte =
                            to;
                    }
                }
            }

            /*
             * Search
             */
            const normalizedSearch =
                String(
                    search || ""
                ).trim();

            if (normalizedSearch) {
                const regex =
                    new RegExp(
                        escapeRegex(
                            normalizedSearch
                        ),
                        "i"
                    );

                query.$or = [
                    {
                        invoiceCode:
                            regex,
                    },
                    {
                        contractCode:
                            regex,
                    },
                    {
                        clientCode:
                            regex,
                    },
                    {
                        clientName:
                            regex,
                    },
                    {
                        productCode:
                            regex,
                    },
                    {
                        productName:
                            regex,
                    },
                ];
            }

            const invoices =
                await AmcInvoice.find(
                    query
                )
                    .select({
                        invoiceCode: 1,
                        invoiceDate: 1,

                        amcContractId: 1,
                        contractCode: 1,

                        contractStartDate: 1,
                        contractExpiryDate: 1,
                        dueDate: 1,

                        clientId: 1,
                        clientCode: 1,
                        clientName: 1,
                        contactPerson: 1,
                        contactMobile: 1,

                        productId: 1,
                        productCode: 1,
                        productName: 1,
                        productVersion: 1,

                        plan: 1,

                        totalAmount: 1,
                        paidAmount: 1,
                        pendingAmount: 1,

                        paymentStatus: 1,
                        status: 1,

                        createdAt: 1,
                    })
                    .sort({
                        dueDate: 1,
                        invoiceDate: -1,
                    })
                    .lean();

            const now =
                new Date();

            let data =
                invoices.map(
                    (invoice) => {
                        const dueDate =
                            invoice.dueDate
                                ? new Date(
                                    invoice.dueDate
                                )
                                : null;

                        const isOverdue =
                            Boolean(
                                dueDate &&
                                !Number.isNaN(
                                    dueDate.getTime()
                                ) &&
                                dueDate.getTime() <
                                now.getTime()
                            );

                        const overdueDays =
                            isOverdue
                                ? Math.max(
                                    0,
                                    Math.floor(
                                        (
                                            now.getTime() -
                                            dueDate.getTime()
                                        ) /
                                        86400000
                                    )
                                )
                                : 0;

                        return {
                            id:
                                invoice._id,

                            invoiceCode:
                                invoice.invoiceCode,

                            invoiceDate:
                                invoice.invoiceDate,

                            amcContractId:
                                invoice.amcContractId,

                            contractCode:
                                invoice.contractCode,

                            contractStartDate:
                                invoice.contractStartDate,

                            contractExpiryDate:
                                invoice.contractExpiryDate,

                            dueDate:
                                invoice.dueDate,

                            clientId:
                                invoice.clientId,

                            clientCode:
                                invoice.clientCode,

                            clientName:
                                invoice.clientName,

                            contactPerson:
                                invoice.contactPerson,

                            contactMobile:
                                invoice.contactMobile,

                            productId:
                                invoice.productId,

                            productCode:
                                invoice.productCode,

                            productName:
                                invoice.productName,

                            productVersion:
                                invoice.productVersion,

                            plan:
                                invoice.plan,

                            totalAmount:
                                Number(
                                    invoice.totalAmount ||
                                    0
                                ),

                            paidAmount:
                                Number(
                                    invoice.paidAmount ||
                                    0
                                ),

                            pendingAmount:
                                Number(
                                    invoice.pendingAmount ||
                                    0
                                ),

                            paymentStatus:
                                invoice.paymentStatus,

                            invoiceStatus:
                                invoice.status,

                            isOverdue,

                            overdueDays,

                            outstandingStatus:
                                isOverdue
                                    ? "Overdue"
                                    : "Pending",
                        };
                    }
                );

            /*
             * Optional overdue-only filter.
             */
            if (
                String(
                    overdueOnly
                ).toLowerCase() ===
                "true"
            ) {
                data =
                    data.filter(
                        (item) =>
                            item.isOverdue
                    );
            }

            /*
             * Client-wise grouped outstanding summary.
             */
            const clientMap =
                new Map();

            for (
                const item of
                data
            ) {
                const key =
                    String(
                        item.clientId ||
                        item.clientCode ||
                        item.clientName
                    );

                if (
                    !clientMap.has(
                        key
                    )
                ) {
                    clientMap.set(
                        key,
                        {
                            clientId:
                                item.clientId,

                            clientCode:
                                item.clientCode,

                            clientName:
                                item.clientName,

                            invoiceCount:
                                0,

                            totalBilled:
                                0,

                            totalPaid:
                                0,

                            outstanding:
                                0,

                            overdueAmount:
                                0,

                            overdueInvoices:
                                0,
                        }
                    );
                }

                const client =
                    clientMap.get(key);

                client.invoiceCount +=
                    1;

                client.totalBilled +=
                    Number(
                        item.totalAmount ||
                        0
                    );

                client.totalPaid +=
                    Number(
                        item.paidAmount ||
                        0
                    );

                client.outstanding +=
                    Number(
                        item.pendingAmount ||
                        0
                    );

                if (
                    item.isOverdue
                ) {
                    client.overdueAmount +=
                        Number(
                            item.pendingAmount ||
                            0
                        );

                    client.overdueInvoices +=
                        1;
                }
            }

            const clientSummary =
                [
                    ...clientMap.values(),
                ].sort(
                    (a, b) =>
                        Number(
                            b.outstanding ||
                            0
                        ) -
                        Number(
                            a.outstanding ||
                            0
                        )
                );

            const summary =
                data.reduce(
                    (
                        result,
                        item
                    ) => {
                        result.invoiceCount +=
                            1;

                        result.totalBilled +=
                            Number(
                                item.totalAmount ||
                                0
                            );

                        result.totalPaid +=
                            Number(
                                item.paidAmount ||
                                0
                            );

                        result.totalOutstanding +=
                            Number(
                                item.pendingAmount ||
                                0
                            );

                        if (
                            item.isOverdue
                        ) {
                            result.overdueInvoices +=
                                1;

                            result.overdueAmount +=
                                Number(
                                    item.pendingAmount ||
                                    0
                                );
                        }

                        return result;
                    },
                    {
                        invoiceCount: 0,

                        totalBilled: 0,
                        totalPaid: 0,

                        totalOutstanding: 0,

                        overdueInvoices: 0,
                        overdueAmount: 0,
                    }
                );

            return res.json({
                success: true,

                summary,

                clientSummary,

                count:
                    data.length,

                data,
            });
        } catch (error) {
            next(error);
        }
    }
);
/* =========================================================
   CLIENT TICKET REPORT
   GET /api/reports/clients/tickets

   READ ONLY

   Filters:
   - clientId
   - employeeId
   - status
   - priority
   - fromDate
   - toDate
   - search
========================================================= */

router.get(
    "/clients/tickets",
    async (req, res, next) => {
        try {
            const SupportTicket =
                getModel("SupportTicket");

            const {
                clientId = "",
                employeeId = "",
                status = "All",
                priority = "All",
                fromDate = "",
                toDate = "",
                search = "",
            } = req.query;

            const query = {
                isDeleted: {
                    $ne: true,
                },
            };

            // Client filter
            if (
                clientId &&
                mongoose.Types.ObjectId.isValid(clientId)
            ) {
                query.clientId =
                    new mongoose.Types.ObjectId(clientId);
            }

            // Employee filter
            if (
                employeeId &&
                mongoose.Types.ObjectId.isValid(employeeId)
            ) {
                query.assignedEmployeeId =
                    new mongoose.Types.ObjectId(employeeId);
            }

            // Status filter
            if (
                status &&
                status !== "All"
            ) {
                query.status = status;
            }

            // Priority filter
            if (
                priority &&
                priority !== "All"
            ) {
                query.priority = priority;
            }

            // Created date range
            if (fromDate || toDate) {
                query.createdAt = {};

                if (fromDate) {
                    const from =
                        new Date(
                            `${fromDate}T00:00:00+05:30`
                        );

                    if (!Number.isNaN(from.getTime())) {
                        query.createdAt.$gte = from;
                    }
                }

                if (toDate) {
                    const to =
                        new Date(
                            `${toDate}T23:59:59.999+05:30`
                        );

                    if (!Number.isNaN(to.getTime())) {
                        query.createdAt.$lte = to;
                    }
                }
            }

            // Search
            const normalizedSearch =
                String(search || "").trim();

            if (normalizedSearch) {
                const regex =
                    new RegExp(
                        escapeRegex(normalizedSearch),
                        "i"
                    );

                query.$or = [
                    { ticketCode: regex },
                    { title: regex },
                    { description: regex },
                    { clientCode: regex },
                    { clientName: regex },
                    { productName: regex },
                    { module: regex },
                    { category: regex },
                    { assignedEmployeeCode: regex },
                    { assignedEmployeeName: regex },
                ];
            }

            const tickets =
                await SupportTicket.find(query)
                    .select({
                        ticketCode: 1,
                        title: 1,
                        description: 1,

                        clientId: 1,
                        clientCode: 1,
                        clientName: 1,

                        productId: 1,
                        productCode: 1,
                        productName: 1,

                        module: 1,
                        category: 1,
                        source: 1,

                        priority: 1,
                        status: 1,

                        assignedEmployeeId: 1,
                        assignedEmployeeCode: 1,
                        assignedEmployeeName: 1,

                        dueDate: 1,

                        spentMinutes: 1,

                        resolvedAt: 1,
                        closedAt: 1,

                        createdAt: 1,
                        updatedAt: 1,
                    })
                    .sort({
                        createdAt: -1,
                    })
                    .lean();

            const now = new Date();

            const data =
                tickets.map((ticket) => {
                    const dueDate =
                        ticket.dueDate
                            ? new Date(ticket.dueDate)
                            : null;

                    const createdAt =
                        ticket.createdAt
                            ? new Date(ticket.createdAt)
                            : null;

                    const isClosed =
                        CLOSED_TICKET_STATUSES.includes(
                            ticket.status
                        );

                    const isOverdue =
                        Boolean(
                            !isClosed &&
                            dueDate &&
                            !Number.isNaN(
                                dueDate.getTime()
                            ) &&
                            dueDate.getTime() <
                            now.getTime()
                        );

                    const overdueDays =
                        isOverdue
                            ? Math.max(
                                0,
                                Math.floor(
                                    (
                                        now.getTime() -
                                        dueDate.getTime()
                                    ) /
                                    86400000
                                )
                            )
                            : 0;

                    const ageDays =
                        createdAt &&
                            !Number.isNaN(
                                createdAt.getTime()
                            )
                            ? Math.max(
                                0,
                                Math.floor(
                                    (
                                        now.getTime() -
                                        createdAt.getTime()
                                    ) /
                                    86400000
                                )
                            )
                            : 0;

                    return {
                        id:
                            ticket._id,

                        ticketCode:
                            ticket.ticketCode,

                        title:
                            ticket.title,

                        description:
                            ticket.description,

                        clientId:
                            ticket.clientId,

                        clientCode:
                            ticket.clientCode,

                        clientName:
                            ticket.clientName,

                        productId:
                            ticket.productId,

                        productCode:
                            ticket.productCode,

                        productName:
                            ticket.productName,

                        module:
                            ticket.module,

                        category:
                            ticket.category,

                        source:
                            ticket.source,

                        priority:
                            ticket.priority,

                        status:
                            ticket.status,

                        assignedEmployeeId:
                            ticket.assignedEmployeeId,

                        assignedEmployeeCode:
                            ticket.assignedEmployeeCode,

                        assignedEmployeeName:
                            ticket.assignedEmployeeName,

                        createdAt:
                            ticket.createdAt,

                        dueDate:
                            ticket.dueDate,

                        resolvedAt:
                            ticket.resolvedAt,

                        closedAt:
                            ticket.closedAt,

                        spentMinutes:
                            Number(
                                ticket.spentMinutes || 0
                            ),

                        ageDays,

                        isClosed,

                        isOverdue,

                        overdueDays,
                    };
                });

            const summary =
                data.reduce(
                    (result, ticket) => {
                        result.totalTickets += 1;

                        if (
                            CLOSED_TICKET_STATUSES.includes(
                                ticket.status
                            )
                        ) {
                            result.resolvedTickets += 1;
                        } else {
                            result.openTickets += 1;
                        }

                        if (
                            ticket.status ===
                            "In Progress"
                        ) {
                            result.inProgressTickets += 1;
                        }

                        if (ticket.isOverdue) {
                            result.overdueTickets += 1;
                        }

                        if (
                            ["High", "Critical", "Urgent"].includes(
                                ticket.priority
                            )
                        ) {
                            result.highPriorityTickets += 1;
                        }

                        result.totalSpentMinutes +=
                            Number(
                                ticket.spentMinutes || 0
                            );

                        return result;
                    },
                    {
                        totalTickets: 0,
                        openTickets: 0,
                        inProgressTickets: 0,
                        resolvedTickets: 0,
                        overdueTickets: 0,
                        highPriorityTickets: 0,
                        totalSpentMinutes: 0,
                    }
                );

            return res.json({
                success: true,
                summary,
                count: data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   CLIENT WORK / TASK REPORT
   GET /api/reports/clients/work

   READ ONLY

   Filters:
   - clientId
   - employeeId
   - status
   - priority
   - fromDate
   - toDate
   - search
========================================================= */

router.get(
    "/clients/work",
    async (req, res, next) => {
        try {
            const Task =
                getModel("Task");

            const {
                clientId = "",
                employeeId = "",
                status = "All",
                priority = "All",
                fromDate = "",
                toDate = "",
                search = "",
            } = req.query;

            const query = {
                isDeleted: {
                    $ne: true,
                },
            };

            // Client filter
            if (
                clientId &&
                mongoose.Types.ObjectId.isValid(clientId)
            ) {
                query.clientId =
                    new mongoose.Types.ObjectId(clientId);
            }

            // Employee filter
            if (
                employeeId &&
                mongoose.Types.ObjectId.isValid(employeeId)
            ) {
                query.assignedEmployeeId =
                    new mongoose.Types.ObjectId(employeeId);
            }

            // Status filter
            if (
                status &&
                status !== "All"
            ) {
                query.status = status;
            }

            // Priority filter
            if (
                priority &&
                priority !== "All"
            ) {
                query.priority = priority;
            }

            // Created date filter
            if (fromDate || toDate) {
                query.createdAt = {};

                if (fromDate) {
                    const from =
                        new Date(
                            `${fromDate}T00:00:00+05:30`
                        );

                    if (!Number.isNaN(from.getTime())) {
                        query.createdAt.$gte = from;
                    }
                }

                if (toDate) {
                    const to =
                        new Date(
                            `${toDate}T23:59:59.999+05:30`
                        );

                    if (!Number.isNaN(to.getTime())) {
                        query.createdAt.$lte = to;
                    }
                }
            }

            // Search
            const normalizedSearch =
                String(search || "").trim();

            if (normalizedSearch) {
                const regex =
                    new RegExp(
                        escapeRegex(normalizedSearch),
                        "i"
                    );

                query.$or = [
                    { taskCode: regex },
                    { title: regex },
                    { description: regex },
                    { clientName: regex },
                    { productName: regex },
                    { projectName: regex },
                    { assignedEmployeeCode: regex },
                    { assignedEmployeeName: regex },
                ];
            }

            const tasks =
                await Task.find(query)
                    .select({
                        taskCode: 1,
                        title: 1,
                        description: 1,

                        clientId: 1,
                        clientCode: 1,
                        clientName: 1,

                        productId: 1,
                        productCode: 1,
                        productName: 1,

                        projectId: 1,
                        projectCode: 1,
                        projectName: 1,

                        assignedEmployeeId: 1,
                        assignedEmployeeCode: 1,
                        assignedEmployeeName: 1,

                        priority: 1,
                        status: 1,
                        progress: 1,

                        startDate: 1,
                        dueDate: 1,
                        completedAt: 1,

                        estimatedMinutes: 1,
                        spentMinutes: 1,

                        createdAt: 1,
                        updatedAt: 1,
                    })
                    .sort({
                        createdAt: -1,
                    })
                    .lean();

            const now = new Date();

            const data =
                tasks.map((task) => {
                    const dueDate =
                        task.dueDate
                            ? new Date(task.dueDate)
                            : null;

                    const isFinished =
                        FINISHED_TASK_STATUSES.includes(
                            task.status
                        );

                    const isOverdue =
                        Boolean(
                            !isFinished &&
                            dueDate &&
                            !Number.isNaN(
                                dueDate.getTime()
                            ) &&
                            dueDate.getTime() <
                            now.getTime()
                        );

                    const overdueDays =
                        isOverdue
                            ? Math.max(
                                0,
                                Math.floor(
                                    (
                                        now.getTime() -
                                        dueDate.getTime()
                                    ) /
                                    86400000
                                )
                            )
                            : 0;

                    return {
                        id:
                            task._id,

                        taskCode:
                            task.taskCode,

                        title:
                            task.title,

                        description:
                            task.description,

                        clientId:
                            task.clientId,

                        clientCode:
                            task.clientCode,

                        clientName:
                            task.clientName,

                        productId:
                            task.productId,

                        productCode:
                            task.productCode,

                        productName:
                            task.productName,

                        projectId:
                            task.projectId,

                        projectCode:
                            task.projectCode,

                        projectName:
                            task.projectName,

                        assignedEmployeeId:
                            task.assignedEmployeeId,

                        assignedEmployeeCode:
                            task.assignedEmployeeCode,

                        assignedEmployeeName:
                            task.assignedEmployeeName,

                        priority:
                            task.priority,

                        status:
                            task.status,

                        progress:
                            Number(
                                task.progress || 0
                            ),

                        startDate:
                            task.startDate,

                        dueDate:
                            task.dueDate,

                        completedAt:
                            task.completedAt,

                        estimatedMinutes:
                            Number(
                                task.estimatedMinutes || 0
                            ),

                        spentMinutes:
                            Number(
                                task.spentMinutes || 0
                            ),

                        isFinished,

                        isOverdue,

                        overdueDays,

                        createdAt:
                            task.createdAt,
                    };
                });

            const summary =
                data.reduce(
                    (result, task) => {
                        result.totalTasks += 1;

                        if (
                            FINISHED_TASK_STATUSES.includes(
                                task.status
                            )
                        ) {
                            result.completedTasks += 1;
                        } else {
                            result.pendingTasks += 1;
                        }

                        if (
                            task.status ===
                            "In Progress"
                        ) {
                            result.inProgressTasks += 1;
                        }

                        if (task.isOverdue) {
                            result.overdueTasks += 1;
                        }

                        if (
                            ["High", "Critical", "Urgent"].includes(
                                task.priority
                            )
                        ) {
                            result.highPriorityTasks += 1;
                        }

                        result.totalEstimatedMinutes +=
                            Number(
                                task.estimatedMinutes || 0
                            );

                        result.totalSpentMinutes +=
                            Number(
                                task.spentMinutes || 0
                            );

                        return result;
                    },
                    {
                        totalTasks: 0,
                        pendingTasks: 0,
                        inProgressTasks: 0,
                        completedTasks: 0,
                        overdueTasks: 0,
                        highPriorityTasks: 0,

                        totalEstimatedMinutes: 0,
                        totalSpentMinutes: 0,
                    }
                );

            return res.json({
                success: true,
                summary,
                count: data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);
/* =========================================================
   TEAM / EMPLOYEE PERFORMANCE REPORT
========================================================= */

router.get(
    "/team",
    async (req, res, next) => {
        try {
            const Employee =
                getModel("Employee");

            const Task =
                getModel("Task");

            const SupportTicket =
                getModel("SupportTicket");

            const Attendance =
                getOptionalModel(
                    "AttendanceV2"
                );

            const {
                employeeId = "",
                status = "All",
            } = req.query;

            const employeeQuery = {
                isActive: {
                    $ne: false,
                },
            };

            if (
                employeeId &&
                mongoose.Types.ObjectId.isValid(
                    employeeId
                )
            ) {
                employeeQuery._id =
                    employeeId;
            }

            if (
                status &&
                status !== "All"
            ) {
                employeeQuery.status =
                    status;
            }

            const employees =
                await Employee.find(
                    employeeQuery
                )
                    .select({
                        employeeCode: 1,
                        name: 1,
                        email: 1,
                        mobile: 1,
                        role: 1,
                        department: 1,
                        joiningDate: 1,
                        status: 1,
                        currentTask: 1,
                        currentTaskId: 1,
                        currentTaskCode: 1,
                        currentTaskTitle: 1,
                        currentClient: 1,
                        currentProject: 1,
                        currentTaskStartedAt: 1,
                        openTasks: 1,
                        completedToday: 1,
                        activeMinutes: 1,
                        lastActivityAt: 1,
                    })
                    .sort({
                        name: 1,
                    })
                    .lean();

            const employeeIds =
                employees.map(
                    (employee) =>
                        employee._id
                );

            if (
                employeeIds.length ===
                0
            ) {
                return res.json({
                    success: true,
                    count: 0,
                    data: [],
                });
            }

            const dateRange =
                getDateRange(req);

            const taskMatch = {
                assignedEmployeeId: {
                    $in:
                        employeeIds,
                },

                isDeleted: {
                    $ne: true,
                },
            };

            const ticketMatch = {
                assignedEmployeeId: {
                    $in:
                        employeeIds,
                },

                isDeleted: {
                    $ne: true,
                },
            };

            if (dateRange) {
                taskMatch.createdAt =
                    dateRange;

                ticketMatch.createdAt =
                    dateRange;
            }

            const [
                taskStats,
                ticketStats,
            ] = await Promise.all([
                Task.aggregate([
                    {
                        $match:
                            taskMatch,
                    },

                    {
                        $group: {
                            _id:
                                "$assignedEmployeeId",

                            totalTasks: {
                                $sum: 1,
                            },

                            completedTasks: {
                                $sum: {
                                    $cond: [
                                        {
                                            $in: [
                                                "$status",
                                                FINISHED_TASK_STATUSES,
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },

                            pendingTasks: {
                                $sum: {
                                    $cond: [
                                        {
                                            $in: [
                                                "$status",
                                                FINISHED_TASK_STATUSES,
                                            ],
                                        },
                                        0,
                                        1,
                                    ],
                                },
                            },

                            totalSpentMinutes: {
                                $sum: {
                                    $ifNull: [
                                        "$spentMinutes",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ]),

                SupportTicket.aggregate([
                    {
                        $match:
                            ticketMatch,
                    },

                    {
                        $group: {
                            _id:
                                "$assignedEmployeeId",

                            totalTickets: {
                                $sum: 1,
                            },

                            resolvedTickets: {
                                $sum: {
                                    $cond: [
                                        {
                                            $in: [
                                                "$status",
                                                CLOSED_TICKET_STATUSES,
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },

                            openTickets: {
                                $sum: {
                                    $cond: [
                                        {
                                            $in: [
                                                "$status",
                                                CLOSED_TICKET_STATUSES,
                                            ],
                                        },
                                        0,
                                        1,
                                    ],
                                },
                            },

                            ticketMinutes: {
                                $sum: {
                                    $ifNull: [
                                        "$spentMinutes",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ]),
            ]);

            let attendanceStats =
                [];

            if (Attendance) {
                const attendanceMatch = {
                    employeeId: {
                        $in:
                            employeeIds,
                    },

                    isDeleted: {
                        $ne: true,
                    },
                };

                const {
                    fromDate,
                    toDate,
                } = req.query;

                if (
                    fromDate ||
                    toDate
                ) {
                    attendanceMatch.date =
                        {};

                    if (fromDate) {
                        attendanceMatch.date.$gte =
                            fromDate;
                    }

                    if (toDate) {
                        attendanceMatch.date.$lte =
                            toDate;
                    }
                }

                attendanceStats =
                    await Attendance.aggregate([
                        {
                            $match:
                                attendanceMatch,
                        },

                        {
                            $group: {
                                _id:
                                    "$employeeId",

                                attendanceDays: {
                                    $sum: 1,
                                },

                                present: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $eq: [
                                                    "$status",
                                                    "Present",
                                                ],
                                            },
                                            1,
                                            0,
                                        ],
                                    },
                                },

                                late: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $eq: [
                                                    "$status",
                                                    "Late",
                                                ],
                                            },
                                            1,
                                            0,
                                        ],
                                    },
                                },

                                halfDay: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $eq: [
                                                    "$status",
                                                    "Half Day",
                                                ],
                                            },
                                            1,
                                            0,
                                        ],
                                    },
                                },

                                totalWorkedMinutes: {
                                    $sum: {
                                        $ifNull: [
                                            "$totalWorkedMinutes",
                                            0,
                                        ],
                                    },
                                },
                            },
                        },
                    ]);
            }

            const taskMap =
                new Map(
                    taskStats.map(
                        (item) => [
                            String(item._id),
                            item,
                        ]
                    )
                );

            const ticketMap =
                new Map(
                    ticketStats.map(
                        (item) => [
                            String(item._id),
                            item,
                        ]
                    )
                );

            const attendanceMap =
                new Map(
                    attendanceStats.map(
                        (item) => [
                            String(item._id),
                            item,
                        ]
                    )
                );

            const data =
                employees.map(
                    (employee) => {
                        const key =
                            String(
                                employee._id
                            );

                        const tasks =
                            taskMap.get(key) ||
                            {};

                        const tickets =
                            ticketMap.get(key) ||
                            {};

                        const attendance =
                            attendanceMap.get(
                                key
                            ) || {};

                        return {
                            id:
                                employee._id,

                            employeeCode:
                                employee.employeeCode,

                            name:
                                employee.name,

                            department:
                                employee.department,

                            role:
                                employee.role,

                            status:
                                employee.status,

                            currentTask:
                                employee.currentTask,

                            currentTaskCode:
                                employee.currentTaskCode,

                            currentTaskTitle:
                                employee.currentTaskTitle,

                            currentClient:
                                employee.currentClient,

                            currentProject:
                                employee.currentProject,

                            lastActivityAt:
                                employee.lastActivityAt,

                            totalTasks:
                                Number(
                                    tasks.totalTasks ||
                                    0
                                ),

                            completedTasks:
                                Number(
                                    tasks.completedTasks ||
                                    0
                                ),

                            pendingTasks:
                                Number(
                                    tasks.pendingTasks ||
                                    0
                                ),

                            totalTaskMinutes:
                                Number(
                                    tasks.totalSpentMinutes ||
                                    0
                                ),

                            totalTickets:
                                Number(
                                    tickets.totalTickets ||
                                    0
                                ),

                            resolvedTickets:
                                Number(
                                    tickets.resolvedTickets ||
                                    0
                                ),

                            openTickets:
                                Number(
                                    tickets.openTickets ||
                                    0
                                ),

                            ticketMinutes:
                                Number(
                                    tickets.ticketMinutes ||
                                    0
                                ),

                            attendanceDays:
                                Number(
                                    attendance.attendanceDays ||
                                    0
                                ),

                            present:
                                Number(
                                    attendance.present ||
                                    0
                                ),

                            late:
                                Number(
                                    attendance.late ||
                                    0
                                ),

                            halfDay:
                                Number(
                                    attendance.halfDay ||
                                    0
                                ),

                            totalWorkedMinutes:
                                Number(
                                    attendance.totalWorkedMinutes ||
                                    0
                                ),
                        };
                    }
                );

            return res.json({
                success: true,
                count:
                    data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);
/* =========================================================
   TEAM SUMMARY REPORT
   GET /api/reports/team/summary

   READ ONLY
========================================================= */

router.get(
    "/team/summary",
    async (req, res, next) => {
        try {
            const Employee =
                getModel("Employee");

            const Task =
                getModel("Task");

            const SupportTicket =
                getModel("SupportTicket");

            const now =
                new Date();

            const employees =
                await Employee.find({
                    isActive: {
                        $ne: false,
                    },
                })
                    .select({
                        employeeCode: 1,
                        name: 1,
                        department: 1,
                        role: 1,
                        status: 1,

                        currentTask: 1,
                        currentTaskCode: 1,
                        currentTaskTitle: 1,

                        currentClient: 1,
                        currentProject: 1,

                        activeMinutes: 1,
                        openTasks: 1,
                        completedToday: 1,
                        lastActivityAt: 1,
                    })
                    .sort({
                        name: 1,
                    })
                    .lean();

            const employeeIds =
                employees.map(
                    (employee) =>
                        employee._id
                );

            const [
                taskStats,
                ticketStats,
            ] =
                employeeIds.length
                    ? await Promise.all([
                        Task.aggregate([
                            {
                                $match: {
                                    assignedEmployeeId: {
                                        $in:
                                            employeeIds,
                                    },

                                    isDeleted: {
                                        $ne: true,
                                    },
                                },
                            },

                            {
                                $group: {
                                    _id:
                                        "$assignedEmployeeId",

                                    totalTasks: {
                                        $sum: 1,
                                    },

                                    activeTasks: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $in: [
                                                        "$status",
                                                        FINISHED_TASK_STATUSES,
                                                    ],
                                                },
                                                0,
                                                1,
                                            ],
                                        },
                                    },

                                    completedTasks: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $in: [
                                                        "$status",
                                                        FINISHED_TASK_STATUSES,
                                                    ],
                                                },
                                                1,
                                                0,
                                            ],
                                        },
                                    },

                                    overdueTasks: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        {
                                                            $not: {
                                                                $in: [
                                                                    "$status",
                                                                    FINISHED_TASK_STATUSES,
                                                                ],
                                                            },
                                                        },

                                                        {
                                                            $ne: [
                                                                "$dueDate",
                                                                null,
                                                            ],
                                                        },

                                                        {
                                                            $lt: [
                                                                "$dueDate",
                                                                now,
                                                            ],
                                                        },
                                                    ],
                                                },
                                                1,
                                                0,
                                            ],
                                        },
                                    },

                                    taskSpentMinutes: {
                                        $sum: {
                                            $ifNull: [
                                                "$spentMinutes",
                                                0,
                                            ],
                                        },
                                    },
                                },
                            },
                        ]),

                        SupportTicket.aggregate([
                            {
                                $match: {
                                    assignedEmployeeId: {
                                        $in:
                                            employeeIds,
                                    },

                                    isDeleted: {
                                        $ne: true,
                                    },
                                },
                            },

                            {
                                $group: {
                                    _id:
                                        "$assignedEmployeeId",

                                    totalTickets: {
                                        $sum: 1,
                                    },

                                    openTickets: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $in: [
                                                        "$status",
                                                        CLOSED_TICKET_STATUSES,
                                                    ],
                                                },
                                                0,
                                                1,
                                            ],
                                        },
                                    },

                                    resolvedTickets: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $in: [
                                                        "$status",
                                                        CLOSED_TICKET_STATUSES,
                                                    ],
                                                },
                                                1,
                                                0,
                                            ],
                                        },
                                    },

                                    overdueTickets: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        {
                                                            $not: {
                                                                $in: [
                                                                    "$status",
                                                                    CLOSED_TICKET_STATUSES,
                                                                ],
                                                            },
                                                        },

                                                        {
                                                            $ne: [
                                                                "$dueDate",
                                                                null,
                                                            ],
                                                        },

                                                        {
                                                            $lt: [
                                                                "$dueDate",
                                                                now,
                                                            ],
                                                        },
                                                    ],
                                                },
                                                1,
                                                0,
                                            ],
                                        },
                                    },

                                    ticketSpentMinutes: {
                                        $sum: {
                                            $ifNull: [
                                                "$spentMinutes",
                                                0,
                                            ],
                                        },
                                    },
                                },
                            },
                        ]),
                    ])
                    : [[], []];

            const taskMap =
                new Map(
                    taskStats.map(
                        (item) => [
                            String(item._id),
                            item,
                        ]
                    )
                );

            const ticketMap =
                new Map(
                    ticketStats.map(
                        (item) => [
                            String(item._id),
                            item,
                        ]
                    )
                );

            const data =
                employees.map(
                    (employee) => {
                        const key =
                            String(employee._id);

                        const tasks =
                            taskMap.get(key) || {};

                        const tickets =
                            ticketMap.get(key) || {};

                        return {
                            id:
                                employee._id,

                            employeeCode:
                                employee.employeeCode,

                            name:
                                employee.name,

                            department:
                                employee.department,

                            role:
                                employee.role,

                            status:
                                employee.status,

                            currentTask:
                                employee.currentTask,

                            currentTaskCode:
                                employee.currentTaskCode,

                            currentTaskTitle:
                                employee.currentTaskTitle,

                            currentClient:
                                employee.currentClient,

                            currentProject:
                                employee.currentProject,

                            activeMinutes:
                                Number(
                                    employee.activeMinutes ||
                                    0
                                ),

                            openTasks:
                                Number(
                                    employee.openTasks ||
                                    0
                                ),

                            completedToday:
                                Number(
                                    employee.completedToday ||
                                    0
                                ),

                            lastActivityAt:
                                employee.lastActivityAt,

                            totalTasks:
                                Number(
                                    tasks.totalTasks ||
                                    0
                                ),

                            activeTasks:
                                Number(
                                    tasks.activeTasks ||
                                    0
                                ),

                            completedTasks:
                                Number(
                                    tasks.completedTasks ||
                                    0
                                ),

                            overdueTasks:
                                Number(
                                    tasks.overdueTasks ||
                                    0
                                ),

                            totalTickets:
                                Number(
                                    tickets.totalTickets ||
                                    0
                                ),

                            openTickets:
                                Number(
                                    tickets.openTickets ||
                                    0
                                ),

                            resolvedTickets:
                                Number(
                                    tickets.resolvedTickets ||
                                    0
                                ),

                            overdueTickets:
                                Number(
                                    tickets.overdueTickets ||
                                    0
                                ),

                            taskSpentMinutes:
                                Number(
                                    tasks.taskSpentMinutes ||
                                    0
                                ),

                            ticketSpentMinutes:
                                Number(
                                    tickets.ticketSpentMinutes ||
                                    0
                                ),

                            totalWorkMinutes:
                                Number(
                                    tasks.taskSpentMinutes ||
                                    0
                                ) +
                                Number(
                                    tickets.ticketSpentMinutes ||
                                    0
                                ),
                        };
                    }
                );

            const summary =
                data.reduce(
                    (
                        result,
                        employee
                    ) => {
                        result.totalEmployees +=
                            1;

                        if (
                            employee.status ===
                            "Working"
                        ) {
                            result.working +=
                                1;
                        }

                        if (
                            employee.status ===
                            "Free"
                        ) {
                            result.free +=
                                1;
                        }

                        if (
                            employee.status ===
                            "Break"
                        ) {
                            result.break +=
                                1;
                        }

                        if (
                            employee.status ===
                            "Leave"
                        ) {
                            result.leave +=
                                1;
                        }

                        if (
                            employee.status ===
                            "Offline"
                        ) {
                            result.offline +=
                                1;
                        }

                        result.activeTasks +=
                            employee.activeTasks;

                        result.openTickets +=
                            employee.openTickets;

                        result.overdueWork +=
                            employee.overdueTasks +
                            employee.overdueTickets;

                        result.totalWorkMinutes +=
                            employee.totalWorkMinutes;

                        return result;
                    },
                    {
                        totalEmployees: 0,
                        working: 0,
                        free: 0,
                        break: 0,
                        leave: 0,
                        offline: 0,

                        activeTasks: 0,
                        openTickets: 0,
                        overdueWork: 0,

                        totalWorkMinutes: 0,
                    }
                );

            return res.json({
                success: true,
                summary,
                count:
                    data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   TEAM CLIENT-WISE WORK REPORT
   GET /api/reports/team/client-work

   READ ONLY

   Filters:
   - employeeId
   - clientId
   - fromDate
   - toDate
========================================================= */

router.get(
    "/team/client-work",
    async (req, res, next) => {
        try {
            const Task =
                getModel("Task");

            const SupportTicket =
                getModel("SupportTicket");

            const {
                employeeId = "",
                clientId = "",
                fromDate = "",
                toDate = "",
            } = req.query;

            const taskMatch = {
                isDeleted: {
                    $ne: true,
                },

                clientId: {
                    $ne: null,
                },
            };

            const ticketMatch = {
                isDeleted: {
                    $ne: true,
                },

                clientId: {
                    $ne: null,
                },
            };

            if (
                employeeId &&
                mongoose.Types.ObjectId.isValid(
                    employeeId
                )
            ) {
                const id =
                    new mongoose.Types.ObjectId(
                        employeeId
                    );

                taskMatch.assignedEmployeeId =
                    id;

                ticketMatch.assignedEmployeeId =
                    id;
            }

            if (
                clientId &&
                mongoose.Types.ObjectId.isValid(
                    clientId
                )
            ) {
                const id =
                    new mongoose.Types.ObjectId(
                        clientId
                    );

                taskMatch.clientId =
                    id;

                ticketMatch.clientId =
                    id;
            }

            if (
                fromDate ||
                toDate
            ) {
                taskMatch.createdAt =
                    {};

                ticketMatch.createdAt =
                    {};

                if (fromDate) {
                    const from =
                        new Date(
                            `${fromDate}T00:00:00+05:30`
                        );

                    if (
                        !Number.isNaN(
                            from.getTime()
                        )
                    ) {
                        taskMatch.createdAt.$gte =
                            from;

                        ticketMatch.createdAt.$gte =
                            from;
                    }
                }

                if (toDate) {
                    const to =
                        new Date(
                            `${toDate}T23:59:59.999+05:30`
                        );

                    if (
                        !Number.isNaN(
                            to.getTime()
                        )
                    ) {
                        taskMatch.createdAt.$lte =
                            to;

                        ticketMatch.createdAt.$lte =
                            to;
                    }
                }
            }

            const [
                taskGroups,
                ticketGroups,
            ] =
                await Promise.all([
                    Task.aggregate([
                        {
                            $match:
                                taskMatch,
                        },

                        {
                            $group: {
                                _id: {
                                    employeeId:
                                        "$assignedEmployeeId",

                                    employeeCode:
                                        "$assignedEmployeeCode",

                                    employeeName:
                                        "$assignedEmployeeName",

                                    clientId:
                                        "$clientId",

                                    clientCode:
                                        "$clientCode",

                                    clientName:
                                        "$clientName",
                                },

                                totalTasks: {
                                    $sum: 1,
                                },

                                completedTasks: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $in: [
                                                    "$status",
                                                    FINISHED_TASK_STATUSES,
                                                ],
                                            },
                                            1,
                                            0,
                                        ],
                                    },
                                },

                                pendingTasks: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $in: [
                                                    "$status",
                                                    FINISHED_TASK_STATUSES,
                                                ],
                                            },
                                            0,
                                            1,
                                        ],
                                    },
                                },

                                taskMinutes: {
                                    $sum: {
                                        $ifNull: [
                                            "$spentMinutes",
                                            0,
                                        ],
                                    },
                                },

                                lastWorkedAt: {
                                    $max:
                                        "$updatedAt",
                                },
                            },
                        },
                    ]),

                    SupportTicket.aggregate([
                        {
                            $match:
                                ticketMatch,
                        },

                        {
                            $group: {
                                _id: {
                                    employeeId:
                                        "$assignedEmployeeId",

                                    employeeCode:
                                        "$assignedEmployeeCode",

                                    employeeName:
                                        "$assignedEmployeeName",

                                    clientId:
                                        "$clientId",

                                    clientCode:
                                        "$clientCode",

                                    clientName:
                                        "$clientName",
                                },

                                totalTickets: {
                                    $sum: 1,
                                },

                                resolvedTickets: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $in: [
                                                    "$status",
                                                    CLOSED_TICKET_STATUSES,
                                                ],
                                            },
                                            1,
                                            0,
                                        ],
                                    },
                                },

                                openTickets: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $in: [
                                                    "$status",
                                                    CLOSED_TICKET_STATUSES,
                                                ],
                                            },
                                            0,
                                            1,
                                        ],
                                    },
                                },

                                ticketMinutes: {
                                    $sum: {
                                        $ifNull: [
                                            "$spentMinutes",
                                            0,
                                        ],
                                    },
                                },

                                lastWorkedAt: {
                                    $max:
                                        "$updatedAt",
                                },
                            },
                        },
                    ]),
                ]);

            const map =
                new Map();

            const keyFor = (
                item
            ) =>
                `${String(
                    item._id
                        .employeeId ||
                    ""
                )}:${String(
                    item._id
                        .clientId ||
                    ""
                )}`;

            for (
                const item of
                taskGroups
            ) {
                const key =
                    keyFor(item);

                map.set(
                    key,
                    {
                        employeeId:
                            item._id
                                .employeeId,

                        employeeCode:
                            item._id
                                .employeeCode,

                        employeeName:
                            item._id
                                .employeeName,

                        clientId:
                            item._id
                                .clientId,

                        clientCode:
                            item._id
                                .clientCode,

                        clientName:
                            item._id
                                .clientName,

                        totalTasks:
                            Number(
                                item.totalTasks ||
                                0
                            ),

                        completedTasks:
                            Number(
                                item.completedTasks ||
                                0
                            ),

                        pendingTasks:
                            Number(
                                item.pendingTasks ||
                                0
                            ),

                        taskMinutes:
                            Number(
                                item.taskMinutes ||
                                0
                            ),

                        totalTickets: 0,
                        resolvedTickets: 0,
                        openTickets: 0,
                        ticketMinutes: 0,

                        lastWorkedAt:
                            item.lastWorkedAt,
                    }
                );
            }

            for (
                const item of
                ticketGroups
            ) {
                const key =
                    keyFor(item);

                const existing =
                    map.get(key) || {
                        employeeId:
                            item._id
                                .employeeId,

                        employeeCode:
                            item._id
                                .employeeCode,

                        employeeName:
                            item._id
                                .employeeName,

                        clientId:
                            item._id
                                .clientId,

                        clientCode:
                            item._id
                                .clientCode,

                        clientName:
                            item._id
                                .clientName,

                        totalTasks: 0,
                        completedTasks: 0,
                        pendingTasks: 0,
                        taskMinutes: 0,

                        totalTickets: 0,
                        resolvedTickets: 0,
                        openTickets: 0,
                        ticketMinutes: 0,

                        lastWorkedAt:
                            null,
                    };

                existing.totalTickets =
                    Number(
                        item.totalTickets ||
                        0
                    );

                existing.resolvedTickets =
                    Number(
                        item.resolvedTickets ||
                        0
                    );

                existing.openTickets =
                    Number(
                        item.openTickets ||
                        0
                    );

                existing.ticketMinutes =
                    Number(
                        item.ticketMinutes ||
                        0
                    );

                const existingLast =
                    existing.lastWorkedAt
                        ? new Date(
                            existing.lastWorkedAt
                        )
                        : null;

                const ticketLast =
                    item.lastWorkedAt
                        ? new Date(
                            item.lastWorkedAt
                        )
                        : null;

                if (
                    ticketLast &&
                    (
                        !existingLast ||
                        ticketLast >
                        existingLast
                    )
                ) {
                    existing.lastWorkedAt =
                        item.lastWorkedAt;
                }

                map.set(
                    key,
                    existing
                );
            }

            const data =
                [
                    ...map.values(),
                ]
                    .map(
                        (item) => ({
                            ...item,

                            totalWorkItems:
                                Number(
                                    item.totalTasks ||
                                    0
                                ) +
                                Number(
                                    item.totalTickets ||
                                    0
                                ),

                            completedWork:
                                Number(
                                    item.completedTasks ||
                                    0
                                ) +
                                Number(
                                    item.resolvedTickets ||
                                    0
                                ),

                            pendingWork:
                                Number(
                                    item.pendingTasks ||
                                    0
                                ) +
                                Number(
                                    item.openTickets ||
                                    0
                                ),

                            totalMinutes:
                                Number(
                                    item.taskMinutes ||
                                    0
                                ) +
                                Number(
                                    item.ticketMinutes ||
                                    0
                                ),
                        })
                    )
                    .sort(
                        (a, b) =>
                            Number(
                                b.totalMinutes ||
                                0
                            ) -
                            Number(
                                a.totalMinutes ||
                                0
                            )
                    );

            const summary =
                data.reduce(
                    (
                        result,
                        item
                    ) => {
                        result.employeeClientPairs +=
                            1;

                        result.totalTasks +=
                            item.totalTasks;

                        result.totalTickets +=
                            item.totalTickets;

                        result.completedWork +=
                            item.completedWork;

                        result.pendingWork +=
                            item.pendingWork;

                        result.totalMinutes +=
                            item.totalMinutes;

                        return result;
                    },
                    {
                        employeeClientPairs: 0,
                        totalTasks: 0,
                        totalTickets: 0,
                        completedWork: 0,
                        pendingWork: 0,
                        totalMinutes: 0,
                    }
                );

            return res.json({
                success: true,
                summary,
                count:
                    data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   TEAM TASK REPORT
   GET /api/reports/team/tasks

   READ ONLY
========================================================= */

router.get(
    "/team/tasks",
    async (req, res, next) => {
        try {
            const Task =
                getModel("Task");

            const {
                employeeId = "",
                clientId = "",
                status = "All",
                priority = "All",
                fromDate = "",
                toDate = "",
                search = "",
            } = req.query;

            const query = {
                isDeleted: {
                    $ne: true,
                },
            };

            if (
                employeeId &&
                mongoose.Types.ObjectId.isValid(
                    employeeId
                )
            ) {
                query.assignedEmployeeId =
                    new mongoose.Types.ObjectId(
                        employeeId
                    );
            }

            if (
                clientId &&
                mongoose.Types.ObjectId.isValid(
                    clientId
                )
            ) {
                query.clientId =
                    new mongoose.Types.ObjectId(
                        clientId
                    );
            }

            if (
                status !== "All"
            ) {
                query.status =
                    status;
            }

            if (
                priority !== "All"
            ) {
                query.priority =
                    priority;
            }

            if (
                fromDate ||
                toDate
            ) {
                query.createdAt =
                    {};

                if (fromDate) {
                    query.createdAt.$gte =
                        new Date(
                            `${fromDate}T00:00:00+05:30`
                        );
                }

                if (toDate) {
                    query.createdAt.$lte =
                        new Date(
                            `${toDate}T23:59:59.999+05:30`
                        );
                }
            }

            if (
                String(search).trim()
            ) {
                const regex =
                    new RegExp(
                        escapeRegex(
                            search
                        ),
                        "i"
                    );

                query.$or = [
                    {
                        taskCode:
                            regex,
                    },
                    {
                        title:
                            regex,
                    },
                    {
                        clientName:
                            regex,
                    },
                    {
                        productName:
                            regex,
                    },
                    {
                        projectName:
                            regex,
                    },
                    {
                        assignedEmployeeName:
                            regex,
                    },
                ];
            }

            const now =
                new Date();

            const records =
                await Task.find(query)
                    .select({
                        taskCode: 1,
                        title: 1,

                        workType: 1,
                        taskFor: 1,

                        clientId: 1,
                        clientName: 1,

                        productCode: 1,
                        productName: 1,

                        projectCode: 1,
                        projectName: 1,

                        ticketCode: 1,

                        assignedEmployeeId: 1,
                        assignedEmployeeCode: 1,
                        assignedEmployeeName: 1,

                        priority: 1,
                        status: 1,
                        progress: 1,

                        startDate: 1,
                        dueDate: 1,
                        completedAt: 1,

                        estimatedMinutes: 1,
                        spentMinutes: 1,

                        createdAt: 1,
                    })
                    .sort({
                        createdAt: -1,
                    })
                    .lean();

            const data =
                records.map(
                    (task) => {
                        const finished =
                            FINISHED_TASK_STATUSES.includes(
                                task.status
                            );

                        const due =
                            task.dueDate
                                ? new Date(
                                    task.dueDate
                                )
                                : null;

                        const overdue =
                            Boolean(
                                !finished &&
                                due &&
                                !Number.isNaN(
                                    due.getTime()
                                ) &&
                                due < now
                            );

                        return {
                            ...task,

                            id:
                                task._id,

                            estimatedMinutes:
                                Number(
                                    task.estimatedMinutes ||
                                    0
                                ),

                            spentMinutes:
                                Number(
                                    task.spentMinutes ||
                                    0
                                ),

                            overdue,

                            overdueDays:
                                overdue
                                    ? Math.floor(
                                        (
                                            now.getTime() -
                                            due.getTime()
                                        ) /
                                        86400000
                                    )
                                    : 0,
                        };
                    }
                );

            const summary =
                data.reduce(
                    (
                        result,
                        item
                    ) => {
                        result.totalTasks +=
                            1;

                        if (
                            FINISHED_TASK_STATUSES.includes(
                                item.status
                            )
                        ) {
                            result.completed +=
                                1;
                        } else {
                            result.pending +=
                                1;
                        }

                        if (
                            item.status ===
                            "In Progress"
                        ) {
                            result.inProgress +=
                                1;
                        }

                        if (
                            item.overdue
                        ) {
                            result.overdue +=
                                1;
                        }

                        result.estimatedMinutes +=
                            item.estimatedMinutes;

                        result.spentMinutes +=
                            item.spentMinutes;

                        return result;
                    },
                    {
                        totalTasks: 0,
                        completed: 0,
                        pending: 0,
                        inProgress: 0,
                        overdue: 0,
                        estimatedMinutes: 0,
                        spentMinutes: 0,
                    }
                );

            return res.json({
                success: true,
                summary,
                count:
                    data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   TEAM TICKET REPORT
   GET /api/reports/team/tickets

   READ ONLY
========================================================= */

router.get(
    "/team/tickets",
    async (req, res, next) => {
        try {
            const SupportTicket =
                getModel(
                    "SupportTicket"
                );

            const {
                employeeId = "",
                clientId = "",
                status = "All",
                priority = "All",
                fromDate = "",
                toDate = "",
                search = "",
            } = req.query;

            const query = {
                isDeleted: {
                    $ne: true,
                },
            };

            if (
                employeeId &&
                mongoose.Types.ObjectId.isValid(
                    employeeId
                )
            ) {
                query.assignedEmployeeId =
                    new mongoose.Types.ObjectId(
                        employeeId
                    );
            }

            if (
                clientId &&
                mongoose.Types.ObjectId.isValid(
                    clientId
                )
            ) {
                query.clientId =
                    new mongoose.Types.ObjectId(
                        clientId
                    );
            }

            if (
                status !== "All"
            ) {
                query.status =
                    status;
            }

            if (
                priority !== "All"
            ) {
                query.priority =
                    priority;
            }

            if (
                fromDate ||
                toDate
            ) {
                query.createdAt =
                    {};

                if (fromDate) {
                    query.createdAt.$gte =
                        new Date(
                            `${fromDate}T00:00:00+05:30`
                        );
                }

                if (toDate) {
                    query.createdAt.$lte =
                        new Date(
                            `${toDate}T23:59:59.999+05:30`
                        );
                }
            }

            if (
                String(search).trim()
            ) {
                const regex =
                    new RegExp(
                        escapeRegex(
                            search
                        ),
                        "i"
                    );

                query.$or = [
                    {
                        ticketCode:
                            regex,
                    },
                    {
                        title:
                            regex,
                    },
                    {
                        clientName:
                            regex,
                    },
                    {
                        productName:
                            regex,
                    },
                    {
                        module:
                            regex,
                    },
                    {
                        category:
                            regex,
                    },
                    {
                        assignedEmployeeName:
                            regex,
                    },
                ];
            }

            const now =
                new Date();

            const records =
                await SupportTicket.find(
                    query
                )
                    .select({
                        ticketCode: 1,
                        title: 1,

                        clientId: 1,
                        clientCode: 1,
                        clientName: 1,

                        productName: 1,
                        productVersion: 1,

                        module: 1,
                        category: 1,

                        source: 1,
                        priority: 1,
                        status: 1,

                        assignedEmployeeId: 1,
                        assignedEmployeeCode: 1,
                        assignedEmployeeName: 1,

                        assignedAt: 1,
                        dueDate: 1,

                        firstResponseAt: 1,
                        resolvedAt: 1,
                        closedAt: 1,

                        spentMinutes: 1,

                        createdAt: 1,
                    })
                    .sort({
                        createdAt: -1,
                    })
                    .lean();

            const data =
                records.map(
                    (ticket) => {
                        const closed =
                            CLOSED_TICKET_STATUSES.includes(
                                ticket.status
                            );

                        const due =
                            ticket.dueDate
                                ? new Date(
                                    ticket.dueDate
                                )
                                : null;

                        const overdue =
                            Boolean(
                                !closed &&
                                due &&
                                !Number.isNaN(
                                    due.getTime()
                                ) &&
                                due < now
                            );

                        const created =
                            ticket.createdAt
                                ? new Date(
                                    ticket.createdAt
                                )
                                : null;

                        const resolved =
                            ticket.resolvedAt ||
                            ticket.closedAt;

                        let resolutionMinutes =
                            0;

                        if (
                            created &&
                            resolved
                        ) {
                            resolutionMinutes =
                                Math.max(
                                    0,
                                    Math.floor(
                                        (
                                            new Date(
                                                resolved
                                            ).getTime() -
                                            created.getTime()
                                        ) /
                                        60000
                                    )
                                );
                        }

                        return {
                            ...ticket,

                            id:
                                ticket._id,

                            spentMinutes:
                                Number(
                                    ticket.spentMinutes ||
                                    0
                                ),

                            overdue,

                            overdueDays:
                                overdue
                                    ? Math.floor(
                                        (
                                            now.getTime() -
                                            due.getTime()
                                        ) /
                                        86400000
                                    )
                                    : 0,

                            resolutionMinutes,
                        };
                    }
                );

            const summary =
                data.reduce(
                    (
                        result,
                        item
                    ) => {
                        result.totalTickets +=
                            1;

                        if (
                            CLOSED_TICKET_STATUSES.includes(
                                item.status
                            )
                        ) {
                            result.resolved +=
                                1;
                        } else {
                            result.open +=
                                1;
                        }

                        if (
                            item.status ===
                            "In Progress"
                        ) {
                            result.inProgress +=
                                1;
                        }

                        if (
                            item.overdue
                        ) {
                            result.overdue +=
                                1;
                        }

                        if (
                            [
                                "High",
                                "Critical",
                                "Urgent",
                            ].includes(
                                item.priority
                            )
                        ) {
                            result.highPriority +=
                                1;
                        }

                        result.spentMinutes +=
                            item.spentMinutes;

                        if (
                            item.resolutionMinutes >
                            0
                        ) {
                            result.resolvedWithTime +=
                                1;

                            result.totalResolutionMinutes +=
                                item.resolutionMinutes;
                        }

                        return result;
                    },
                    {
                        totalTickets: 0,
                        open: 0,
                        inProgress: 0,
                        resolved: 0,
                        overdue: 0,
                        highPriority: 0,

                        spentMinutes: 0,

                        resolvedWithTime: 0,
                        totalResolutionMinutes: 0,
                    }
                );

            summary.averageResolutionMinutes =
                summary.resolvedWithTime >
                    0
                    ? Math.round(
                        summary.totalResolutionMinutes /
                        summary.resolvedWithTime
                    )
                    : 0;

            return res.json({
                success: true,
                summary,
                count:
                    data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);
/* =========================================================
   ATTENDANCE REPORT
========================================================= */

router.get(
    "/attendance",
    async (req, res, next) => {
        try {
            const Attendance =
                getModel(
                    "AttendanceV2"
                );

            const {
                fromDate,
                toDate,
                employeeId,
                status,
            } = req.query;

            const query = {
                isDeleted: {
                    $ne: true,
                },
            };

            if (
                employeeId &&
                mongoose.Types.ObjectId.isValid(
                    employeeId
                )
            ) {
                query.employeeId =
                    employeeId;
            }

            if (
                status &&
                status !== "All"
            ) {
                query.status =
                    status;
            }

            if (
                fromDate ||
                toDate
            ) {
                query.date = {};

                if (fromDate) {
                    query.date.$gte =
                        fromDate;
                }

                if (toDate) {
                    query.date.$lte =
                        toDate;
                }
            }

            const records =
                await Attendance.find(
                    query
                )
                    .select({
                        employeeId: 1,
                        employeeCode: 1,
                        employeeName: 1,
                        department: 1,
                        role: 1,
                        date: 1,
                        loginTime: 1,
                        logoutTime: 1,
                        totalBreakMinutes: 1,
                        totalWorkedMinutes: 1,
                        shiftStart: 1,
                        shiftEnd: 1,
                        lateMinutes: 1,
                        earlyLogoutMinutes: 1,
                        overtimeMinutes: 1,
                        status: 1,
                        workStatus: 1,
                        isAutoClosed: 1,
                        autoClosedReason: 1,
                    })
                    .sort({
                        date: -1,
                        employeeName: 1,
                    })
                    .lean();

            const summary =
                records.reduce(
                    (
                        result,
                        record
                    ) => {
                        result.total +=
                            1;

                        if (
                            record.status ===
                            "Present"
                        ) {
                            result.present +=
                                1;
                        }

                        if (
                            record.status ===
                            "Late"
                        ) {
                            result.late +=
                                1;
                        }

                        if (
                            record.status ===
                            "Half Day"
                        ) {
                            result.halfDay +=
                                1;
                        }

                        if (
                            record.status ===
                            "Absent"
                        ) {
                            result.absent +=
                                1;
                        }

                        if (
                            record.status ===
                            "On Leave"
                        ) {
                            result.leave +=
                                1;
                        }

                        result.totalWorkedMinutes +=
                            Number(
                                record.totalWorkedMinutes ||
                                0
                            );

                        result.totalBreakMinutes +=
                            Number(
                                record.totalBreakMinutes ||
                                0
                            );

                        result.overtimeMinutes +=
                            Number(
                                record.overtimeMinutes ||
                                0
                            );

                        return result;
                    },
                    {
                        total: 0,
                        present: 0,
                        late: 0,
                        halfDay: 0,
                        absent: 0,
                        leave: 0,
                        totalWorkedMinutes: 0,
                        totalBreakMinutes: 0,
                        overtimeMinutes: 0,
                    }
                );

            /* =========================================================
            EMPLOYEE-WISE ATTENDANCE SUMMARY
         ========================================================= */

            const employeeMap =
                new Map();

            for (const record of records) {
                const key =
                    String(
                        record.employeeId ||
                        record.employeeCode ||
                        record.employeeName ||
                        "UNKNOWN"
                    );

                if (!employeeMap.has(key)) {
                    employeeMap.set(key, {
                        employeeId:
                            record.employeeId,

                        employeeCode:
                            record.employeeCode || "",

                        employeeName:
                            record.employeeName || "",

                        department:
                            record.department || "",

                        role:
                            record.role || "",

                        attendanceDays: 0,

                        present: 0,
                        late: 0,
                        halfDay: 0,
                        absent: 0,
                        leave: 0,

                        totalWorkedMinutes: 0,
                        totalBreakMinutes: 0,
                        totalLateMinutes: 0,
                        totalEarlyLogoutMinutes: 0,
                        totalOvertimeMinutes: 0,

                        lateOccurrences: 0,
                        overtimeOccurrences: 0,
                    });
                }

                const employee =
                    employeeMap.get(key);

                employee.attendanceDays += 1;

                if (
                    record.status === "Present"
                ) {
                    employee.present += 1;
                }

                if (
                    record.status === "Late"
                ) {
                    employee.late += 1;
                }

                if (
                    record.status === "Half Day"
                ) {
                    employee.halfDay += 1;
                }

                if (
                    record.status === "Absent"
                ) {
                    employee.absent += 1;
                }

                if (
                    record.status === "On Leave"
                ) {
                    employee.leave += 1;
                }

                employee.totalWorkedMinutes +=
                    Number(
                        record.totalWorkedMinutes ||
                        0
                    );

                employee.totalBreakMinutes +=
                    Number(
                        record.totalBreakMinutes ||
                        0
                    );

                employee.totalLateMinutes +=
                    Number(
                        record.lateMinutes ||
                        0
                    );

                employee.totalEarlyLogoutMinutes +=
                    Number(
                        record.earlyLogoutMinutes ||
                        0
                    );

                employee.totalOvertimeMinutes +=
                    Number(
                        record.overtimeMinutes ||
                        0
                    );

                if (
                    Number(
                        record.lateMinutes || 0
                    ) > 0
                ) {
                    employee.lateOccurrences += 1;
                }

                if (
                    Number(
                        record.overtimeMinutes || 0
                    ) > 0
                ) {
                    employee.overtimeOccurrences +=
                        1;
                }
            }

            const employeeSummary =
                [...employeeMap.values()]
                    .map((employee) => ({
                        ...employee,

                        averageWorkedMinutes:
                            employee.attendanceDays > 0
                                ? Math.round(
                                    employee.totalWorkedMinutes /
                                    employee.attendanceDays
                                )
                                : 0,

                        averageBreakMinutes:
                            employee.attendanceDays > 0
                                ? Math.round(
                                    employee.totalBreakMinutes /
                                    employee.attendanceDays
                                )
                                : 0,

                        attendancePercentage:
                            employee.attendanceDays > 0
                                ? Number(
                                    (
                                        (
                                            employee.present +
                                            employee.late +
                                            employee.halfDay
                                        ) /
                                        employee.attendanceDays *
                                        100
                                    ).toFixed(1)
                                )
                                : 0,
                    }))
                    .sort((a, b) =>
                        String(
                            a.employeeName || ""
                        ).localeCompare(
                            String(
                                b.employeeName || ""
                            )
                        )
                    );

            /* =========================================================
               SPECIAL REPORT DATASETS
            ========================================================= */

            const lateArrivals =
                records
                    .filter(
                        (record) =>
                            Number(
                                record.lateMinutes || 0
                            ) > 0
                    )
                    .sort(
                        (a, b) =>
                            Number(
                                b.lateMinutes || 0
                            ) -
                            Number(
                                a.lateMinutes || 0
                            )
                    );

            const overtimeRecords =
                records
                    .filter(
                        (record) =>
                            Number(
                                record.overtimeMinutes || 0
                            ) > 0
                    )
                    .sort(
                        (a, b) =>
                            Number(
                                b.overtimeMinutes || 0
                            ) -
                            Number(
                                a.overtimeMinutes || 0
                            )
                    );

            const absenceLeaveRecords =
                records.filter(
                    (record) =>
                        record.status ===
                        "Absent" ||
                        record.status ===
                        "On Leave"
                );

            const workingHoursRecords =
                [...records].sort(
                    (a, b) =>
                        Number(
                            b.totalWorkedMinutes ||
                            0
                        ) -
                        Number(
                            a.totalWorkedMinutes ||
                            0
                        )
                );

            /* =========================================================
               EXTRA MANAGEMENT SUMMARY
            ========================================================= */

            summary.averageWorkedMinutes =
                records.length > 0
                    ? Math.round(
                        summary.totalWorkedMinutes /
                        records.length
                    )
                    : 0;

            summary.averageBreakMinutes =
                records.length > 0
                    ? Math.round(
                        summary.totalBreakMinutes /
                        records.length
                    )
                    : 0;

            summary.totalLateMinutes =
                records.reduce(
                    (total, record) =>
                        total +
                        Number(
                            record.lateMinutes || 0
                        ),
                    0
                );

            summary.totalEarlyLogoutMinutes =
                records.reduce(
                    (total, record) =>
                        total +
                        Number(
                            record.earlyLogoutMinutes ||
                            0
                        ),
                    0
                );

            summary.lateOccurrences =
                lateArrivals.length;

            summary.overtimeOccurrences =
                overtimeRecords.length;

            summary.absenceLeaveCount =
                absenceLeaveRecords.length;

            /* =========================================================
               RESPONSE
            ========================================================= */

            return res.json({
                success: true,

                summary,

                count:
                    records.length,

                data:
                    records,

                employeeSummary,

                reports: {
                    lateArrivals,

                    workingHours:
                        workingHoursRecords,

                    overtime:
                        overtimeRecords,

                    absenceLeave:
                        absenceLeaveRecords,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

/* =========================================================
   PENDING + OVERDUE MANAGEMENT REPORT
========================================================= */

router.get(
    "/management/pending-work",
    async (req, res, next) => {
        try {
            const Task =
                getModel("Task");

            const SupportTicket =
                getModel("SupportTicket");

            const now =
                new Date();

            const {
                employeeId = "",
                clientId = "",
                priority = "All",
            } = req.query;

            const taskQuery = {
                isDeleted: {
                    $ne: true,
                },

                status: {
                    $nin:
                        FINISHED_TASK_STATUSES,
                },
            };

            const ticketQuery = {
                isDeleted: {
                    $ne: true,
                },

                status: {
                    $nin:
                        CLOSED_TICKET_STATUSES,
                },
            };

            if (
                employeeId &&
                mongoose.Types.ObjectId.isValid(
                    employeeId
                )
            ) {
                taskQuery.assignedEmployeeId =
                    employeeId;

                ticketQuery.assignedEmployeeId =
                    employeeId;
            }

            if (
                clientId &&
                mongoose.Types.ObjectId.isValid(
                    clientId
                )
            ) {
                taskQuery.clientId =
                    clientId;

                ticketQuery.clientId =
                    clientId;
            }

            if (
                priority &&
                priority !== "All"
            ) {
                taskQuery.priority =
                    priority;

                ticketQuery.priority =
                    priority;
            }

            const [
                tasks,
                tickets,
            ] =
                await Promise.all([
                    Task.find(
                        taskQuery
                    )
                        .select({
                            taskCode: 1,
                            title: 1,
                            clientId: 1,
                            clientName: 1,
                            productName: 1,
                            projectName: 1,
                            assignedEmployeeId: 1,
                            assignedEmployeeCode: 1,
                            assignedEmployeeName: 1,
                            priority: 1,
                            status: 1,
                            progress: 1,
                            startDate: 1,
                            dueDate: 1,
                            estimatedMinutes: 1,
                            spentMinutes: 1,
                            createdAt: 1,
                        })
                        .sort({
                            dueDate: 1,
                            createdAt: -1,
                        })
                        .lean(),

                    SupportTicket.find(
                        ticketQuery
                    )
                        .select({
                            ticketCode: 1,
                            title: 1,
                            clientId: 1,
                            clientCode: 1,
                            clientName: 1,
                            productName: 1,
                            module: 1,
                            category: 1,
                            source: 1,
                            assignedEmployeeId: 1,
                            assignedEmployeeCode: 1,
                            assignedEmployeeName: 1,
                            priority: 1,
                            status: 1,
                            dueDate: 1,
                            spentMinutes: 1,
                            createdAt: 1,
                        })
                        .sort({
                            dueDate: 1,
                            createdAt: -1,
                        })
                        .lean(),
                ]);

            const taskData =
                tasks.map(
                    (task) => ({
                        ...task,

                        workKind:
                            "Task",

                        overdue:
                            Boolean(
                                task.dueDate &&
                                new Date(
                                    task.dueDate
                                ) < now
                            ),

                        overdueDays:
                            task.dueDate &&
                                new Date(
                                    task.dueDate
                                ) < now
                                ? Math.floor(
                                    (
                                        now.getTime() -
                                        new Date(
                                            task.dueDate
                                        ).getTime()
                                    ) /
                                    86400000
                                )
                                : 0,
                    })
                );

            const ticketData =
                tickets.map(
                    (ticket) => ({
                        ...ticket,

                        workKind:
                            "Ticket",

                        overdue:
                            Boolean(
                                ticket.dueDate &&
                                new Date(
                                    ticket.dueDate
                                ) < now
                            ),

                        overdueDays:
                            ticket.dueDate &&
                                new Date(
                                    ticket.dueDate
                                ) < now
                                ? Math.floor(
                                    (
                                        now.getTime() -
                                        new Date(
                                            ticket.dueDate
                                        ).getTime()
                                    ) /
                                    86400000
                                )
                                : 0,
                    })
                );

            return res.json({
                success: true,

                summary: {
                    pendingTasks:
                        taskData.length,

                    pendingTickets:
                        ticketData.length,

                    overdueTasks:
                        taskData.filter(
                            (item) =>
                                item.overdue
                        ).length,

                    overdueTickets:
                        ticketData.filter(
                            (item) =>
                                item.overdue
                        ).length,
                },

                tasks:
                    taskData,

                tickets:
                    ticketData,
            });
        } catch (error) {
            next(error);
        }
    }
);
/* =========================================================
   MANAGEMENT REPORTS
   READ ONLY
========================================================= */


/* =========================================================
   MANAGEMENT OVERVIEW
   GET /api/reports/management/overview
========================================================= */

router.get("/management/overview", async (req, res, next) => {
    try {
        const Client = getModel("Client");
        const Employee = getModel("Employee");
        const Task = getModel("Task");
        const SupportTicket = getModel("SupportTicket");

        const ClientAmcContract =
            mongoose.models.ClientAmcContract || null;

        const ClientAmcInvoice =
            mongoose.models.ClientAmcInvoice || null;

        const now = new Date();

        const [
            totalClients,
            activeClients,
            totalEmployees,
            employees,
            totalTasks,
            completedTasks,
            overdueTasks,
            totalTickets,
            resolvedTickets,
            overdueTickets,
        ] = await Promise.all([
            Client.countDocuments({
                isDeleted: { $ne: true },
            }),

            Client.countDocuments({
                isDeleted: { $ne: true },
                isActive: { $ne: false },
            }),

            Employee.countDocuments({
                isActive: { $ne: false },
            }),

            Employee.find({
                isActive: { $ne: false },
            })
                .select({
                    status: 1,
                })
                .lean(),

            Task.countDocuments({
                isDeleted: { $ne: true },
            }),

            Task.countDocuments({
                isDeleted: { $ne: true },
                status: {
                    $in: FINISHED_TASK_STATUSES,
                },
            }),

            Task.countDocuments({
                isDeleted: { $ne: true },

                status: {
                    $nin: FINISHED_TASK_STATUSES,
                },

                dueDate: {
                    $ne: null,
                    $lt: now,
                },
            }),

            SupportTicket.countDocuments({
                isDeleted: { $ne: true },
            }),

            SupportTicket.countDocuments({
                isDeleted: { $ne: true },

                status: {
                    $in: CLOSED_TICKET_STATUSES,
                },
            }),

            SupportTicket.countDocuments({
                isDeleted: { $ne: true },

                status: {
                    $nin: CLOSED_TICKET_STATUSES,
                },

                dueDate: {
                    $ne: null,
                    $lt: now,
                },
            }),
        ]);

        const employeeStatus = {
            working: 0,
            free: 0,
            break: 0,
            leave: 0,
            offline: 0,
        };

        for (const employee of employees) {
            const status =
                String(employee.status || "").toLowerCase();

            if (status === "working") {
                employeeStatus.working += 1;
            } else if (status === "free") {
                employeeStatus.free += 1;
            } else if (status === "break") {
                employeeStatus.break += 1;
            } else if (status === "leave") {
                employeeStatus.leave += 1;
            } else {
                employeeStatus.offline += 1;
            }
        }

        let amc = {
            totalContracts: 0,
            activeContracts: 0,
            expiredContracts: 0,
            expiringSoon: 0,
        };

        if (ClientAmcContract) {
            const thirtyDays =
                new Date(
                    now.getTime() +
                    30 * 24 * 60 * 60 * 1000
                );

            const [
                totalContracts,
                activeContracts,
                expiredContracts,
                expiringSoon,
            ] = await Promise.all([
                ClientAmcContract.countDocuments({
                    isDeleted: { $ne: true },
                }),

                ClientAmcContract.countDocuments({
                    isDeleted: { $ne: true },
                    status: "Active",
                }),

                ClientAmcContract.countDocuments({
                    isDeleted: { $ne: true },
                    contractExpiryDate: {
                        $lt: now,
                    },
                }),

                ClientAmcContract.countDocuments({
                    isDeleted: { $ne: true },

                    contractExpiryDate: {
                        $gte: now,
                        $lte: thirtyDays,
                    },
                }),
            ]);

            amc = {
                totalContracts,
                activeContracts,
                expiredContracts,
                expiringSoon,
            };
        }

        let collections = {
            totalReceivable: 0,
            totalReceived: 0,
            totalOutstanding: 0,
            overdueInvoices: 0,
        };

        if (ClientAmcInvoice) {
            const invoiceSummary =
                await ClientAmcInvoice.aggregate([
                    {
                        $match: {
                            isDeleted: { $ne: true },
                        },
                    },

                    {
                        $group: {
                            _id: null,

                            receivable: {
                                $sum: {
                                    $ifNull: [
                                        "$grandTotal",
                                        0,
                                    ],
                                },
                            },

                            received: {
                                $sum: {
                                    $ifNull: [
                                        "$paidAmount",
                                        0,
                                    ],
                                },
                            },

                            outstanding: {
                                $sum: {
                                    $ifNull: [
                                        "$balanceAmount",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ]);

            if (invoiceSummary.length) {
                collections.totalReceivable =
                    Number(
                        invoiceSummary[0].receivable || 0
                    );

                collections.totalReceived =
                    Number(
                        invoiceSummary[0].received || 0
                    );

                collections.totalOutstanding =
                    Number(
                        invoiceSummary[0].outstanding || 0
                    );
            }

            collections.overdueInvoices =
                await ClientAmcInvoice.countDocuments({
                    isDeleted: { $ne: true },

                    dueDate: {
                        $lt: now,
                    },

                    balanceAmount: {
                        $gt: 0,
                    },
                });
        }

        return res.json({
            success: true,

            summary: {
                clients: {
                    total: totalClients,
                    active: activeClients,
                },

                team: {
                    total: totalEmployees,
                    ...employeeStatus,
                },

                tasks: {
                    total: totalTasks,
                    completed: completedTasks,
                    pending:
                        totalTasks - completedTasks,
                    overdue: overdueTasks,
                },

                tickets: {
                    total: totalTickets,
                    resolved: resolvedTickets,
                    open:
                        totalTickets - resolvedTickets,
                    overdue: overdueTickets,
                },

                amc,

                collections,

                totalAttentionItems:
                    overdueTasks +
                    overdueTickets +
                    amc.expiredContracts +
                    collections.overdueInvoices,
            },
        });
    } catch (error) {
        next(error);
    }
});


/* =========================================================
   PENDING & OVERDUE MANAGEMENT REPORT
   GET /api/reports/management/pending-overdue
========================================================= */

router.get(
    "/management/pending-overdue",
    async (req, res, next) => {
        try {
            const Task = getModel("Task");
            const SupportTicket =
                getModel("SupportTicket");

            const now = new Date();

            const [
                tasks,
                tickets,
            ] = await Promise.all([
                Task.find({
                    isDeleted: { $ne: true },

                    status: {
                        $nin: FINISHED_TASK_STATUSES,
                    },
                })
                    .select({
                        taskCode: 1,
                        title: 1,

                        clientId: 1,
                        clientCode: 1,
                        clientName: 1,

                        assignedEmployeeId: 1,
                        assignedEmployeeCode: 1,
                        assignedEmployeeName: 1,

                        priority: 1,
                        status: 1,

                        dueDate: 1,

                        estimatedMinutes: 1,
                        spentMinutes: 1,

                        createdAt: 1,
                    })
                    .lean(),

                SupportTicket.find({
                    isDeleted: { $ne: true },

                    status: {
                        $nin: CLOSED_TICKET_STATUSES,
                    },
                })
                    .select({
                        ticketCode: 1,
                        title: 1,

                        clientId: 1,
                        clientCode: 1,
                        clientName: 1,

                        assignedEmployeeId: 1,
                        assignedEmployeeCode: 1,
                        assignedEmployeeName: 1,

                        priority: 1,
                        status: 1,

                        dueDate: 1,
                        spentMinutes: 1,

                        createdAt: 1,
                    })
                    .lean(),
            ]);

            const data = [];

            for (const task of tasks) {
                const dueDate =
                    task.dueDate
                        ? new Date(task.dueDate)
                        : null;

                const overdue =
                    Boolean(
                        dueDate &&
                        !Number.isNaN(dueDate.getTime()) &&
                        dueDate < now
                    );

                data.push({
                    id: task._id,
                    type: "Task",

                    code: task.taskCode,
                    title: task.title,

                    clientId: task.clientId,
                    clientCode: task.clientCode,
                    clientName: task.clientName,

                    employeeId:
                        task.assignedEmployeeId,

                    employeeCode:
                        task.assignedEmployeeCode,

                    employeeName:
                        task.assignedEmployeeName,

                    priority: task.priority,
                    status: task.status,

                    dueDate: task.dueDate,
                    createdAt: task.createdAt,

                    estimatedMinutes:
                        Number(
                            task.estimatedMinutes || 0
                        ),

                    spentMinutes:
                        Number(
                            task.spentMinutes || 0
                        ),

                    overdue,

                    overdueDays:
                        overdue
                            ? Math.max(
                                0,
                                Math.floor(
                                    (
                                        now.getTime() -
                                        dueDate.getTime()
                                    ) /
                                    86400000
                                )
                            )
                            : 0,
                });
            }

            for (const ticket of tickets) {
                const dueDate =
                    ticket.dueDate
                        ? new Date(ticket.dueDate)
                        : null;

                const overdue =
                    Boolean(
                        dueDate &&
                        !Number.isNaN(dueDate.getTime()) &&
                        dueDate < now
                    );

                data.push({
                    id: ticket._id,
                    type: "Ticket",

                    code: ticket.ticketCode,
                    title: ticket.title,

                    clientId: ticket.clientId,
                    clientCode: ticket.clientCode,
                    clientName: ticket.clientName,

                    employeeId:
                        ticket.assignedEmployeeId,

                    employeeCode:
                        ticket.assignedEmployeeCode,

                    employeeName:
                        ticket.assignedEmployeeName,

                    priority: ticket.priority,
                    status: ticket.status,

                    dueDate: ticket.dueDate,
                    createdAt: ticket.createdAt,

                    estimatedMinutes: 0,

                    spentMinutes:
                        Number(
                            ticket.spentMinutes || 0
                        ),

                    overdue,

                    overdueDays:
                        overdue
                            ? Math.max(
                                0,
                                Math.floor(
                                    (
                                        now.getTime() -
                                        dueDate.getTime()
                                    ) /
                                    86400000
                                )
                            )
                            : 0,
                });
            }

            data.sort((a, b) => {
                if (a.overdue !== b.overdue) {
                    return a.overdue ? -1 : 1;
                }

                return (
                    Number(b.overdueDays || 0) -
                    Number(a.overdueDays || 0)
                );
            });

            const summary =
                data.reduce(
                    (result, item) => {
                        result.totalPending += 1;

                        if (item.type === "Task") {
                            result.pendingTasks += 1;
                        }

                        if (item.type === "Ticket") {
                            result.pendingTickets += 1;
                        }

                        if (item.overdue) {
                            result.totalOverdue += 1;
                        }

                        if (
                            ["Critical", "Urgent", "High"].includes(
                                item.priority
                            )
                        ) {
                            result.highPriority += 1;
                        }

                        return result;
                    },
                    {
                        totalPending: 0,
                        pendingTasks: 0,
                        pendingTickets: 0,
                        totalOverdue: 0,
                        highPriority: 0,
                    }
                );

            return res.json({
                success: true,
                summary,
                count: data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   CLIENT ATTENTION REPORT
   GET /api/reports/management/client-attention
========================================================= */

router.get(
    "/management/client-attention",
    async (req, res, next) => {
        try {
            const Client = getModel("Client");
            const Task = getModel("Task");
            const SupportTicket =
                getModel("SupportTicket");

            const now = new Date();

            const clients =
                await Client.find({
                    isDeleted: { $ne: true },
                })
                    .select({
                        clientCode: 1,
                        companyName: 1,
                        contactPerson: 1,
                        mobile: 1,
                    })
                    .lean();

            const clientIds =
                clients.map(
                    (client) => client._id
                );

            const [
                taskStats,
                ticketStats,
            ] = await Promise.all([
                Task.aggregate([
                    {
                        $match: {
                            isDeleted: { $ne: true },

                            clientId: {
                                $in: clientIds,
                            },

                            status: {
                                $nin:
                                    FINISHED_TASK_STATUSES,
                            },
                        },
                    },

                    {
                        $group: {
                            _id: "$clientId",

                            pendingTasks: {
                                $sum: 1,
                            },

                            overdueTasks: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                {
                                                    $ne: [
                                                        "$dueDate",
                                                        null,
                                                    ],
                                                },

                                                {
                                                    $lt: [
                                                        "$dueDate",
                                                        now,
                                                    ],
                                                },
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },

                            taskMinutes: {
                                $sum: {
                                    $ifNull: [
                                        "$spentMinutes",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ]),

                SupportTicket.aggregate([
                    {
                        $match: {
                            isDeleted: { $ne: true },

                            clientId: {
                                $in: clientIds,
                            },

                            status: {
                                $nin:
                                    CLOSED_TICKET_STATUSES,
                            },
                        },
                    },

                    {
                        $group: {
                            _id: "$clientId",

                            openTickets: {
                                $sum: 1,
                            },

                            overdueTickets: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                {
                                                    $ne: [
                                                        "$dueDate",
                                                        null,
                                                    ],
                                                },

                                                {
                                                    $lt: [
                                                        "$dueDate",
                                                        now,
                                                    ],
                                                },
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },

                            highPriorityTickets: {
                                $sum: {
                                    $cond: [
                                        {
                                            $in: [
                                                "$priority",
                                                [
                                                    "Critical",
                                                    "Urgent",
                                                    "High",
                                                ],
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },

                            ticketMinutes: {
                                $sum: {
                                    $ifNull: [
                                        "$spentMinutes",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ]),
            ]);

            const taskMap =
                new Map(
                    taskStats.map((item) => [
                        String(item._id),
                        item,
                    ])
                );

            const ticketMap =
                new Map(
                    ticketStats.map((item) => [
                        String(item._id),
                        item,
                    ])
                );

            const data =
                clients
                    .map((client) => {
                        const key =
                            String(client._id);

                        const tasks =
                            taskMap.get(key) || {};

                        const tickets =
                            ticketMap.get(key) || {};

                        const pendingTasks =
                            Number(
                                tasks.pendingTasks || 0
                            );

                        const overdueTasks =
                            Number(
                                tasks.overdueTasks || 0
                            );

                        const openTickets =
                            Number(
                                tickets.openTickets || 0
                            );

                        const overdueTickets =
                            Number(
                                tickets.overdueTickets || 0
                            );

                        const highPriorityTickets =
                            Number(
                                tickets.highPriorityTickets ||
                                0
                            );

                        const totalWorkMinutes =
                            Number(
                                tasks.taskMinutes || 0
                            ) +
                            Number(
                                tickets.ticketMinutes || 0
                            );

                        /*
                         * Attention score is for report sorting only.
                         * It does NOT change client/ticket/task data.
                         */
                        const attentionScore =
                            overdueTasks * 3 +
                            overdueTickets * 4 +
                            highPriorityTickets * 3 +
                            pendingTasks +
                            openTickets;

                        return {
                            id: client._id,

                            clientCode:
                                client.clientCode,

                            clientName:
                                client.companyName,

                            contactPerson:
                                client.contactPerson,

                            mobile:
                                client.mobile,

                            pendingTasks,
                            overdueTasks,

                            openTickets,
                            overdueTickets,
                            highPriorityTickets,

                            totalWorkMinutes,

                            attentionScore,
                        };
                    })
                    .filter(
                        (item) =>
                            item.pendingTasks > 0 ||
                            item.openTickets > 0
                    )
                    .sort(
                        (a, b) =>
                            b.attentionScore -
                            a.attentionScore
                    );

            const summary =
                data.reduce(
                    (result, item) => {
                        result.clientsNeedingAttention +=
                            1;

                        result.pendingTasks +=
                            item.pendingTasks;

                        result.openTickets +=
                            item.openTickets;

                        result.overdueItems +=
                            item.overdueTasks +
                            item.overdueTickets;

                        result.highPriorityTickets +=
                            item.highPriorityTickets;

                        return result;
                    },
                    {
                        clientsNeedingAttention: 0,
                        pendingTasks: 0,
                        openTickets: 0,
                        overdueItems: 0,
                        highPriorityTickets: 0,
                    }
                );

            return res.json({
                success: true,
                summary,
                count: data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);


/* =========================================================
   TEAM UTILIZATION REPORT
   GET /api/reports/management/team-utilization
========================================================= */

router.get(
    "/management/team-utilization",
    async (req, res, next) => {
        try {
            const Employee =
                getModel("Employee");

            const Task =
                getModel("Task");

            const SupportTicket =
                getModel("SupportTicket");

            const employees =
                await Employee.find({
                    isActive: { $ne: false },
                })
                    .select({
                        employeeCode: 1,
                        name: 1,
                        department: 1,
                        role: 1,
                        status: 1,

                        currentTask: 1,
                        currentTaskCode: 1,
                        currentTaskTitle: 1,

                        currentClient: 1,
                        currentProject: 1,

                        activeMinutes: 1,
                        lastActivityAt: 1,
                    })
                    .lean();

            const employeeIds =
                employees.map(
                    (employee) =>
                        employee._id
                );

            const [
                taskStats,
                ticketStats,
            ] = await Promise.all([
                Task.aggregate([
                    {
                        $match: {
                            isDeleted: { $ne: true },

                            assignedEmployeeId: {
                                $in: employeeIds,
                            },

                            status: {
                                $nin:
                                    FINISHED_TASK_STATUSES,
                            },
                        },
                    },

                    {
                        $group: {
                            _id:
                                "$assignedEmployeeId",

                            openTasks: {
                                $sum: 1,
                            },

                            taskMinutes: {
                                $sum: {
                                    $ifNull: [
                                        "$spentMinutes",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ]),

                SupportTicket.aggregate([
                    {
                        $match: {
                            isDeleted: { $ne: true },

                            assignedEmployeeId: {
                                $in: employeeIds,
                            },

                            status: {
                                $nin:
                                    CLOSED_TICKET_STATUSES,
                            },
                        },
                    },

                    {
                        $group: {
                            _id:
                                "$assignedEmployeeId",

                            openTickets: {
                                $sum: 1,
                            },

                            ticketMinutes: {
                                $sum: {
                                    $ifNull: [
                                        "$spentMinutes",
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ]),
            ]);

            const taskMap =
                new Map(
                    taskStats.map((item) => [
                        String(item._id),
                        item,
                    ])
                );

            const ticketMap =
                new Map(
                    ticketStats.map((item) => [
                        String(item._id),
                        item,
                    ])
                );

            const data =
                employees
                    .map((employee) => {
                        const key =
                            String(employee._id);

                        const tasks =
                            taskMap.get(key) || {};

                        const tickets =
                            ticketMap.get(key) || {};

                        const openTasks =
                            Number(
                                tasks.openTasks || 0
                            );

                        const openTickets =
                            Number(
                                tickets.openTickets || 0
                            );

                        const workload =
                            openTasks +
                            openTickets;

                        let workloadLevel =
                            "Available";

                        if (workload >= 8) {
                            workloadLevel =
                                "High";
                        } else if (workload >= 4) {
                            workloadLevel =
                                "Medium";
                        } else if (workload > 0) {
                            workloadLevel =
                                "Normal";
                        }

                        return {
                            id:
                                employee._id,

                            employeeCode:
                                employee.employeeCode,

                            name:
                                employee.name,

                            department:
                                employee.department,

                            role:
                                employee.role,

                            status:
                                employee.status,

                            currentTask:
                                employee.currentTask,

                            currentTaskCode:
                                employee.currentTaskCode,

                            currentTaskTitle:
                                employee.currentTaskTitle,

                            currentClient:
                                employee.currentClient,

                            currentProject:
                                employee.currentProject,

                            openTasks,
                            openTickets,

                            workload,

                            workloadLevel,

                            activeMinutes:
                                Number(
                                    employee.activeMinutes ||
                                    0
                                ),

                            totalTrackedMinutes:
                                Number(
                                    tasks.taskMinutes || 0
                                ) +
                                Number(
                                    tickets.ticketMinutes ||
                                    0
                                ),

                            lastActivityAt:
                                employee.lastActivityAt,
                        };
                    })
                    .sort(
                        (a, b) =>
                            b.workload -
                            a.workload
                    );

            const summary =
                data.reduce(
                    (result, item) => {
                        result.totalEmployees +=
                            1;

                        if (
                            item.status ===
                            "Working"
                        ) {
                            result.working += 1;
                        }

                        if (
                            item.status ===
                            "Free"
                        ) {
                            result.free += 1;
                        }

                        if (
                            item.workloadLevel ===
                            "High"
                        ) {
                            result.highWorkload +=
                                1;
                        }

                        result.openTasks +=
                            item.openTasks;

                        result.openTickets +=
                            item.openTickets;

                        return result;
                    },
                    {
                        totalEmployees: 0,
                        working: 0,
                        free: 0,
                        highWorkload: 0,
                        openTasks: 0,
                        openTickets: 0,
                    }
                );

            return res.json({
                success: true,
                summary,
                count: data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);
/* =========================================================
   MANAGEMENT AMC RISK REPORT
   GET /api/reports/management/amc-risk

   READ ONLY
   Uses existing AmcInvoice financial data.
========================================================= */

router.get(
    "/management/amc-risk",
    async (req, res, next) => {
        try {
            const AmcInvoice =
                getModel("AmcInvoice");

            const AmcContract =
                getOptionalModel("AmcContract");

            const now = new Date();

            const thirtyDaysFromNow =
                new Date(
                    now.getTime() +
                    30 * 24 * 60 * 60 * 1000
                );

            const invoices =
                await AmcInvoice.find({
                    isDeleted: {
                        $ne: true,
                    },

                    status: {
                        $ne: "Cancelled",
                    },
                })
                    .select({
                        invoiceCode: 1,
                        invoiceDate: 1,

                        amcContractId: 1,
                        contractCode: 1,

                        contractStartDate: 1,
                        contractExpiryDate: 1,
                        dueDate: 1,

                        clientId: 1,
                        clientCode: 1,
                        clientName: 1,

                        productId: 1,
                        productCode: 1,
                        productName: 1,
                        productVersion: 1,

                        plan: 1,

                        totalAmount: 1,
                        paidAmount: 1,
                        pendingAmount: 1,

                        paymentStatus: 1,
                        status: 1,

                        createdAt: 1,
                    })
                    .sort({
                        contractExpiryDate: 1,
                    })
                    .lean();

            let contractMap =
                new Map();

            if (
                AmcContract &&
                invoices.length
            ) {
                const contractIds =
                    invoices
                        .map(
                            (invoice) =>
                                invoice.amcContractId
                        )
                        .filter(Boolean);

                if (contractIds.length) {
                    const contracts =
                        await AmcContract.find({
                            _id: {
                                $in: contractIds,
                            },

                            isDeleted: {
                                $ne: true,
                            },
                        })
                            .select({
                                status: 1,

                                assignedEmployeeId: 1,
                                assignedEmployeeCode: 1,
                                assignedEmployeeName: 1,

                                reminderStatus: 1,
                                lastReminderAt: 1,
                                nextFollowUpDate: 1,
                            })
                            .lean();

                    contractMap =
                        new Map(
                            contracts.map(
                                (contract) => [
                                    String(
                                        contract._id
                                    ),
                                    contract,
                                ]
                            )
                        );
                }
            }

            const data =
                invoices.map(
                    (invoice) => {
                        const expiryDate =
                            invoice.contractExpiryDate
                                ? new Date(
                                    invoice.contractExpiryDate
                                )
                                : null;

                        const contract =
                            contractMap.get(
                                String(
                                    invoice.amcContractId ||
                                    ""
                                )
                            ) || null;

                        let daysLeft = null;

                        if (
                            expiryDate &&
                            !Number.isNaN(
                                expiryDate.getTime()
                            )
                        ) {
                            daysLeft =
                                Math.ceil(
                                    (
                                        expiryDate.getTime() -
                                        now.getTime()
                                    ) /
                                    86400000
                                );
                        }

                        let renewalRisk =
                            "Normal";

                        if (
                            daysLeft !== null &&
                            daysLeft < 0
                        ) {
                            renewalRisk =
                                "Expired";
                        } else if (
                            daysLeft !== null &&
                            daysLeft <= 7
                        ) {
                            renewalRisk =
                                "Critical";
                        } else if (
                            daysLeft !== null &&
                            daysLeft <= 30
                        ) {
                            renewalRisk =
                                "Expiring Soon";
                        }

                        const pendingAmount =
                            Number(
                                invoice.pendingAmount ||
                                0
                            );

                        const dueDate =
                            invoice.dueDate
                                ? new Date(
                                    invoice.dueDate
                                )
                                : null;

                        const paymentOverdue =
                            Boolean(
                                pendingAmount > 0 &&
                                dueDate &&
                                !Number.isNaN(
                                    dueDate.getTime()
                                ) &&
                                dueDate < now
                            );

                        return {
                            id:
                                invoice._id,

                            invoiceCode:
                                invoice.invoiceCode,

                            invoiceDate:
                                invoice.invoiceDate,

                            contractCode:
                                invoice.contractCode,

                            contractStartDate:
                                invoice.contractStartDate,

                            contractExpiryDate:
                                invoice.contractExpiryDate,

                            clientId:
                                invoice.clientId,

                            clientCode:
                                invoice.clientCode,

                            clientName:
                                invoice.clientName,

                            productId:
                                invoice.productId,

                            productCode:
                                invoice.productCode,

                            productName:
                                invoice.productName,

                            productVersion:
                                invoice.productVersion,

                            plan:
                                invoice.plan,

                            totalAmount:
                                Number(
                                    invoice.totalAmount ||
                                    0
                                ),

                            paidAmount:
                                Number(
                                    invoice.paidAmount ||
                                    0
                                ),

                            pendingAmount,

                            paymentStatus:
                                invoice.paymentStatus,

                            contractStatus:
                                contract?.status ||
                                "",

                            assignedEmployeeCode:
                                contract
                                    ?.assignedEmployeeCode ||
                                "",

                            assignedEmployeeName:
                                contract
                                    ?.assignedEmployeeName ||
                                "",

                            reminderStatus:
                                contract
                                    ?.reminderStatus ||
                                "",

                            nextFollowUpDate:
                                contract
                                    ?.nextFollowUpDate ||
                                null,

                            daysLeft,

                            renewalRisk,

                            paymentOverdue,
                        };
                    }
                );

            const summary =
                data.reduce(
                    (result, item) => {
                        result.totalContracts += 1;

                        if (
                            item.renewalRisk ===
                            "Expired"
                        ) {
                            result.expired += 1;
                        }

                        if (
                            item.renewalRisk ===
                            "Critical"
                        ) {
                            result.critical += 1;
                        }

                        if (
                            item.renewalRisk ===
                            "Expiring Soon"
                        ) {
                            result.expiringSoon +=
                                1;
                        }

                        if (
                            item.renewalRisk ===
                            "Normal"
                        ) {
                            result.active += 1;
                        }

                        result.totalValue +=
                            Number(
                                item.totalAmount ||
                                0
                            );

                        result.outstanding +=
                            Number(
                                item.pendingAmount ||
                                0
                            );

                        if (
                            item.paymentOverdue
                        ) {
                            result.overdueAmount +=
                                Number(
                                    item.pendingAmount ||
                                    0
                                );
                        }

                        return result;
                    },
                    {
                        totalContracts: 0,
                        active: 0,
                        expiringSoon: 0,
                        critical: 0,
                        expired: 0,

                        totalValue: 0,
                        outstanding: 0,
                        overdueAmount: 0,
                    }
                );

            /*
             * Highest risk first.
             */
            const riskOrder = {
                Expired: 1,
                Critical: 2,
                "Expiring Soon": 3,
                Normal: 4,
            };

            data.sort((a, b) => {
                const riskDifference =
                    (riskOrder[
                        a.renewalRisk
                    ] || 99) -
                    (riskOrder[
                        b.renewalRisk
                    ] || 99);

                if (riskDifference !== 0) {
                    return riskDifference;
                }

                return (
                    Number(
                        a.daysLeft ?? 999999
                    ) -
                    Number(
                        b.daysLeft ?? 999999
                    )
                );
            });

            return res.json({
                success: true,
                summary,
                count: data.length,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
);
/* =========================================================
   MANAGEMENT COLLECTIONS REPORT
   GET /api/reports/management/collections

   READ ONLY

   Financial source of truth:
   AmcInvoice.totalAmount
   AmcInvoice.paidAmount
   AmcInvoice.pendingAmount
========================================================= */

router.get(
    "/management/collections",
    async (req, res, next) => {
        try {
            const AmcInvoice =
                getModel("AmcInvoice");

            const now =
                new Date();

            const invoices =
                await AmcInvoice.find({
                    isDeleted: {
                        $ne: true,
                    },

                    status: {
                        $ne: "Cancelled",
                    },
                })
                    .select({
                        invoiceCode: 1,
                        invoiceDate: 1,

                        contractCode: 1,

                        dueDate: 1,

                        clientId: 1,
                        clientCode: 1,
                        clientName: 1,

                        productCode: 1,
                        productName: 1,

                        totalAmount: 1,
                        paidAmount: 1,
                        pendingAmount: 1,

                        paymentStatus: 1,

                        createdAt: 1,
                    })
                    .sort({
                        dueDate: 1,
                        invoiceDate: -1,
                    })
                    .lean();

            const data =
                invoices.map(
                    (invoice) => {
                        const totalAmount =
                            Number(
                                invoice.totalAmount ||
                                0
                            );

                        const paidAmount =
                            Number(
                                invoice.paidAmount ||
                                0
                            );

                        const pendingAmount =
                            Number(
                                invoice.pendingAmount ||
                                0
                            );

                        const dueDate =
                            invoice.dueDate
                                ? new Date(
                                    invoice.dueDate
                                )
                                : null;

                        const isOverdue =
                            Boolean(
                                pendingAmount > 0 &&
                                dueDate &&
                                !Number.isNaN(
                                    dueDate.getTime()
                                ) &&
                                dueDate < now
                            );

                        const overdueDays =
                            isOverdue
                                ? Math.max(
                                    0,
                                    Math.floor(
                                        (
                                            now.getTime() -
                                            dueDate.getTime()
                                        ) /
                                        86400000
                                    )
                                )
                                : 0;

                        let collectionStatus =
                            "Pending";

                        if (
                            pendingAmount <= 0 &&
                            totalAmount > 0
                        ) {
                            collectionStatus =
                                "Paid";
                        } else if (
                            isOverdue
                        ) {
                            collectionStatus =
                                "Overdue";
                        } else if (
                            paidAmount > 0 &&
                            pendingAmount > 0
                        ) {
                            collectionStatus =
                                "Partially Paid";
                        }

                        return {
                            id:
                                invoice._id,

                            invoiceCode:
                                invoice.invoiceCode,

                            invoiceDate:
                                invoice.invoiceDate,

                            contractCode:
                                invoice.contractCode,

                            dueDate:
                                invoice.dueDate,

                            clientId:
                                invoice.clientId,

                            clientCode:
                                invoice.clientCode,

                            clientName:
                                invoice.clientName,

                            productCode:
                                invoice.productCode,

                            productName:
                                invoice.productName,

                            totalAmount,
                            paidAmount,
                            pendingAmount,

                            paymentStatus:
                                invoice.paymentStatus,

                            collectionStatus,

                            isOverdue,
                            overdueDays,
                        };
                    }
                );

            /*
             * Client-wise collection summary.
             */
            const clientMap =
                new Map();

            for (const item of data) {
                const key =
                    String(
                        item.clientId ||
                        item.clientCode ||
                        item.clientName ||
                        "UNKNOWN"
                    );

                if (
                    !clientMap.has(key)
                ) {
                    clientMap.set(
                        key,
                        {
                            clientId:
                                item.clientId,

                            clientCode:
                                item.clientCode,

                            clientName:
                                item.clientName,

                            invoiceCount: 0,

                            totalBilled: 0,
                            totalCollected: 0,
                            outstanding: 0,

                            overdueAmount: 0,
                            overdueInvoices: 0,
                        }
                    );
                }

                const client =
                    clientMap.get(key);

                client.invoiceCount += 1;

                client.totalBilled +=
                    Number(
                        item.totalAmount ||
                        0
                    );

                client.totalCollected +=
                    Number(
                        item.paidAmount ||
                        0
                    );

                client.outstanding +=
                    Number(
                        item.pendingAmount ||
                        0
                    );

                if (item.isOverdue) {
                    client.overdueInvoices +=
                        1;

                    client.overdueAmount +=
                        Number(
                            item.pendingAmount ||
                            0
                        );
                }
            }

            const clientSummary =
                [
                    ...clientMap.values(),
                ].sort(
                    (a, b) =>
                        Number(
                            b.outstanding ||
                            0
                        ) -
                        Number(
                            a.outstanding ||
                            0
                        )
                );

            const summary =
                data.reduce(
                    (result, item) => {
                        result.invoiceCount +=
                            1;

                        result.totalBilled +=
                            Number(
                                item.totalAmount ||
                                0
                            );

                        result.totalCollected +=
                            Number(
                                item.paidAmount ||
                                0
                            );

                        result.totalOutstanding +=
                            Number(
                                item.pendingAmount ||
                                0
                            );

                        if (
                            item.isOverdue
                        ) {
                            result.overdueInvoices +=
                                1;

                            result.overdueAmount +=
                                Number(
                                    item.pendingAmount ||
                                    0
                                );
                        }

                        if (
                            item.collectionStatus ===
                            "Paid"
                        ) {
                            result.paidInvoices +=
                                1;
                        }

                        if (
                            item.collectionStatus ===
                            "Partially Paid"
                        ) {
                            result.partialInvoices +=
                                1;
                        }

                        return result;
                    },
                    {
                        invoiceCount: 0,

                        totalBilled: 0,
                        totalCollected: 0,
                        totalOutstanding: 0,

                        overdueInvoices: 0,
                        overdueAmount: 0,

                        paidInvoices: 0,
                        partialInvoices: 0,
                    }
                );

            return res.json({
                success: true,

                summary,

                clientSummary,

                count:
                    data.length,

                data,
            });
        } catch (error) {
            next(error);
        }
    }
);
module.exports = router;