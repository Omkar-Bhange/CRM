"use strict";

const mongoose = require("mongoose");

/* =====================================================
   KNOWLEDGE BASE ARTICLE SCHEMA
===================================================== */
const knowledgeBaseArticleSchema = new mongoose.Schema(
  {
    articleCode: {
      type: String,
      required: [true, "Article code is required."],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Article title is required."],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "Getting Started",
        "AMC & Renewals",
        "Billing & Invoicing",
        "Support Tickets",
        "Installation & Setup",
        "Troubleshooting",
        "User Guide",
        "FAQs",
        "Other",
      ],
      default: "FAQs",
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },
    productName: {
      type: String,
      default: "",
      trim: true,
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Article content is required."],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notHelpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    authorName: {
      type: String,
      default: "Nexora Support Team",
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "knowledge_base_articles",
  }
);

knowledgeBaseArticleSchema.index({ title: "text", summary: "text", content: "text", tags: "text" });

const KnowledgeBaseArticle =
  mongoose.models.KnowledgeBaseArticle ||
  mongoose.model("KnowledgeBaseArticle", knowledgeBaseArticleSchema);

module.exports = KnowledgeBaseArticle;
