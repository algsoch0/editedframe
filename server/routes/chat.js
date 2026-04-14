const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');

const router = express.Router();

const SYSTEM_CONTEXT = {
  editor: {
    name: 'Sachin Prajapati',
    role: 'Video Editor',
    title: 'Professional Video Editor & Content Creator',
    email: 'connectwithsachin06@gmail.com',
    phone: process.env.SACHIN_PHONE || '9266141161',
    github: 'https://github.com/sachinn122',
    linkedin: 'https://www.linkedin.com/in/sachin-prajapati-20640a322/',
    avatar: 'https://github.com/sachinn122.png',
    bio: 'Sachin Prajapati is a 2nd year B.Tech student at NSUT, specializing in Mechanical Engineering (2024-2028). He runs edited.frame, creating high-quality video edits for Instagram Reels, YouTube Shorts, trading videos, educational content, and motion graphics.',
    skills: ['Video Editing', 'Motion Graphics', 'Adobe Premiere Pro', 'After Effects', 'Color Grading', 'Social Media Content'],
    turnaround: '48-72 hours',
  },
  developer: {
    name: 'Vicky Kumar',
    role: 'Developer',
    email: 'npdimagine@gmail.com',
    phone: process.env.VICKY_PHONE || '8383848219',
    github: 'https://github.com/algsoch',
    linkedin: 'https://linkedin.com/in/algsoch',
    avatar: 'https://github.com/algsoch.png',
    bio: 'Full-stack developer building edited.frame website and backend systems.',
  },
  services: [
    'Instagram Reels',
    'YouTube Shorts',
    'Trading Videos',
    'Educational Videos',
    'Motion Graphics',
    'Promo Videos',
  ],
  workflow: [
    'You share raw clips and requirements',
    'Quote and delivery timeline are provided',
    'Work starts after confirmation',
    'Final edits and revisions are delivered',
  ],
  portfolio: [
    { title: 'Candlestick Pattern', category: 'trading-reel', label: 'Trading Reels', url: 'https://res.cloudinary.com/dsuvhebce/video/upload/v1759265474/trading_1_yvgel4.mp4' },
    { title: 'Support and Resistance', category: 'trading-reel', label: 'Trading Reels', url: 'https://res.cloudinary.com/dsuvhebce/video/upload/v1759265498/trading_2_dzhim0.mp4' },
    { title: 'Forex Strategy', category: 'trading-reel', label: 'Trading Reels', url: 'https://res.cloudinary.com/dsuvhebce/video/upload/v1759265454/trading_3_qqffrq.mp4' },
    { title: 'Leverage Basics', category: 'trading-reel', label: 'Trading Reels', url: 'https://res.cloudinary.com/dsuvhebce/video/upload/v1759265483/trading_4_szfegp.mp4' },
    { title: 'Investment Guide', category: 'educational-video', label: 'Educational Videos', url: 'https://res.cloudinary.com/dsuvhebce/video/upload/v1759265286/educational_riaukp.mp4' },
    { title: 'Risk Management', category: 'educational-video', label: 'Educational Videos', url: 'https://res.cloudinary.com/dsuvhebce/video/upload/v1759265238/educational_2_b0eiey.mp4' },
    { title: 'Logo Animation', category: 'motion-graphic', label: 'Motion Graphics', url: 'https://res.cloudinary.com/dsuvhebce/video/upload/v1759265366/motion_graphic_1_cwknb2.mp4' },
    { title: 'Data Visualization', category: 'motion-graphic', label: 'Motion Graphics', url: 'https://res.cloudinary.com/dsuvhebce/video/upload/v1759265422/motion_graphic_2_uz78wz.mp4' },
    { title: 'Brand Animation', category: 'motion-graphic', label: 'Motion Graphics', url: 'https://res.cloudinary.com/dsuvhebce/video/upload/v1759265433/motion_graphic_3_yyotbn.mp4' },
    { title: 'Social Media Edit', category: 'social-media', label: 'Social Media Edits', url: 'https://res.cloudinary.com/dsuvhebce/video/upload/v1776180801/1_h2ouzq.mp4' },
  ],
};

const CATEGORY_KEYWORDS = [
  { key: 'trading-reel', regex: /trading|forex|candlestick|stock|market/i },
  { key: 'educational-video', regex: /education|educational|guide|tutorial/i },
  { key: 'motion-graphic', regex: /motion|animation|graphics/i },
  { key: 'social-media', regex: /social media|social|instagram|youtube|reel|short/i },
];

function detectCategory(text) {
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.regex.test(text)) return entry.key;
  }
  return '';
}

function buildRuleResponse(message, reviewSummary, recentReviews) {
  const text = String(message || '').toLowerCase();
  const category = detectCategory(text);
  const filteredVideos = category
    ? SYSTEM_CONTEXT.portfolio.filter((item) => item.category === category)
    : SYSTEM_CONTEXT.portfolio;

  const isPortfolioIntent = Boolean(category) || /video|videos|work|portfolio|sample|samples|show video|show work|show portfolio|category|example|examples|demo|project|projects|show .*edits?|sample .*edits?|all .*videos?/i.test(text);

  // CHECK PORTFOLIO/VIDEO KEYWORDS FIRST (before profile/sachin/service keywords)
  if (isPortfolioIntent && !/review|testimonial|feedback|client/i.test(text)) {
    return {
      reply: category
        ? `Showcasing ${filteredVideos.length} premium ${filteredVideos[0]?.label || 'portfolio'} samples. Each demonstrates Sachin's attention to detail, pacing, and visual impact.`
        : 'Featured portfolio across all categories: Trading Reels (market education), Educational Videos (tutorials), Motion Graphics (brand animations), and Social Media Edits. Browse and get inspired.',
      action: 'show_portfolio',
      data: {
        categories: ['trading-reel', 'educational-video', 'social-media', 'motion-graphic'],
        videos: filteredVideos.length ? filteredVideos : SYSTEM_CONTEXT.portfolio,
        selectedCategory: category || 'all',
      },
    };
  }

  if (/developer|who developed|who made|who built|about developer|vicky/i.test(text)) {
    return {
      reply: `${SYSTEM_CONTEXT.developer.name} (algsoch) is a full-stack developer who built and maintains edited.frame's entire tech stack—the website, backend chatbot API, and MongoDB systems. He's the technical backbone. ${SYSTEM_CONTEXT.editor.name} is the creative owner running the video editing business. ☎️ Vicky: ${SYSTEM_CONTEXT.developer.phone}`,
      action: 'show_editor',
      data: {
        editor: SYSTEM_CONTEXT.editor,
        developer: SYSTEM_CONTEXT.developer,
      },
    };
  }

  if (/sachin|who is sachin|about sachin|about editor|editor details|owner/i.test(text)) {
    return {
      reply: `${SYSTEM_CONTEXT.editor.name} is an accomplished ${SYSTEM_CONTEXT.editor.role} and 2nd year B.Tech student at NSUT (Mechanical Engineering, 2024-2028). Founder of edited.frame, he specializes in high-impact video content for Instagram Reels, YouTube Shorts, trading analysis, educational content, and motion graphics. Delivers premium quality within ${SYSTEM_CONTEXT.editor.turnaround} turnaround. Trusted by multiple clients. ☎️ ${SYSTEM_CONTEXT.editor.phone} | 📧 ${SYSTEM_CONTEXT.editor.email}`,
      action: 'show_profile',
      data: {
        profile: SYSTEM_CONTEXT.editor,
      },
    };
  }

  if (/review|testimonial|feedback|client/i.test(text)) {
    const ratingText = reviewSummary.averageRating >= 4.5 ? '⭐ Exceptional' : reviewSummary.averageRating >= 4 ? '⭐⭐ Outstanding' : '⭐⭐⭐ Great';
    return {
      reply: `Clients trust Sachin's work. ${reviewSummary.approved} verified reviews with ${ratingText} ratings (${reviewSummary.averageRating.toFixed(1)}/5). Check out what recent clients are saying.`,
      action: 'show_reviews',
      data: {
        reviews: recentReviews,
      },
    };
  }

  if (/service|what do you do|offer|edit/i.test(text)) {
    return {
      reply: `Sachin specializes in creating scroll-stopping content: ${SYSTEM_CONTEXT.services.join(', ')}. Each project gets personalized attention to match your brand voice and platform requirements. What type of video are you thinking?`,
      action: 'show_services',
      data: {
        services: SYSTEM_CONTEXT.services,
      },
    };
  }

  if (/contact|email|call|phone|reach|send/i.test(text)) {
    return {
      reply: `Direct contact options: 📱 Call/WhatsApp ☎️ ${SYSTEM_CONTEXT.editor.phone} | 📧 Email: ${SYSTEM_CONTEXT.editor.email} | Or use this chat to send your requirement and Sachin will connect within 24 hours.`,
      action: 'send_inquiry',
      data: {
        email: SYSTEM_CONTEXT.editor.email,
      },
    };
  }

  if (/price|cost|budget|charge|rate/i.test(text)) {
    return {
      reply: `Pricing is flexible & scales with your needs: Video type (Reels, Shorts, Trading, Educational, Motion Graphics), Duration (30s-5min+), Complexity (simple cuts to advanced animations), Turnaround (standard 72h or express 24-48h), and Revisions included. Message ☎️ ${SYSTEM_CONTEXT.editor.phone} or send requirement now—Sachin quotes custom rates within 2 hours.`,
      action: 'send_inquiry',
    };
  }

  if (/workflow|process|how it works|delivery/i.test(text)) {
    return {
      reply: `Simple & transparent process: 1️⃣ ${SYSTEM_CONTEXT.workflow[0]} → 2️⃣ ${SYSTEM_CONTEXT.workflow[1]} → 3️⃣ ${SYSTEM_CONTEXT.workflow[2]} → 4️⃣ ${SYSTEM_CONTEXT.workflow[3]} → 5️⃣ Ready to launch. Sachin keeps you updated at every milestone. ${SYSTEM_CONTEXT.editor.turnaround} average delivery.`,
      action: 'show_services',
    };
  }

  return {
    reply: `I can assist with: 🎬 Viewing Sachin's portfolio, 📋 Services & expertise, 💬 Client reviews, 💰 Pricing insights, 👤 About Sachin & Vicky, 📧 Direct contact, or 🚀 Sending your project brief. What interests you?`,
    action: 'none',
  };
}

async function getReviewSummary() {
  const approvedQuery = { status: 'approved', allowDisplay: true };
  const [approved, approvedItems] = await Promise.all([
    Review.countDocuments(approvedQuery),
    Review.find(approvedQuery).select('rating').limit(300),
  ]);

  const averageRating = approvedItems.length
    ? approvedItems.reduce((sum, item) => sum + (item.rating || 0), 0) / approvedItems.length
    : 0;

  return { approved, averageRating };
}

async function getRecentReviews() {
  const items = await Review.find({ status: 'approved', allowDisplay: true })
    .select('reviewerName rating projectType reviewText createdAt')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return items.map((item) => ({
    reviewerName: item.reviewerName,
    rating: item.rating,
    projectType: item.projectType,
    reviewText: item.reviewText,
    createdAt: item.createdAt,
  }));
}

async function askGroq(message) {
  const apiKey = process.env.GROQ_API;
  if (!apiKey) {
    return null;
  }

  const prompt = [
    'You are a sales chatbot for edited.frame (video editing portfolio).',
    `Editor: ${SYSTEM_CONTEXT.editor.name} (${SYSTEM_CONTEXT.editor.role})`,
    `Editor email: ${SYSTEM_CONTEXT.editor.email}`,
    `Editor phone: ${SYSTEM_CONTEXT.editor.phone || 'Not shared publicly'}`,
    `Editor GitHub: ${SYSTEM_CONTEXT.editor.github}`,
    `Editor LinkedIn: ${SYSTEM_CONTEXT.editor.linkedin}`,
    `Developer: ${SYSTEM_CONTEXT.developer.name} (${SYSTEM_CONTEXT.developer.role})`,
    `Developer email: ${SYSTEM_CONTEXT.developer.email}`,
    `Developer GitHub: ${SYSTEM_CONTEXT.developer.github}`,
    `Developer LinkedIn: ${SYSTEM_CONTEXT.developer.linkedin}`,
    `Services: ${SYSTEM_CONTEXT.services.join(', ')}`,
    `User message: ${message}`,
    'Reply in concise, persuasive style. Include CTA to contact editor.',
    'Never use placeholders like [Your Email], [Your Phone Number], or fake unknown claims for Sachin/Vicky.',
    'If asked about Sachin or Vicky, answer with the exact details from context.',
  ].join('\n');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      messages: [
        { role: 'system', content: 'You are a high-conversion assistant for a video editing portfolio.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return content ? String(content) : null;
}

router.post('/message', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const mode = String(req.body?.mode || 'rule').toLowerCase();

  if (!message) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const [reviewSummary, recentReviews] = await Promise.all([
    getReviewSummary(),
    getRecentReviews(),
  ]);
  const rule = buildRuleResponse(message, reviewSummary, recentReviews);

  if (mode === 'llm') {
    const llmReply = await askGroq(message);
    if (llmReply) {
      return res.json({
        success: true,
        mode: 'llm',
        llmStatus: 'ready',
        reply: llmReply,
        action: rule.action,
        data: rule.data || {},
      });
    }

    return res.json({
      success: true,
      mode: 'rule',
      llmStatus: process.env.GROQ_API ? 'unavailable' : 'not-configured',
      ...rule,
    });
  }

  return res.json({
    success: true,
    mode: 'rule',
    llmStatus: process.env.GROQ_API ? 'ready' : 'not-configured',
    ...rule,
  });
});

router.get('/status', async (_req, res) => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbState = mongoose.connection.readyState;
  const dbConnected = dbState === 1;

  return res.json({
    success: true,
    backend: 'online',
    database: dbConnected ? 'connected' : (stateMap[dbState] || 'unknown'),
    groq: process.env.GROQ_API ? 'configured' : 'not-configured',
  });
});

router.post('/inquiry', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const budget = String(req.body?.budget || 'Not specified').trim();
  const requirement = String(req.body?.requirement || '').trim();

  if (!name || !email || !requirement) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and requirement are required.',
    });
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('budget', budget || 'Not specified');
  formData.append('message', requirement);
  formData.append('_replyto', email);
  formData.append('_subject', `Chatbot Inquiry from ${name} - edited.frame`);
  formData.append('_to', SYSTEM_CONTEXT.editor.email);

  try {
    const response = await fetch('https://formspree.io/f/mvgqjqqg', {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: 'Inquiry service is currently unavailable. Please try again in a minute.',
      });
    }

    return res.json({
      success: true,
      message: 'Requirement sent successfully to Sachin. You will get a response soon.',
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send requirement right now. Please retry.',
    });
  }
});

module.exports = router;
