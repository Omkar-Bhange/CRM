 const express = require("express");
const mongoose = require("mongoose");
const {
  authenticateUser,
} = require("./auth");

const router = express.Router();

router.use(authenticateUser);

router.use((req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access is required.",
    });
  }

  next();
});
/* ===========================
   CLIENT SCHEMA
=========================== */

const clientSchema = new mongoose.Schema(
  {
    clientCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    contactPerson: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    mobile: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

 products: {
  type: [
    {
      productName: {
        type: String,
        required: true,
        trim: true,
      },

      version: {
        type: String,
        default: "v1.0.0",
        trim: true,
      },

      purchaseDate: {
        type: String,
        default: "",
      },

      installationDate: {
        type: String,
        default: "",
      },

      licensedUsers: {
        type: Number,
        default: 1,
        min: 1,
      },

      supportType: {
        type: String,
        enum: ["Basic", "Standard", "Premium"],
        default: "Standard",
      },

      amcStatus: {
        type: String,
        enum: [
          "Not Started",
          "Pending",
          "Paid",
          "Partially Paid",
          "Overdue",
        ],
        default: "Not Started",
      },

      expiryDate: {
        type: String,
        default: "",
      },

      installationStatus: {
        type: String,
        enum: [
          "Not Installed",
          "Installation Pending",
          "Installed",
          "Inactive",
        ],
        default: "Installed",
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },
    },
  ],
  default: [],
},

    amcStatus: {
      type: String,
      default: "Not Started",
    },

    nextRenewal: {
      type: String,
      default: "",
    },

    openTickets: {
      type: Number,
      default: 0,
    },

    assignedTo: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

const Client =
  mongoose.models.Client ||
  mongoose.model("Client", clientSchema);

  /* =====================================================
   TASK SCHEMA
===================================================== */

const taskTimelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    performedByName: {
      type: String,
      default: "",
      trim: true,
    },

    performedByRole: {
      type: String,
      enum: ["admin", "employee", "client", "system"],
      default: "system",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const taskCommentSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },

    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    authorName: {
      type: String,
      default: "",
      trim: true,
    },

    authorRole: {
      type: String,
      enum: ["admin", "employee", "client"],
      default: "admin",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const taskAttachmentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    fileType: {
      type: String,
      default: "",
      trim: true,
    },

    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    uploadedByName: {
      type: String,
      default: "",
      trim: true,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const taskSchema = new mongoose.Schema(
  {
    taskCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Task title is required."],
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    workType: {
      type: String,
      enum: [
        "Client Support",
        "Development",
        "Testing",
        "Installation",
        "Training",
        "Documentation",
        "Internal Work",
        "Follow-up",
        "Other",
      ],
      default: "Client Support",
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },

    clientName: {
      type: String,
      default: "Internal Development",
      trim: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    project: {
      type: String,
      required: [true, "Project is required."],
      trim: true,
    },

    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    ticketCode: {
      type: String,
      default: "",
      trim: true,
    },

    assignedEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Assigned employee is required."],
      index: true,
    },

    assignedEmployeeName: {
      type: String,
      required: true,
      trim: true,
    },

    assignedEmployeeCode: {
      type: String,
      default: "",
      trim: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedByName: {
      type: String,
      default: "",
      trim: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "Assigned",
        "Accepted",
        "In Progress",
        "Paused",
        "Waiting",
        "Testing",
        "Completed",
        "Verified",
        "Closed",
        "Cancelled",
      ],
      default: "Assigned",
      index: true,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    startDate: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      required: [true, "Due date is required."],
      index: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    estimatedMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    spentMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },

    resolutionNote: {
      type: String,
      default: "",
      trim: true,
    },

    timeline: {
      type: [taskTimelineSchema],
      default: [],
    },

    comments: {
      type: [taskCommentSchema],
      default: [],
    },

    attachments: {
      type: [taskAttachmentSchema],
      default: [],
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "tasks",
  }
);

const Task =
  mongoose.models.Task ||
  mongoose.model("Task", taskSchema);

  /* =====================================================
   TASK HELPERS
===================================================== */

function generateTaskCode() {
  const year = new Date().getFullYear();

  const uniquePart = `${Date.now()}${Math.floor(
    Math.random() * 1000
  )
    .toString()
    .padStart(3, "0")}`.slice(-8);

  return `TSK-${year}-${uniquePart}`;
}

function normalizeObjectId(value) {
  if (!value) {
    return null;
  }

  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
}

function taskResponse(task) {
  return {
    id: task._id,
    _id: task._id,
    taskCode: task.taskCode,
    title: task.title,
    description: task.description,
    workType: task.workType,

    clientId: task.clientId,
    clientName: task.clientName,

    productId: task.productId,
    project: task.project,

    ticketId: task.ticketId,
    ticketCode: task.ticketCode,

    assignedEmployeeId: task.assignedEmployeeId,
    assignedEmployeeName: task.assignedEmployeeName,
    assignedEmployeeCode: task.assignedEmployeeCode,

    assignedBy: task.assignedBy,
    assignedByName: task.assignedByName,

    priority: task.priority,
    status: task.status,
    progress: task.progress,

    startDate: task.startDate,
    dueDate: task.dueDate,
    completedAt: task.completedAt,

    estimatedMinutes: task.estimatedMinutes,
    spentMinutes: task.spentMinutes,

    resolutionNote: task.resolutionNote,

    timeline: task.timeline,
    comments: task.comments,
    attachments: task.attachments,

    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

async function findEmployeeById(employeeId) {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return null;
  }

  return mongoose.connection
    .collection("employees")
    .findOne({
      _id: new mongoose.Types.ObjectId(employeeId),
      isActive: {
        $ne: false,
      },
    });
}

async function updateEmployeeTaskSummary(
  employeeId,
  changes
) {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return;
  }

  await mongoose.connection
    .collection("employees")
    .updateOne(
      {
        _id: new mongoose.Types.ObjectId(employeeId),
      },
      changes
    );
}

/* =====================================================
   ADD CLIENT
===================================================== */

router.post("/client", async (req, res) => {
  try {
    const {
      clientCode,
      companyName,
      contactPerson,
      email,
      mobile,
      city,
      products,
      amcStatus,
      nextRenewal,
      openTickets,
      assignedTo,
      status,
    } = req.body;

    if (!clientCode || !companyName) {
      return res.status(400).json({
        success: false,
        message: "Client Code and Company Name are required.",
      });
    }

    const existing = await Client.findOne({
      clientCode,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Client Code already exists.",
      });
    }

   const client = await Client.create({
  clientCode,
  companyName,
  contactPerson,
  email,
  mobile,
  city,

  products: Array.isArray(products)
    ? products.map((product) => {
        if (typeof product === "string") {
          return {
            productName: product.trim(),
            version: "v1.0.0",
            purchaseDate: "",
            installationDate: "",
            licensedUsers: 1,
            supportType: "Standard",
            amcStatus: amcStatus || "Not Started",
            expiryDate: nextRenewal || "",
            installationStatus: "Installed",
            notes: "",
          };
        }

        return product;
      })
    : [],

  amcStatus,
  nextRenewal,
  openTickets,
  assignedTo,
  status,
});

    res.status(201).json({
      success: true,
      message: "Client added successfully.",
      data: client,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* =====================================================
   GET ALL CLIENTS
===================================================== */

router.get("/clients", async (req, res) => {
  try {
    const clients = await Client.find().sort({
      companyName: 1,
    });

    res.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
/* =====================================================
   UPDATE CLIENT
===================================================== */

router.put("/client/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID.",
      });
    }

    const {
      clientCode,
      companyName,
      contactPerson,
      email,
      mobile,
      city,
      products,
      amcStatus,
      nextRenewal,
      openTickets,
      assignedTo,
      status,
    } = req.body;

    if (!clientCode || !companyName) {
      return res.status(400).json({
        success: false,
        message: "Client code and company name are required.",
      });
    }

    const duplicateCode = await Client.findOne({
      clientCode: String(clientCode).trim(),
      _id: { $ne: id },
    });

    if (duplicateCode) {
      return res.status(409).json({
        success: false,
        message: "Another client already uses this client code.",
      });
    }

    if (mobile) {
      const duplicateMobile = await Client.findOne({
        mobile: String(mobile).trim(),
        _id: { $ne: id },
      });

      if (duplicateMobile) {
        return res.status(409).json({
          success: false,
          message: "Another client already uses this mobile number.",
        });
      }
    }

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      {
        clientCode: String(clientCode).trim(),
        companyName: String(companyName).trim(),
        contactPerson: String(contactPerson || "").trim(),
        email: String(email || "").trim().toLowerCase(),
        mobile: String(mobile || "").trim(),
        city: String(city || "").trim(),
        products: Array.isArray(products) ? products : [],
        amcStatus: amcStatus || "Not Started",
        nextRenewal: nextRenewal || "",
        openTickets: Number(openTickets || 0),
        assignedTo: String(assignedTo || "").trim() || "Unassigned",
        status: status || "Active",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedClient) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client updated successfully.",
      data: updatedClient,
    });
  } catch (error) {
    console.error("Update client error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update client.",
    });
  }
});
/* =====================================================
   DELETE CLIENT
===================================================== */

router.delete("/client/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID.",
      });
    }

    const deletedClient = await Client.findByIdAndDelete(id);

    if (!deletedClient) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client deleted successfully.",
      data: {
        id: deletedClient._id,
        clientCode: deletedClient.clientCode,
        companyName: deletedClient.companyName,
      },
    });
  } catch (error) {
    console.error("Delete client error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to delete client.",
    });
  }
});
/* =====================================================
   ASSIGN PRODUCT TO CLIENT
   POST /api/admin/client/:id/product
===================================================== */

router.post("/client/:id/product", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID.",
      });
    }

    const {
      productName,
      version,
      purchaseDate,
      installationDate,
      licensedUsers,
      supportType,
      amcStatus,
      expiryDate,
      installationStatus,
      notes,
    } = req.body;

    if (!productName || !String(productName).trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    /*
      Convert any old string products into proper product objects.
      This protects clients saved before this schema change.
    */
    client.products = (client.products || []).map((product) => {
      if (typeof product === "string") {
        return {
          productName: product,
          version: "v1.0.0",
          purchaseDate: "",
          installationDate: "",
          licensedUsers: 1,
          supportType: "Standard",
          amcStatus: client.amcStatus || "Not Started",
          expiryDate: client.nextRenewal || "",
          installationStatus: "Installed",
          notes: "",
        };
      }

      return product;
    });

    const normalizedProductName = String(productName)
      .trim()
      .toLowerCase();

    const duplicateProduct = client.products.some(
      (product) =>
        String(product.productName || "")
          .trim()
          .toLowerCase() === normalizedProductName
    );

    if (duplicateProduct) {
      return res.status(409).json({
        success: false,
        message: "This product is already assigned to the client.",
      });
    }

    client.products.push({
      productName: String(productName).trim(),
      version: String(version || "v1.0.0").trim(),
      purchaseDate: purchaseDate || "",
      installationDate: installationDate || "",
      licensedUsers: Math.max(Number(licensedUsers || 1), 1),
      supportType: supportType || "Standard",
      amcStatus: amcStatus || "Not Started",
      expiryDate: expiryDate || "",
      installationStatus: installationStatus || "Installed",
      notes: String(notes || "").trim(),
    });

    await client.save();

    return res.status(201).json({
      success: true,
      message: "Product assigned successfully.",
      data: client,
    });
  } catch (error) {
    console.error("Assign client product error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to assign product to client.",
    });
  }
});
/* =====================================================
   UPDATE CLIENT PRODUCT
   PUT /api/admin/client/:clientId/product/:productId
===================================================== */

router.put(
  "/client/:clientId/product/:productId",
  async (req, res) => {
    try {
      const { clientId, productId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid client ID.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const {
        productName,
        version,
        purchaseDate,
        installationDate,
        licensedUsers,
        supportType,
        amcStatus,
        expiryDate,
        installationStatus,
        notes,
      } = req.body;

      if (!productName || !String(productName).trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name is required.",
        });
      }

      const client = await Client.findById(clientId);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found.",
        });
      }

      const product = client.products.id(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      const normalizedProductName = String(productName)
        .trim()
        .toLowerCase();

      const duplicateProduct = client.products.some(
        (currentProduct) =>
          String(currentProduct._id) !== String(productId) &&
          String(currentProduct.productName || "")
            .trim()
            .toLowerCase() === normalizedProductName
      );

      if (duplicateProduct) {
        return res.status(409).json({
          success: false,
          message:
            "Another assigned product already uses this product name.",
        });
      }

      product.productName = String(productName).trim();
      product.version = String(version || "v1.0.0").trim();
      product.purchaseDate = purchaseDate || "";
      product.installationDate = installationDate || "";
      product.licensedUsers = Math.max(
        Number(licensedUsers || 1),
        1
      );
      product.supportType = supportType || "Standard";
      product.amcStatus = amcStatus || "Not Started";
      product.expiryDate = expiryDate || "";
      product.installationStatus =
        installationStatus || "Installed";
      product.notes = String(notes || "").trim();

      await client.save();

      return res.status(200).json({
        success: true,
        message: "Product updated successfully.",
        data: client,
      });
    } catch (error) {
      console.error("Update client product error:", error);

      return res.status(500).json({
        success: false,
        message:
          error.message || "Unable to update product.",
      });
    }
  }
);
/* =====================================================
   DELETE CLIENT PRODUCT
   DELETE /api/admin/client/:clientId/product/:productId
===================================================== */

router.delete(
  "/client/:clientId/product/:productId",
  async (req, res) => {
    try {
      const { clientId, productId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid client ID.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const client = await Client.findById(clientId);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found.",
        });
      }

      const product = client.products.id(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      client.products.pull(productId);

      await client.save();

      return res.status(200).json({
        success: true,
        message: "Product deleted successfully.",
        data: client,
      });
    } catch (error) {
      console.error("Delete client product error:", error);

      return res.status(500).json({
        success: false,
        message:
          error.message || "Unable to delete product.",
      });
    }
  }
);  
/* =====================================================
   CREATE TASK
   POST /api/admin/task
===================================================== */

router.post("/task", async (req, res) => {
  try {
    const {
      title,
      description,
      workType,
      clientId,
      clientName,
      productId,
      project,
      ticketId,
      ticketCode,
      assignedEmployeeId,
      priority,
      dueDate,
      estimatedMinutes,
    } = req.body;

    if (!String(title || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required.",
      });
    }

    if (!String(project || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Project is required.",
      });
    }

    if (!assignedEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Please select an employee.",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: "Task due date is required.",
      });
    }

    const employee = await findEmployeeById(
      assignedEmployeeId
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message:
          "Selected employee was not found or is inactive.",
      });
    }

    if (
      employee.status === "Leave" ||
      employee.status === "Inactive"
    ) {
      return res.status(400).json({
        success: false,
        message: `Task cannot be assigned because ${employee.name} is ${employee.status.toLowerCase()}.`,
      });
    }

    let resolvedClientName =
      String(clientName || "").trim() ||
      "Internal Development";

    let resolvedClientId = null;

    if (clientId) {
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid client ID.",
        });
      }

      const client = await Client.findById(clientId);

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Selected client was not found.",
        });
      }

      resolvedClientId = client._id;
      resolvedClientName = client.companyName;
    }

    const task = await Task.create({
      taskCode: generateTaskCode(),

      title: String(title).trim(),
      description: String(description || "").trim(),

      workType: workType || "Client Support",

      clientId: resolvedClientId,
      clientName: resolvedClientName,

      productId: normalizeObjectId(productId),
      project: String(project).trim(),

      ticketId: normalizeObjectId(ticketId),
      ticketCode: String(ticketCode || "").trim(),

      assignedEmployeeId: employee._id,
      assignedEmployeeName: employee.name,
      assignedEmployeeCode:
        employee.employeeCode || "",

      assignedBy: req.user._id,
      assignedByName: req.user.name || "",

      priority: priority || "Medium",
      status: "Assigned",
      progress: 0,

      dueDate: new Date(dueDate),

      estimatedMinutes: Math.max(
        Number(estimatedMinutes || 0),
        0
      ),

      timeline: [
        {
          action: "Task Created",
          description: `Task created and assigned to ${employee.name}.`,
          performedBy: req.user._id,
          performedByName: req.user.name || "Admin",
          performedByRole: "admin",
        },
      ],
    });

    await updateEmployeeTaskSummary(employee._id, {
      $inc: {
        openTasks: 1,
      },

      $set: {
        status: "Working",
        currentTask: task.title,
        currentClient: task.clientName,
        currentProject: task.project,
        lastActivityAt: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Task created and assigned successfully.",
      data: taskResponse(task),
    });
  } catch (error) {
    console.error("Create task error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Task code conflict occurred. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to create task.",
    });
  }
});

/* =====================================================
   GET ALL TASKS
   GET /api/admin/tasks
===================================================== */

router.get("/tasks", async (req, res) => {
  try {
    const {
      search = "",
      status = "All",
      priority = "All",
      employeeId = "",
      clientId = "",
      project = "",
    } = req.query;

    const query = {
      isDeleted: false,
    };

    if (status !== "All") {
      query.status = status;
    }

    if (priority !== "All") {
      query.priority = priority;
    }

    if (
      employeeId &&
      mongoose.Types.ObjectId.isValid(employeeId)
    ) {
      query.assignedEmployeeId =
        new mongoose.Types.ObjectId(employeeId);
    }

    if (
      clientId &&
      mongoose.Types.ObjectId.isValid(clientId)
    ) {
      query.clientId =
        new mongoose.Types.ObjectId(clientId);
    }

    if (String(project).trim()) {
      query.project = {
        $regex: String(project).trim(),
        $options: "i",
      };
    }

    const normalizedSearch = String(search).trim();

    if (normalizedSearch) {
      query.$or = [
        {
          taskCode: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          title: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          description: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          clientName: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          project: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
        {
          assignedEmployeeName: {
            $regex: normalizedSearch,
            $options: "i",
          },
        },
      ];
    }

    const tasks = await Task.find(query).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks.map(taskResponse),
    });
  } catch (error) {
    console.error("Load tasks error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to load tasks.",
    });
  }
});

/* =====================================================
   GET ONE TASK
   GET /api/admin/task/:id
===================================================== */

router.get("/task/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: taskResponse(task),
    });
  } catch (error) {
    console.error("Get task error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to load task.",
    });
  }
});

/* =====================================================
   UPDATE TASK
   PUT /api/admin/task/:id
===================================================== */

router.put("/task/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const previousEmployeeId = String(
      task.assignedEmployeeId
    );

    const {
      title,
      description,
      workType,
      clientId,
      clientName,
      productId,
      project,
      ticketId,
      ticketCode,
      assignedEmployeeId,
      priority,
      status,
      progress,
      dueDate,
      estimatedMinutes,
      resolutionNote,
    } = req.body;

    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title cannot be empty.",
        });
      }

      task.title = String(title).trim();
    }

    if (description !== undefined) {
      task.description =
        String(description || "").trim();
    }

    if (workType !== undefined) {
      task.workType = workType;
    }

    if (project !== undefined) {
      if (!String(project).trim()) {
        return res.status(400).json({
          success: false,
          message: "Project cannot be empty.",
        });
      }

      task.project = String(project).trim();
    }

    if (clientId !== undefined) {
      if (!clientId) {
        task.clientId = null;
        task.clientName =
          String(clientName || "").trim() ||
          "Internal Development";
      } else {
        if (!mongoose.Types.ObjectId.isValid(clientId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid client ID.",
          });
        }

        const client = await Client.findById(clientId);

        if (!client) {
          return res.status(404).json({
            success: false,
            message: "Selected client was not found.",
          });
        }

        task.clientId = client._id;
        task.clientName = client.companyName;
      }
    } else if (clientName !== undefined) {
      task.clientName =
        String(clientName || "").trim() ||
        "Internal Development";
    }

    if (productId !== undefined) {
      task.productId =
        normalizeObjectId(productId);
    }

    if (ticketId !== undefined) {
      task.ticketId =
        normalizeObjectId(ticketId);
    }

    if (ticketCode !== undefined) {
      task.ticketCode =
        String(ticketCode || "").trim();
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    if (dueDate !== undefined) {
      task.dueDate = new Date(dueDate);
    }

    if (estimatedMinutes !== undefined) {
      task.estimatedMinutes = Math.max(
        Number(estimatedMinutes || 0),
        0
      );
    }

    if (resolutionNote !== undefined) {
      task.resolutionNote =
        String(resolutionNote || "").trim();
    }

    if (progress !== undefined) {
      task.progress = Math.min(
        Math.max(Number(progress || 0), 0),
        100
      );
    }

    if (status !== undefined) {
      task.status = status;

      if (
        status === "In Progress" &&
        !task.startDate
      ) {
        task.startDate = new Date();
      }

      if (
        status === "Completed" ||
        status === "Closed"
      ) {
        task.progress = 100;
        task.completedAt =
          task.completedAt || new Date();
      } else {
        task.completedAt = null;
      }
    }

    if (
      assignedEmployeeId &&
      String(assignedEmployeeId) !==
        previousEmployeeId
    ) {
      const newEmployee = await findEmployeeById(
        assignedEmployeeId
      );

      if (!newEmployee) {
        return res.status(404).json({
          success: false,
          message:
            "Selected employee was not found or is inactive.",
        });
      }

      task.assignedEmployeeId = newEmployee._id;
      task.assignedEmployeeName = newEmployee.name;
      task.assignedEmployeeCode =
        newEmployee.employeeCode || "";

      task.timeline.push({
        action: "Task Reassigned",
        description: `Task reassigned to ${newEmployee.name}.`,
        performedBy: req.user._id,
        performedByName:
          req.user.name || "Admin",
        performedByRole: "admin",
      });

      await updateEmployeeTaskSummary(
        previousEmployeeId,
        {
          $inc: {
            openTasks: -1,
          },
          $set: {
            lastActivityAt: new Date(),
          },
        }
      );

      await updateEmployeeTaskSummary(
        newEmployee._id,
        {
          $inc: {
            openTasks: 1,
          },
          $set: {
            status: "Working",
            currentTask: task.title,
            currentClient: task.clientName,
            currentProject: task.project,
            lastActivityAt: new Date(),
          },
        }
      );
    } else {
      task.timeline.push({
        action: "Task Updated",
        description:
          "Task details were updated by Admin.",
        performedBy: req.user._id,
        performedByName:
          req.user.name || "Admin",
        performedByRole: "admin",
      });
    }

    await task.save();

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      data: taskResponse(task),
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to update task.",
    });
  }
});

/* =====================================================
   UPDATE TASK STATUS
   PATCH /api/admin/task/:id/status
===================================================== */

router.patch("/task/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, resolutionNote } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const previousStatus = task.status;

    task.status = status;

    if (progress !== undefined) {
      task.progress = Math.min(
        Math.max(Number(progress || 0), 0),
        100
      );
    }

    if (resolutionNote !== undefined) {
      task.resolutionNote =
        String(resolutionNote || "").trim();
    }

    if (
      status === "In Progress" &&
      !task.startDate
    ) {
      task.startDate = new Date();
    }

    const isCompleted =
      status === "Completed" ||
      status === "Closed";

    const wasCompleted =
      previousStatus === "Completed" ||
      previousStatus === "Closed";

    if (isCompleted) {
      task.progress = 100;
      task.completedAt =
        task.completedAt || new Date();
    } else {
      task.completedAt = null;
    }

    task.timeline.push({
      action: "Status Changed",
      description: `Status changed from ${previousStatus} to ${status}.`,
      performedBy: req.user._id,
      performedByName:
        req.user.name || "Admin",
      performedByRole: "admin",
    });

    await task.save();

    if (isCompleted && !wasCompleted) {
      await updateEmployeeTaskSummary(
        task.assignedEmployeeId,
        {
          $inc: {
            openTasks: -1,
            completedToday: 1,
          },

          $set: {
            status: "Free",
            currentTask:
              "Available for assignment",
            currentClient: "—",
            currentProject: "—",
            lastActivityAt: new Date(),
          },
        }
      );
    }

    if (!isCompleted && wasCompleted) {
      await updateEmployeeTaskSummary(
        task.assignedEmployeeId,
        {
          $inc: {
            openTasks: 1,
            completedToday: -1,
          },

          $set: {
            status: "Working",
            currentTask: task.title,
            currentClient: task.clientName,
            currentProject: task.project,
            lastActivityAt: new Date(),
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully.",
      data: taskResponse(task),
    });
  } catch (error) {
    console.error("Update task status error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to update task status.",
    });
  }
});

/* =====================================================
   ADD TASK COMMENT
   POST /api/admin/task/:id/comment
===================================================== */

router.post("/task/:id/comment", async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    if (!String(message || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    task.comments.push({
      message: String(message).trim(),
      authorId: req.user._id,
      authorName: req.user.name || "Admin",
      authorRole: "admin",
    });

    task.timeline.push({
      action: "Comment Added",
      description: "Admin added a task comment.",
      performedBy: req.user._id,
      performedByName:
        req.user.name || "Admin",
      performedByRole: "admin",
    });

    await task.save();

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      data: taskResponse(task),
    });
  } catch (error) {
    console.error("Add task comment error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to add comment.",
    });
  }
});

/* =====================================================
   SOFT DELETE TASK
   DELETE /api/admin/task/:id
===================================================== */

router.delete("/task/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const wasOpen = ![
      "Completed",
      "Closed",
      "Cancelled",
    ].includes(task.status);

    task.isDeleted = true;

    task.timeline.push({
      action: "Task Deleted",
      description:
        "Task was removed by Admin.",
      performedBy: req.user._id,
      performedByName:
        req.user.name || "Admin",
      performedByRole: "admin",
    });

    await task.save();

    if (wasOpen) {
      await updateEmployeeTaskSummary(
        task.assignedEmployeeId,
        {
          $inc: {
            openTasks: -1,
          },
          $set: {
            lastActivityAt: new Date(),
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
      data: {
        id: task._id,
        taskCode: task.taskCode,
        title: task.title,
      },
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to delete task.",
    });
  }
});
module.exports = router;