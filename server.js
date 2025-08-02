const express = require('express');
const nodemailer = require('nodemailer');
const { jsPDF } = require('jspdf');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Style descriptions (same as client-side, repeated for PDF generation)
const styleDescriptions = {
  A: {
    title: 'Laser Thinker (Focused Thinker)',
    core: 'You are intentional and precise. Once you set your mind on a task, you lock in and block out noise. You like clarity, structure, and defined goals. You are dependable, detail-oriented, and steady. People value your ability to bring order to complexity and to deliver consistent results even in demanding situations.',
    strengths: [
      'Cuts through distractions with discipline and focus.',
      'Brings clarity in chaotic or complex situations.',
      'Finishes tasks reliably and consistently.',
      'Strong in analytical, compliance-heavy, and detail-oriented work.'
    ],
    watchOuts: [
      'Can miss creative opportunities by being too rigid or narrow.',
      'May struggle in fluid, ambiguous, or fast-changing settings.',
      'Might prioritize efficiency over exploration or innovation.'
    ],
    growth: [
      'Practice stepping back regularly to see the bigger picture.',
      'Allow space for curiosity and creative thought.',
      'Partner with Explorers or Visionaries for balance.',
      'Remember: focus is your gift, but flexibility broadens impact.'
    ],
    careers: 'Data analysts or auditors — working with patterns, accuracy, and uncovering hidden insights. Engineers or surgeons — excelling in precision-driven, high-stakes environments where errors are costly. Project managers — ensuring structured task execution, timelines, and accountability. Quality assurance specialists — spotting details and ensuring compliance with standards. Any role where attention to fine detail, reliability, and methodical execution are crucial.'
  },
  B: {
    title: 'Explorer Thinker (Curious Innovator)',
    core: 'You are energized by variety and novelty. You enjoy discovering possibilities and brainstorming ideas. You thrive in dynamic, fast-changing environments and adapt quickly to new information. People see you as creative, flexible, and full of fresh perspectives. You are often the source of innovation in a team.',
    strengths: [
      'Highly creative and adaptable, thriving on change.',
      'Connects ideas others don’t see and generates new approaches.',
      'Energizes teams with enthusiasm and curiosity.',
      'Quick to learn and unafraid of experimentation.'
    ],
    watchOuts: [
      'May struggle with discipline and follow-through on projects.',
      'Risk of scattering energy across too many directions.',
      'Can overwhelm others with too many ideas at once.'
    ],
    growth: [
      'Channel curiosity into chosen priorities to build depth.',
      'Use accountability and deadlines to ensure completion.',
      'Balance exploration with focused execution.',
      'Learn to prune ideas and focus on the most impactful ones.'
    ],
    careers: 'Marketing and advertising professionals — developing creative campaigns and fresh strategies. Entrepreneurs and startup founders — spotting gaps and experimenting with solutions. Consultants and journalists — thriving in environments that require curiosity, learning, and adaptability. Creative designers and R&D specialists — innovating and imagining future possibilities. Any role where novelty, ideation, and adaptability are highly valued.'
  },
  C: {
    title: 'Mood-Led Thinker (Emotional Reactor)',
    core: 'You think with your emotions. Inspiration fuels you, and when you’re passionate, you give everything. You value authenticity and connection, and people are drawn to your warmth. You bring an emotional lens that others often overlook, giving depth to relationships and meaning to work.',
    strengths: [
      'Strong emotional intelligence and natural empathy.',
      'Authentic, relatable, and trustworthy to others.',
      'Can deeply inspire and motivate teams when engaged.',
      'Brings humanity and sensitivity to decision-making.'
    ],
    watchOuts: [
      'Moods can fluctuate, affecting consistency in work.',
      'Risk of emotional reactivity or over-identification with feelings.',
      'Can allow temporary emotions to cloud long-term judgment.'
    ],
    growth: [
      'Develop anchor habits and structures that steady productivity.',
      'Practice emotional regulation and reflection before acting.',
      'Surround yourself with steady partners for balance.',
      'Channel emotions into storytelling, empathy, and motivation.'
    ],
    careers: 'Counselors, coaches, or therapists — using empathy to support others. HR professionals or mediators — resolving conflicts with emotional insight. Teachers and performers — connecting deeply with audiences or students. Customer service and hospitality roles — excelling in warmth and emotional care. Any role that requires authenticity, relationship-building, and emotional resonance.'
  },
  D: {
    title: 'Driver Thinker (Action-Oriented Doer)',
    core: 'You are wired for results. Thinking for you quickly becomes action. You are pragmatic, outcome-driven, and thrive on getting things done. You inspire momentum and progress wherever you go.',
    strengths: [
      'Relentless drive to achieve results and complete tasks.',
      'Creates urgency and energy that moves teams forward.',
      'Excellent at breaking down goals into actionable steps.',
      'Resilient in high-pressure environments and deadline-driven work.'
    ],
    watchOuts: [
      'Can push too hard and risk impatience with others.',
      'May neglect strategy, creativity, or emotions in pursuit of results.',
      'Risk of burnout from constant urgency and intensity.'
    ],
    growth: [
      'Pause and reflect before rushing into solutions.',
      'Listen carefully to diverse perspectives before acting.',
      'Partner with Visionaries for strategy and Mood-Led thinkers for empathy.',
      'Build sustainable pacing instead of operating only in overdrive.'
    ],
    careers: 'Operations managers or project leaders — ensuring tasks are executed efficiently. Sales professionals — driving revenue through relentless action and persistence. Entrepreneurs or military leaders — thriving under pressure and moving decisively. Emergency response professionals — acting quickly and effectively in crises. Any role where determination, quick execution, and resilience are essential.'
  },
  E: {
    title: 'Visionary Thinker (Big-Picture Thinker)',
    core: 'You are future-focused. You see patterns, meaning, and long-term opportunities. While others are immersed in today, you are already imagining tomorrow. People value your ability to inspire, cast vision, and connect events into purpose-driven direction.',
    strengths: [
      'Sees patterns and possibilities others miss.',
      'Inspires with long-term vision and clarity of purpose.',
      'Brings meaning and direction to current efforts.',
      'Strong in strategy, storytelling, and foresight.'
    ],
    watchOuts: [
      'Can overlook execution details or underestimate timelines.',
      'Risk of being seen as unrealistic or impractical.',
      'May lose patience with operational or repetitive work.'
    ],
    growth: [
      'Translate vision into actionable milestones and measurable outcomes.',
      'Collaborate with Drivers and Lasers to execute plans.',
      'Balance imagination with practical realities and resources.',
      'Ground ideas in clear steps to build credibility and momentum.'
    ],
    careers: 'CEOs, strategists, or policy-makers — shaping long-term direction and purpose. Futurists, writers, or educators — inspiring others with insight and foresight. Innovators or faith leaders — pointing people toward bigger possibilities. Consultants and thought leaders — synthesizing patterns into strategy. Any role where vision, purpose, and big-picture strategy are essential.'
  }
};

// Email configuration (replace with your SMTP details)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-specific-password'
  }
});

// API endpoint to generate and send PDF
app.post('/send-pdf', async (req, res) => {
  try {
    const { name, email, dominantStyles, supportingStyle, balanceMessage, counts } = req.body;

    // Generate PDF
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const logoBase64 = "data:image/png;base64,iVBkdIYRMCJM7QgiZECZ3hBAyIUzuCCFkQpjcEULIhDC5I4SQCWFyRwghE8LkjhBkQpjcEULIhDC5I4SQCWFyRwghE8LkjhBCJoTJHSGETOj/A0YSHiRTmCNmAAAAAElFTkSuQmCC";

    // Define Colors and Fonts
    const primaryColor = [42, 77, 105]; // #2a4d69
    const secondaryColor = [200, 200, 200]; // Light gray
    const accentColor = [100, 100, 100]; // Darker gray for emphasis
    doc.setFont("helvetica", "normal");

    // Helper Function for Header
    const addHeader = (pageNum) => {
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Ergos Mind - Mindstyle Assessment", margin + 50, 35);
      doc.setFontSize(10);
      doc.text(`Page ${pageNum}`, pageWidth - margin - 30, 35);
      try {
        doc.addImage(logoBase64, 'PNG', margin, 15, 40, 40);
      } catch (e) {
        console.error("Error adding logo to header:", e);
      }
    };

    // Helper Function for Footer
    const addFooter = () => {
      doc.setFillColor(...secondaryColor);
      doc.rect(0, pageHeight - 40, pageWidth, 40, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("© 2025 Ergos Mind | www.ergosmind.com", margin, pageHeight - 15);
    };

    // Helper Function to Add Style Description
    const addStyleDescription = (style, title, y) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...primaryColor);
      doc.text(title, margin, y);
      y += 25;
      doc.setLineWidth(1);
      doc.setDrawColor(...accentColor);
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Core Characteristics", margin, y);
      y += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      let coreLines = doc.splitTextToSize(styleDescriptions[style].core, pageWidth - 2 * margin);
      doc.text(coreLines, margin, y);
      y += coreLines.length * 11 + 15;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Strengths / Positives", margin, y);
      y += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      styleDescriptions[style].strengths.forEach(strength => {
        let strengthLines = doc.splitTextToSize(`• ${strength}`, pageWidth - 2 * margin - 10);
        doc.text(strengthLines, margin + 10, y);
        y += strengthLines.length * 11 + 5;
      });
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Watch Outs", margin, y);
      y += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      styleDescriptions[style].watchOuts.forEach(watchOut => {
        let watchOutLines = doc.splitTextToSize(`• ${watchOut}`, pageWidth - 2 * margin - 10);
        doc.text(watchOutLines, margin + 10, y);
        y += watchOutLines.length * 11 + 5;
      });
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Growth Path / How to Optimize", margin, y);
      y += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      styleDescriptions[style].growth.forEach(growth => {
        let growthLines = doc.splitTextToSize(`• ${growth}`, pageWidth - 2 * margin - 10);
        doc.text(growthLines, margin + 10, y);
        y += growthLines.length * 11 + 5;
      });
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Career Fit & Roles", margin, y);
      y += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      let careerLines = doc.splitTextToSize(styleDescriptions[style].careers, pageWidth - 2 * margin);
      doc.text(careerLines, margin, y);
      y += careerLines.length * 11 + 20;

      return y;
    };

    // Cover Page
    let pageNum = 1;
    addHeader(pageNum);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    try {
      doc.addImage(logoBase64, 'PNG', (pageWidth - 120) / 2, 80, 120, 120);
    } catch (e) {
      console.error("Error adding logo to cover:", e);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(...primaryColor);
    doc.text("Mindstyle Assessment", margin, 220, { align: 'left', maxWidth: pageWidth - 2 * margin });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Prepared for: ${name}`, margin, 260);
    const dateOnly = new Date().toLocaleDateString();
    doc.text(`Date: ${dateOnly}`, margin, 280);
    doc.setFontSize(12);
    doc.text("Powered by Ergos Mind", margin, 320);
    addFooter();
    doc.addPage();

    // Results Page
    pageNum++;
    addHeader(pageNum);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    let y = 80;

    // Dominant Style(s)
    for (let style of dominantStyles) {
      if (y > pageHeight - 100) {
        addFooter();
        doc.addPage();
        pageNum++;
        addHeader(pageNum);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        y = 80;
      }
      y = addStyleDescription(style, `Your Dominant Mindstyle: ${styleDescriptions[style].title}`, y);
    }

    // Supporting Style
    if (supportingStyle) {
      if (y > pageHeight - 100) {
        addFooter();
        doc.addPage();
        pageNum++;
        addHeader(pageNum);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        y = 80;
      }
      y = addStyleDescription(supportingStyle, `Your Supporting Mindstyle: ${styleDescriptions[supportingStyle].title}`, y);
    }

    // Balance Message
    if (balanceMessage) {
      if (y > pageHeight - 100) {
        addFooter();
        doc.addPage();
        pageNum++;
        addHeader(pageNum);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        y = 80;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...primaryColor);
      doc.text("Balance Note", margin, y);
      y += 25;
      doc.setLineWidth(1);
      doc.setDrawColor(...accentColor);
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      let balanceLines = doc.splitTextToSize(balanceMessage, pageWidth - 2 * margin);
      doc.text(balanceLines, margin, y);
      y += balanceLines.length * 11 + 20;
    }

    // Add Scores
    if (y > pageHeight - 100) {
      addFooter();
      doc.addPage();
      pageNum++;
      addHeader(pageNum);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      y = 80;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...primaryColor);
    doc.text("Thinking Styles Scores", margin, y);
    y += 25;
    doc.setLineWidth(1);
    doc.setDrawColor(...accentColor);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Laser Thinker: ${counts.A}`, margin, y);
    y += 15;
    doc.text(`Explorer Thinker: ${counts.B}`, margin, y);
    y += 15;
    doc.text(`Mood-Led Thinker: ${counts.C}`, margin, y);
    y += 15;
    doc.text(`Driver Thinker: ${counts.D}`, margin, y);
    y += 15;
    doc.text(`Visionary Thinker: ${counts.E}`, margin, y);
    y += 20;

    addFooter();

    // Save PDF to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Send email
    const mailOptions = {
      from: process.env.SMTP_USER || 'your-email@gmail.com',
      to: email,
      subject: `Mindstyle Assessment Results for ${name}`,
      text: `Dear ${name},\n\nAttached is your Mindstyle Assessment PDF.\n\nBest regards,\nErgos Mind Team`,
      attachments: [
        {
          filename: `${name}_Mindstyle_Assessment.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'PDF sent successfully' });
  } catch (error) {
    console.error('Error generating or sending PDF:', error);
    res.status(500).json({ error: 'Failed to generate or send PDF' });
  }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log('Attempting to serve:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Server Error: Could not find index.html');
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});