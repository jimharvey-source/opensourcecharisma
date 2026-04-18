const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PDFDocument = require('pdfkit');

// ── QUADRANT DATA ──────────────────────────────────────────────────────────
const QUADRANTS = {
  charismatic: {
    name: 'The Courteous Charismatic',
    tag: 'Higher Confidence · Higher Social Skills',
    heading: 'Competent and connected. The challenge now is keeping it real.',
    text: 'People follow you and you know why. You are warm, articulate, and at ease in most rooms. Right now you are leaving a positive trace — people feel better after spending time with you. The risk is overextension. As the stakes rise, the pressure to be everything to everyone grows. This result reflects where you are right now, not a fixed identity.',
    focus: 'Staying grounded, protecting your energy, and creating space for others.',
    colour: [26, 122, 110]
  },
  arrogant: {
    name: 'The Occasionally Overconfident',
    tag: 'Higher Confidence · Lower Social Skills',
    heading: 'Sharp and capable. The missing piece is empathy.',
    text: 'You get things done and you know your value. Right now the trace you leave can feel mixed — people respect your capability but may feel talked over or unheard. That is not about your confidence, which is a genuine strength. It is about adding connection to it.',
    focus: 'Listening better, showing more care, and earning the trust your confidence assumes.',
    colour: [201, 100, 50]
  },
  influential: {
    name: 'The Unknowingly Influential',
    tag: 'Lower Confidence · Higher Social Skills',
    heading: 'People respond to you better than you realise.',
    text: 'You connect naturally, build trust easily, and are often the person others gravitate towards. The trace you leave is warm and positive. What holds you back is not how others see you — it is how you see yourself. You hold back instinctively. The only thing underselling you is you.',
    focus: 'Backing yourself, stepping forward, and owning your impact.',
    colour: [26, 122, 110]
  },
  invisible: {
    name: 'The Incidentally Invisible',
    tag: 'Lower Confidence · Lower Social Skills',
    heading: 'Talented but overlooked. Ability is not the gap.',
    text: 'Your work is there. The problem is that not enough people see it clearly yet. Right now the trace you leave is quieter than it should be — not because of what you contribute, but because of how visible that contribution is. External confidence is faster to build than you think.',
    focus: 'Getting seen, getting heard, and trusting your own voice.',
    colour: [100, 100, 120]
  }
};

const SUBSCALE_LABELS = {
  'Self-Esteem & Self-Worth': 'Self-Esteem & Self-Worth',
  'Resilience & Composure': 'Resilience & Composure',
  'Assertiveness & Accountability': 'Assertiveness & Accountability',
  'Growth & Adaptability': 'Growth & Adaptability',
  'Empathy & Listening': 'Empathy & Listening',
  'Warmth & Social Courtesy': 'Warmth & Social Courtesy',
  'Conversational Skills': 'Conversational Skills',
  'Emotional Control & Humility': 'Emotional Control & Humility'
};

const PRACTICE = {
  charismatic: {
    'Self-Esteem & Self-Worth': { label: 'Keeping a Positive Mindset', items: ['Start each day by writing down three things you are genuinely grateful for.','Notice when your energy drops and name the cause.','Spend time each week with people who energise rather than drain you.'] },
    'Resilience & Composure': { label: 'Finding Perspective in Difficult Situations', items: ['Before a difficult conversation, write down what you want and what the other person probably wants.','Take a breath and pause before responding to anything that provokes a strong reaction.','When someone is difficult, ask what might be driving their behaviour rather than just reacting.'] },
    'Assertiveness & Accountability': { label: 'Managing Your Long-Term Development', items: ['Identify the one habit most undermining your charisma right now and focus on it for 30 days.','Ask someone you trust: what is the one thing I do that holds me back?','Review your goals each quarter and adjust based on what has changed.'] },
    'Growth & Adaptability': { label: 'Long-Term Development', items: ['Read one biography of someone whose influence you admire.','Review your goals each quarter.','Focus one effort on your biggest development area for 30 days.'] },
    'Empathy & Listening': { label: 'Showing Kindness', items: ['Write a short, specific thank-you message to someone who helped you this week.','When someone seems stressed, ask if they are alright.','Make a point of including someone who has been quiet in a group conversation.'] },
    'Warmth & Social Courtesy': { label: 'Warmth and Kindness', items: ['Offer to help before being asked, when you can see someone is struggling.','Give the other person time to finish before you speak.','Write a specific thank-you message to someone who helped you.'] },
    'Conversational Skills': { label: 'Deepening Social Skills', items: ['Match your energy to the room rather than bringing the same level into every situation.','Ask someone to tell you more about something they are clearly excited about.','Be specific in your praise. Name the thing, not just the feeling.'] },
    'Emotional Control & Humility': { label: 'Emotional Control and Humility', items: ['Use humour to lighten a tense moment — then return to the substance.','Take a proper break at least once during each working day.','When something goes wrong, ask what you can control rather than what went wrong.'] }
  },
  arrogant: {
    'Empathy & Listening': { label: 'Building Empathy', items: ['Before giving your view, ask one genuine question first.','When someone comes with a problem, acknowledge how they feel before offering a solution.','Pause before responding when you feel certain you are right.'] },
    'Warmth & Social Courtesy': { label: 'Building Humility', items: ['Acknowledge a mistake to the person it affected, without qualification.','Share credit publicly for a success your team contributed to.','Practise saying I don\'t know when you genuinely do not.'] },
    'Conversational Skills': { label: 'Listening Skills', items: ['Use the 70/30 rule in your next three one-to-ones: listen 70%, talk 30%.','Put your phone face-down in every conversation this week.','Summarise what you have heard before you respond.'] },
    'Emotional Control & Humility': { label: 'Controlling Your Ego', items: ['Ask for feedback from someone likely to challenge you, not comfort you.','Sit with feedback you disagree with before responding.','Find one thing to genuinely celebrate in a colleague\'s success this week.'] },
    'Self-Esteem & Self-Worth': { label: 'Giving Feedback Well', items: ['Give feedback on a specific behaviour, not a character trait.','Give difficult feedback in private, never in front of others.','Ask before giving feedback whether it would be useful.'] },
    'Resilience & Composure': { label: 'Composure Under Pressure', items: ['Before a difficult conversation, write down the outcome you want and the other person probably wants.','Take a breath before responding to anything that provokes a strong reaction.','When someone is difficult, ask what might be driving their behaviour.'] },
    'Assertiveness & Accountability': { label: 'Assertiveness and Accountability', items: ['Observe body language during your next difficult conversation.','Ask a clarifying question when something is not clear rather than assuming.','When you compare yourself favourably to others, redirect to your own progress.'] },
    'Growth & Adaptability': { label: 'Growth and Adaptability', items: ['Read one book written from a perspective very different from your own.','After a conflict, ask what you could have done differently before assessing the other person.','Review your goals each quarter and adjust based on what has changed.'] }
  },
  influential: {
    'Self-Esteem & Self-Worth': { label: 'Backing Yourself', items: ['Put yourself forward for one opportunity before you feel ready.','State your opinion clearly in the next meeting where you have a view.','Ask for a piece of work that stretches your current ability.'] },
    'Resilience & Composure': { label: 'Building Resilience', items: ['Ask for feedback on a specific piece of work, not general feedback.','When you feel uncertain, act at 70% confidence rather than waiting for certainty.','Visualise the conversation going well before a high-stakes moment.'] },
    'Assertiveness & Accountability': { label: 'Professional Visibility', items: ['Post one thoughtful piece of content on LinkedIn each month.','Turn your camera on in every online meeting by default.','Follow up within 24 hours after meeting someone who matters.'] },
    'Growth & Adaptability': { label: 'Building Conversational Confidence', items: ['Share a personal story or experience in a conversation this week.','Stay in a conversation slightly longer than feels comfortable.','Ask open-ended questions that invite the other person to go deeper.'] },
    'Empathy & Listening': { label: 'Empathy and Listening', items: ['Use the other person\'s name once or twice in a conversation.','Find common ground with someone you usually struggle to connect with.','Research someone before you meet them and reference something specific.'] },
    'Warmth & Social Courtesy': { label: 'Warmth and Social Courtesy', items: ['Introduce yourself with your name and one clear sentence about what you do.','Smile and make eye contact when you walk into a room.','After a client meeting, send a short summary of what was agreed.'] },
    'Conversational Skills': { label: 'Conversational Skills', items: ['Ask open-ended questions that invite the other person to go deeper.','Stay in a conversation slightly longer than feels comfortable.','Find common ground with someone you usually struggle to connect with.'] },
    'Emotional Control & Humility': { label: 'Emotional Control and Humility', items: ['Accept a compliment without deflecting it.','Acknowledge a mistake openly and without qualification.','Give credit to others publicly when they contribute.'] }
  },
  invisible: {
    'Self-Esteem & Self-Worth': { label: 'Building Self-Esteem and Self-Worth', items: ['List your five strongest qualities and update the list every month.','Accept a compliment without deflecting it.','Say no to one request this week that takes you away from what matters.'] },
    'Resilience & Composure': { label: 'Managing Nerves and Anxiety', items: ['Prepare more than feels necessary before any high-stakes interaction.','Use slow, deliberate breathing for two minutes before a difficult conversation.','Visualise the conversation going well, in specific detail.'] },
    'Assertiveness & Accountability': { label: 'Being Seen at Work', items: ['Speak up in the first five minutes of a meeting.','Share one achievement with your manager or team without waiting to be asked.','Ask a thoughtful question in a group setting once a week.'] },
    'Growth & Adaptability': { label: 'Building Confidence Through Track Record', items: ['Keep a running record of your wins, however small.','Set one achievable goal each week and tick it off.','Reflect on one thing that went well at the end of each day.'] },
    'Empathy & Listening': { label: 'Empathy and Listening', items: ['Use the other person\'s name once or twice in a conversation.','Ask a thoughtful question and then listen fully to the answer.','Summarise what you have heard before you respond.'] },
    'Warmth & Social Courtesy': { label: 'Warmth and Social Courtesy', items: ['Attend the company event you would normally skip.','Introduce yourself to one new person at each event or meeting.','Show appreciation and gratitude to someone who helped you this week.'] },
    'Conversational Skills': { label: 'Conversational Skills', items: ['Ask an open-ended question and listen without planning your response.','Stay in a conversation slightly longer than feels comfortable.','Find common ground with someone you usually struggle to connect with.'] },
    'Emotional Control & Humility': { label: 'Emotional Control and Humility', items: ['Acknowledge a mistake openly and move on without excessive self-criticism.','Give credit to someone else publicly for their contribution.','Notice when you feel defensive and pause before responding.'] }
  }
};

// ── PDF GENERATOR ──────────────────────────────────────────────────────────
function generatePDF(scores) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 60, size: 'A4', info: { Title: 'Open-Source Charisma — OSCI Full Report', Author: 'James G Harvey' } });
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { confScore, socScore, quadrant: qKey, subscaleScores, email } = scores;
    const q = QUADRANTS[qKey] || QUADRANTS.invisible;
    const W = doc.page.width - 120;
    const NAVY = [15, 31, 56];
    const GOLD = [201, 168, 76];
    const TEAL = [26, 122, 110];
    const MUTED = [107, 114, 128];

    // ── COVER BLOCK ──
    doc.rect(0, 0, doc.page.width, 200).fill(NAVY);
    doc.fill(GOLD).font('Helvetica-Bold').fontSize(10).text('OPEN-SOURCE CHARISMA', 60, 50, { characterSpacing: 3 });
    doc.fill('white').font('Helvetica-Bold').fontSize(28).text('Your OSCI Full Report', 60, 72);
    doc.fill('white').font('Helvetica').fontSize(13).opacity(0.6).text('Open-Source Charisma Indicator — Personal Development Report', 60, 108);
    doc.fill('white').font('Helvetica').fontSize(11).opacity(0.4).text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 60, 130);
    doc.opacity(1);

    // ── QUADRANT TYPE ──
    doc.moveDown(5);
    doc.fill(MUTED).font('Helvetica').fontSize(10).text('YOUR QUADRANT TYPE', 60, 220, { characterSpacing: 2 });
    doc.fill(NAVY).font('Helvetica-Bold').fontSize(26).text(q.name, 60, 238);
    doc.fill(TEAL).font('Helvetica').fontSize(12).text(q.tag, 60, 272);

    // Gold rule
    doc.moveTo(60, 295).lineTo(60 + W, 295).strokeColor(GOLD).lineWidth(1.5).stroke();

    // Type description
    doc.fill(NAVY).font('Helvetica-Bold').fontSize(14).text(q.heading, 60, 310);
    doc.fill([55, 65, 81]).font('Helvetica').fontSize(11).lineGap(4).text(q.text, 60, 332, { width: W });

    // ── SCORES ──
    const scoreY = doc.y + 24;
    doc.rect(60, scoreY, W / 2 - 8, 80).fill([245, 239, 216]);
    doc.rect(60 + W / 2 + 8, scoreY, W / 2 - 8, 80).fill([212, 239, 235]);
    doc.fill(MUTED).font('Helvetica').fontSize(9).text('CONFIDENCE', 60, scoreY + 12, { width: W / 2 - 8, align: 'center', characterSpacing: 1.5 });
    doc.fill(NAVY).font('Helvetica-Bold').fontSize(36).text(String(confScore), 60, scoreY + 24, { width: W / 2 - 8, align: 'center' });
    doc.fill(MUTED).font('Helvetica').fontSize(9).text('out of 100', 60, scoreY + 62, { width: W / 2 - 8, align: 'center' });
    doc.fill(MUTED).font('Helvetica').fontSize(9).text('SOCIAL SKILLS', 60 + W / 2 + 8, scoreY + 12, { width: W / 2 - 8, align: 'center', characterSpacing: 1.5 });
    doc.fill(TEAL).font('Helvetica-Bold').fontSize(36).text(String(socScore), 60 + W / 2 + 8, scoreY + 24, { width: W / 2 - 8, align: 'center' });
    doc.fill(MUTED).font('Helvetica').fontSize(9).text('out of 100', 60 + W / 2 + 8, scoreY + 62, { width: W / 2 - 8, align: 'center' });

    // ── YOUR FOCUS ──
    const focusY = scoreY + 96;
    doc.rect(60, focusY, W, 40).fill([248, 246, 241]);
    doc.fill(MUTED).font('Helvetica').fontSize(9).text('YOUR FOCUS', 70, focusY + 8, { characterSpacing: 1.5 });
    doc.fill(NAVY).font('Helvetica-Bold').fontSize(11).text(q.focus, 70, focusY + 20, { width: W - 20 });

    // ── PAGE 2: SUBSCALE BREAKDOWN ──
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 6).fill(NAVY);

    doc.fill(MUTED).font('Helvetica').fontSize(9).text('OPEN-SOURCE CHARISMA INDICATOR', 60, 24, { characterSpacing: 1.5 });
    doc.fill(NAVY).font('Helvetica-Bold').fontSize(20).text('Subscale Breakdown', 60, 40);
    doc.fill([55, 65, 81]).font('Helvetica').fontSize(11).text('Your scores across all eight competency areas. The two lowest areas are your priority development focus.', 60, 68, { width: W });

    // Find two lowest
    const subArray = Object.entries(subscaleScores || {}).map(([name, data]) => ({
      name,
      pct: Math.round((data.total / (data.count * 5)) * 100),
      part: data.part
    })).sort((a, b) => a.pct - b.pct);

    const lowestTwo = subArray.slice(0, 2).map(s => s.name);

    let barY = 100;
    const confSubs = subArray.filter(s => s.part === 'a');
    const socSubs  = subArray.filter(s => s.part === 'b');

    const drawSubscaleSection = (label, subs, colour) => {
      doc.fill(colour).font('Helvetica-Bold').fontSize(10).text(label.toUpperCase(), 60, barY, { characterSpacing: 1.5 });
      barY += 18;
      subs.forEach(sub => {
        const isLowest = lowestTwo.includes(sub.name);
        if (isLowest) doc.rect(56, barY - 2, W + 8, 28).fill([245, 239, 216]);
        doc.fill(NAVY).font(isLowest ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).text(sub.name, 60, barY + 4, { width: 200 });
        if (isLowest) { doc.fill(GOLD).font('Helvetica-Bold').fontSize(8).text('PRIORITY', 270, barY + 5); }
        // Bar background
        doc.rect(340, barY + 4, 150, 10).fill([229, 231, 235]);
        // Bar fill
        doc.rect(340, barY + 4, Math.round(150 * sub.pct / 100), 10).fill(colour);
        // Percentage
        doc.fill(MUTED).font('Helvetica').fontSize(9).text(`${sub.pct}%`, 498, barY + 4);
        barY += 28;
      });
      barY += 8;
    };

    drawSubscaleSection('Confidence', confSubs, NAVY);
    drawSubscaleSection('Social Skills', socSubs, TEAL);

    // ── PAGE 3: PRACTICE MENU ──
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 6).fill(NAVY);

    doc.fill(MUTED).font('Helvetica').fontSize(9).text('OPEN-SOURCE CHARISMA INDICATOR', 60, 24, { characterSpacing: 1.5 });
    doc.fill(NAVY).font('Helvetica-Bold').fontSize(20).text('Your Personal Practice Menu', 60, 40);

    const lib = PRACTICE[qKey] || PRACTICE.invisible;
    const allKeys = Object.keys(lib);
    const priorityKeys = lowestTwo.filter(k => lib[k]);
    const orderedKeys = [...priorityKeys, ...allKeys.filter(k => !priorityKeys.includes(k))];

    // Priority banner
    if (priorityKeys.length >= 2) {
      const p1 = subArray.find(s => s.name === priorityKeys[0]);
      const p2 = subArray.find(s => s.name === priorityKeys[1]);
      if (p1 && p2) {
        doc.rect(60, 68, W, 36).fill([245, 239, 216]);
        doc.fill(NAVY).font('Helvetica-Bold').fontSize(10).text('Your two priority areas: ', 68, 76, { continued: true });
        doc.fill(TEAL).font('Helvetica-Bold').text(`${p1.name} (${p1.pct}%)`, { continued: true });
        doc.fill(NAVY).font('Helvetica').text(' and ', { continued: true });
        doc.fill(TEAL).font('Helvetica-Bold').text(`${p2.name} (${p2.pct}%)`);
        doc.fill([55, 65, 81]).font('Helvetica').fontSize(9).text('Start with the sections marked below. Work on them for 30 days before adding anything else.', 68, 90, { width: W - 16 });
      }
    }

    let practiceY = doc.y + 16;

    orderedKeys.slice(0, 4).forEach((catKey, idx) => {
      const cat = lib[catKey];
      if (!cat) return;
      const isPriority = priorityKeys.includes(catKey);

      if (practiceY > 700) { doc.addPage(); doc.rect(0, 0, doc.page.width, 6).fill(NAVY); practiceY = 40; }

      // Category header
      doc.rect(60, practiceY, W, 26).fill(isPriority ? GOLD : NAVY);
      if (isPriority) {
        doc.fill(NAVY).font('Helvetica-Bold').fontSize(10).text('★ PRIORITY — ' + cat.label.toUpperCase(), 68, practiceY + 8, { characterSpacing: 0.5 });
      } else {
        doc.fill('white').font('Helvetica-Bold').fontSize(10).text(cat.label.toUpperCase(), 68, practiceY + 8, { characterSpacing: 0.5 });
      }
      practiceY += 32;

      const itemsToShow = isPriority ? cat.items.slice(0, 4) : cat.items.slice(0, 3);
      itemsToShow.forEach((item, i) => {
        if (practiceY > 720) { doc.addPage(); doc.rect(0, 0, doc.page.width, 6).fill(NAVY); practiceY = 40; }
        doc.circle(68, practiceY + 5, 3).fill(isPriority ? GOLD : TEAL);
        doc.fill(NAVY).font('Helvetica-Bold').fontSize(10).text(item, 78, practiceY, { width: W - 18 });
        practiceY += doc.heightOfString(item, { width: W - 18 }) + 8;
      });
      practiceY += 8;
    });

    // ── PAGE 4 (or continued): REMAINING CATEGORIES ──
    orderedKeys.slice(4).forEach((catKey) => {
      const cat = lib[catKey];
      if (!cat) return;
      if (practiceY > 700) { doc.addPage(); doc.rect(0, 0, doc.page.width, 6).fill(NAVY); practiceY = 40; }
      doc.rect(60, practiceY, W, 24).fill(NAVY);
      doc.fill('white').font('Helvetica-Bold').fontSize(10).text(cat.label.toUpperCase(), 68, practiceY + 7, { characterSpacing: 0.5 });
      practiceY += 30;
      cat.items.slice(0, 3).forEach(item => {
        if (practiceY > 720) { doc.addPage(); doc.rect(0, 0, doc.page.width, 6).fill(NAVY); practiceY = 40; }
        doc.circle(68, practiceY + 5, 3).fill(TEAL);
        doc.fill(NAVY).font('Helvetica-Bold').fontSize(10).text(item, 78, practiceY, { width: W - 18 });
        practiceY += doc.heightOfString(item, { width: W - 18 }) + 8;
      });
      practiceY += 8;
    });

    // ── METHODOLOGY FOOTER ──
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 6).fill(NAVY);
    doc.fill(MUTED).font('Helvetica').fontSize(9).text('OPEN-SOURCE CHARISMA INDICATOR', 60, 24, { characterSpacing: 1.5 });
    doc.fill(NAVY).font('Helvetica-Bold').fontSize(18).text('About the OSCI', 60, 40);
    doc.fill([55, 65, 81]).font('Helvetica').fontSize(11).lineGap(4)
      .text('The Open-Source Charisma Indicator is a self-report development tool. It is designed to help you reflect on your confidence and social skills, identify where you are strongest, and focus your development where it will have the most impact.', 60, 70, { width: W })
      .moveDown(0.8)
      .text('It is not a clinical diagnostic instrument. Your results reflect how you see yourself at the time of taking it. Like all self-report tools, they are shaped by self-perception and context. Use them as a starting point for reflection, not a fixed verdict.', { width: W })
      .moveDown(0.8)
      .text('The OSCI is built on the Charisma Quadrant framework, which models personal impact as the interaction of confidence and social skills across eight sub-competencies.', { width: W })
      .moveDown(0.8)
      .text('The tool is in active development. We are building a formal evidence base as more people complete the assessment. If you are a researcher or practitioner interested in contributing, contact jim.harvey@themessagebusiness.com.', { width: W })
      .moveDown(0.8)
      .text('Full methodology: opensourcecharisma.com/methodology', { width: W });

    doc.moveDown(1.5);
    doc.moveTo(60, doc.y).lineTo(60 + W, doc.y).strokeColor([229, 231, 235]).lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fill(MUTED).font('Helvetica').fontSize(9).text('© 2026 James G Harvey / Allcow Trading Co LTD. All rights reserved. Open-Source Charisma is the property of Allcow Trading Co LTD.', 60, doc.y, { width: W });

    doc.end();
  });
}

// ── HANDLER ───────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { session_id, s } = req.query;
    if (!session_id) return res.status(400).send('Missing session_id');

    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(402).send('Payment not confirmed');
    }

    // Decode scores
    let scores;
    try {
      const encoded = s || session.metadata.scores;
      scores = JSON.parse(Buffer.from(decodeURIComponent(encoded), 'base64').toString('utf8'));
    } catch (e) {
      return res.status(400).send('Invalid scores data');
    }

    // Generate PDF
    const pdf = await generatePDF(scores);

    const filename = `OSCI-Report-${scores.quadrant || 'result'}-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    return res.status(200).send(pdf);

  } catch (err) {
    console.error('Report error:', err.message);
    return res.status(500).send('Report generation failed: ' + err.message);
  }
};
