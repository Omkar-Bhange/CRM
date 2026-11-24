"use strict";

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authenticateUser = require("../authMiddleware");
const KnowledgeBaseArticle = require("../models/KnowledgeBaseArticle");
const AppCounter = require("../models/AppCounter");

async function getNextArticleCode() {
  const year = new Date().getFullYear();
  const counter = await AppCounter.findByIdAndUpdate(
    `kb_art_${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `KB-${year}-${String(counter.seq).padStart(4, "0")}`;
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* =========================================================
   PUBLIC / CLIENT ACCESSIBLE ARTICLE LIST
   GET /api/kb/articles
========================================================= */
router.get("/articles", async (req, res, next) => {
  try {
    const { category = "All", productId, search = "", limit = 50, page = 1 } = req.query;
    const query = { isDeleted: false, isPublished: true };

    if (category && category !== "All") query.category = category;
    if (productId && mongoose.Types.ObjectId.isValid(productId)) query.productId = productId;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ title: regex }, { summary: regex }, { tags: regex }, { content: regex }];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [articles, total, categories] = await Promise.all([
      KnowledgeBaseArticle.find(query)
        .select("-content") // Exclude full content in list view for performance
        .populate("productId", "name productCode")
        .sort({ viewCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      KnowledgeBaseArticle.countDocuments(query),
      KnowledgeBaseArticle.aggregate([
        { $match: { isDeleted: false, isPublished: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      count: articles.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      categories: categories.map((c) => ({ category: c._id, count: c.count })),
      data: articles,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   GET ARTICLE DETAILS BY SLUG OR ID (Public / Client)
   GET /api/kb/articles/:slug
========================================================= */
router.get("/articles/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;

    const isId = mongoose.Types.ObjectId.isValid(slug);
    const filter = isId ? { _id: slug, isDeleted: false } : { slug, isDeleted: false };

    const article = await KnowledgeBaseArticle.findOneAndUpdate(
      filter,
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate("productId", "name productCode category")
      .lean();

    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    return res.status(200).json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   VOTE HELPFUL / NOT HELPFUL (Feedback)
   POST /api/kb/articles/:id/vote
========================================================= */
router.post("/articles/:id/vote", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;

    const updateField = helpful ? "helpfulCount" : "notHelpfulCount";

    const article = await KnowledgeBaseArticle.findByIdAndUpdate(
      id,
      { $inc: { [updateField]: 1 } },
      { new: true }
    ).lean();

    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Thank you for your feedback!",
      data: {
        helpfulCount: article.helpfulCount,
        notHelpfulCount: article.notHelpfulCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   ADMIN MANAGEMENT ROUTES BELOW
========================================================= */
router.use(authenticateUser);

/* =========================================================
   CREATE ARTICLE (Admin only)
   POST /api/kb/articles
========================================================= */
router.post("/", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const {
      title,
      category = "FAQs",
      productId = null,
      productName = "",
      summary = "",
      content,
      tags = [],
      isPublic = true,
      isPublished = true,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required." });
    }

    const articleCode = await getNextArticleCode();
    let slug = slugify(title);

    // Ensure unique slug
    const existing = await KnowledgeBaseArticle.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const newArticle = new KnowledgeBaseArticle({
      articleCode,
      title: title.trim(),
      slug,
      category,
      productId: productId && mongoose.Types.ObjectId.isValid(productId) ? productId : null,
      productName: productName.trim(),
      summary: summary.trim(),
      content,
      tags: Array.isArray(tags) ? tags : [],
      isPublic: Boolean(isPublic),
      isPublished: Boolean(isPublished),
      authorId: req.user._id,
      authorName: req.user.name || "Nexora Team",
    });

    await newArticle.save();

    return res.status(201).json({
      success: true,
      message: "Article published successfully.",
      data: newArticle,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   UPDATE ARTICLE (Admin only)
   PATCH /api/kb/articles/:id
========================================================= */
router.patch("/:id", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const { id } = req.params;
    const article = await KnowledgeBaseArticle.findOne({ _id: id, isDeleted: false });
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    const fields = [
      "title",
      "category",
      "productId",
      "productName",
      "summary",
      "content",
      "tags",
      "isPublic",
      "isPublished",
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        article[f] = req.body[f];
      }
    });

    if (req.body.title && req.body.title !== article.title) {
      article.slug = `${slugify(req.body.title)}-${Date.now().toString().slice(-4)}`;
    }

    await article.save();

    return res.status(200).json({
      success: true,
      message: "Article updated successfully.",
      data: article,
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   DELETE ARTICLE (Admin only - Soft delete)
   DELETE /api/kb/articles/:id
========================================================= */
router.delete("/:id", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const { id } = req.params;
    const article = await KnowledgeBaseArticle.findOne({ _id: id, isDeleted: false });
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    article.isDeleted = true;
    await article.save();

    return res.status(200).json({ success: true, message: "Article deleted successfully." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
