// Caption pack (Word) for the Social Kit: ready-to-post captions, hashtags and image descriptions.
import fs from 'node:fs';
import path from 'node:path';
import {
  Document, Packer, Paragraph, TextRun, ImageRun, ExternalHyperlink, Table, TableRow, TableCell,
  BorderStyle, ShadingType, WidthType,
} from 'docx';

const TEAL = '123D36', MID = '1A5C50', OCHRE = 'A9610A', MUTED = '4A5B57', CREAM = 'F5F1E8', FONT = 'Calibri';
const SITE = 'https://www.igvhope.com';

// Text with [bracketed placeholders] highlighted yellow so people spot what to replace.
function runs(text, o = {}) {
  return text.split(/(\[[^\]]+\])/).filter(Boolean).map((part) => new TextRun({
    text: part, font: FONT, size: o.size ?? 22, bold: o.bold, italics: o.italics, color: o.color,
    highlight: /^\[[^\]]+\]$/.test(part) ? 'yellow' : undefined,
  }));
}
const para = (t, o = {}) => new Paragraph({ children: runs(t, o), spacing: { after: o.after ?? 140, line: 288 }, keepNext: o.keepNext });
const h1 = (t) => new Paragraph({ children: [new TextRun({ text: t, font: FONT, size: 40, bold: true, color: TEAL })], spacing: { after: 80 } });
const h2 = (t) => new Paragraph({
  children: [new TextRun({ text: t, font: FONT, size: 30, bold: true, color: MID })],
  spacing: { before: 420, after: 120 }, keepNext: true, pageBreakBefore: false,
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: 'E8A24A', space: 4 } },
});
const label = (t) => new Paragraph({ children: [new TextRun({ text: t.toUpperCase(), font: FONT, size: 17, bold: true, color: OCHRE, characterSpacing: 30 })], spacing: { before: 200, after: 60 }, keepNext: true });
const bullet = (t) => new Paragraph({ children: runs(t), bullet: { level: 0 }, spacing: { after: 80, line: 288 } });

function box(title, lines) {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: CREAM, color: 'auto' },
      margins: { top: 140, bottom: 100, left: 200, right: 200 },
      borders: { top: none, bottom: none, right: none, left: { style: BorderStyle.SINGLE, size: 24, color: 'E8A24A' } },
      children: [
        new Paragraph({ children: [new TextRun({ text: title, font: FONT, size: 21, bold: true, color: TEAL })], spacing: { after: 80 } }),
        ...lines.map((l) => para(l, { size: 20, color: MUTED, after: 60 })),
      ],
    })] })],
  });
}

// A caption in a shaded box so it is clear what to copy.
function caption(text) {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: 'EEF4F0', color: 'auto' },
      margins: { top: 120, bottom: 80, left: 180, right: 180 },
      borders: { top: none, bottom: none, left: none, right: none },
      children: text.split('\n\n').map((p) => para(p, { after: 100 })),
    })] })],
  });
}

export async function buildCaptions(outDir, band, CONFIG) {
  const dates = CONFIG.webinars.map((w) => `${w.label}`).join(', ').replace(/, ([^,]*)$/, ' and $1');
  const bandPara = new Paragraph({
    indent: { left: -1300 }, spacing: { before: 0, after: 0, line: 240 },
    children: [new ExternalHyperlink({ link: SITE, children: [new ImageRun({ type: 'png', data: band, transformation: { width: 794, height: 81 }, altText: { name: 'IGVhope header', title: 'IGVhope', description: 'IGVhope logo on a dark green band' } })] })],
  });

  const children = [
    h1('Captions and hashtags'),
    para('Ready-to-post wording for the three posts in this kit. Copy a caption, make it yours (anything in a yellow [bracket] is for you to fill in or change) and post it with the matching image or video.', { color: MUTED, size: 21 }),
    box('Before you post', [
      'Say it in your own words. One honest sentence from you beats ten polished ones, and posting your own version reaches more people than re-sharing.',
      'Keep it true to your experience. If you have not done something yet, leave that line out.',
      'Do not promise outcomes. Keep "Eligibility and terms apply" in, because approval and the terms are decided case by case.',
      'Send it to one person who is saving for a down payment. A direct message often works better than a public post.',
    ]),

    // ---------- Post 1 ----------
    h2('Post 1: Free webinar'),
    para('Use with: 01-Webinar-tile-no-down-payment.png', { color: MUTED, size: 20, keepNext: true }),
    label('Short'),
    caption(`No down payment to move into a brand-new home? I'm going to find out how it works. IGVhope is running free webinars on ${dates} (Pacific time). You complete a 3-minute eligibility check first, then pick your time. Join me: igvhope.com`),
    label('Standard'),
    caption(`I've been saving for a down payment for [how long], and the number keeps moving.\n\nSo I'm going to a free IGVhope webinar to see how it works: move into a brand-new home with no down payment, a purchase price held for ten years, and your own mortgage at Year 10. It covers what it costs and what happens if life changes.\n\nSessions are on ${dates} (Pacific time). To join, you first complete the eligibility check at igvhope.com (about 3 minutes, no impact on your credit score), then pick your time.\n\nEligibility and terms apply.`),
    label('Hashtags'),
    para('#IGVhope  #Homeownership  #FirstTimeHomeBuyer  #DownPayment  #VancouverIsland'),
    label('Image description (for screen readers)'),
    para('A dark green tile with a large amber "$0" and the words "down payment to move into your brand-new home". A white card invites you to a free IGVhope webinar and explains that you complete a 3-minute eligibility check first, then pick a webinar time from three dates.', { size: 21 }),

    // ---------- Post 2 ----------
    h2('Post 2: Secure, Live, Own video'),
    para('Use with: 02-Secure-Live-Own-video-square-1x1.mp4 (feed posts) or 02-Secure-Live-Own-video-vertical-9x16.mp4 (Reels, Stories and Shorts)', { color: MUTED, size: 20, keepNext: true }),
    label('Short'),
    caption("Secure. Live. Own. Your price held for 10 years, a brand-new home with no down payment to start, and your own mortgage at Year 10. A new way to own: igvhope.com"),
    label('Standard'),
    caption("If you've been feeling behind, you're not. The process got harder.\n\nIGVhope is a different one, in three steps:\n\n1. Secure: your purchase price is set by independent valuation and held for 10 years.\n2. Live: move into a brand-new home now, with no down payment to start.\n3. Own: in Year 10, buy your home at the held price with your own mortgage.\n\nSee if it could work for you: igvhope.com\n\nEligibility and terms apply."),
    label('Hashtags'),
    para('#IGVhope  #Homeownership  #NewWayToOwn  #FirstTimeHomeBuyer  #VancouverIsland'),
    label('Video description (for screen readers)'),
    para("A short animated video. Text says 'You're not behind. The process got harder. So we changed the process.' Then a house is built in three stages on screen: the foundation appears for Secure (price held for 10 years), the walls, door and glowing windows go up for Live (move in with no down payment), and the roof, chimney and a heart finish it for Own (buy at Year 10 with your own mortgage). It ends with 'A new way to own' and igvhope.com. It has no sound, so it works on mute.", { size: 21 }),

    // ---------- Post 3 ----------
    h2('Post 3: "I checked my eligibility, here\'s what happened"'),
    para('Use with: the six slides, 03-I-checked-my-eligibility-slide-1-of-6.png to slide-6-of-6.png, posted as a carousel in order', { color: MUTED, size: 20, keepNext: true }),
    label('Short'),
    caption("I checked my eligibility with IGVhope. It took about 3 minutes and didn't touch my credit score. Swipe to see what happened next. Check yours: igvhope.com"),
    label('Standard'),
    caption("I checked my eligibility with IGVhope.\n\nIt took about 3 minutes, and it had no impact on my credit score. [One line on why you checked.]\n\nWithin 3 business days the team replied and explained my next step. Since then I've joined the IGVhope Community and started the free Homeownership Academy, and there are member benefits too, including negotiated discounts and group buying on everyday things like household essentials.\n\nAnd the home? No down payment to move in, a price held for ten years, and my own mortgage at Year 10.\n\n[One line on how you feel now.] If you're saving for a down payment and wondering, check yours: igvhope.com\n\nEligibility and terms apply."),
    label('Finish it in your own words'),
    bullet('The moment I realised the down payment kept moving was...'),
    bullet('What surprised me was...'),
    bullet('What I would tell someone who is not sure is...'),
    label('Hashtags'),
    para('#IGVhope  #Homeownership  #FirstTimeHomeBuyer  #MyHomeownershipJourney  #VancouverIsland'),
    label('Slide descriptions (for screen readers)'),
    bullet('Slide 1: "I checked my eligibility. Here\'s what happened." over a photo of a family laughing together.'),
    bullet('Slide 2: A large "3" and the words "It took about 3 minutes. And it has no impact on my credit score."'),
    bullet('Slide 3: An envelope icon and "Then the team got back to me. Within 3 business days, they confirmed what they had and explained my next step."'),
    bullet('Slide 4: Three cards: a free Homeownership Academy, the IGVhope Community, and buying power on everyday things.'),
    bullet('Slide 5: Three small houses building up in stages, labelled Secure, Live and Own, with "No down payment to move in."'),
    bullet('Slide 6: "Your turn. Check yours." with a QR code and igvhope.com.'),
    box('A note on member benefits', [
      'Member benefits are for IGVhope Community members and may change over time. If you are not yet a member, leave the benefits line out of your caption, or say you are looking forward to them.',
    ]),
  ];

  const doc = new Document({
    creator: 'IGVhope', title: 'Captions and hashtags',
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1750, bottom: 1100, left: 1300, right: 1300, header: 0 } } },
      headers: { default: new (await import('docx')).Header({ children: [bandPara] }) },
      footers: { default: new (await import('docx')).Footer({ children: [new Paragraph({ children: [
        new ExternalHyperlink({ link: SITE, children: [new TextRun({ text: 'igvhope.com', font: FONT, size: 16, bold: true, color: TEAL })] }),
        new TextRun({ text: '  ·  support@igvhope.com', font: FONT, size: 16, color: MUTED }),
      ] })] }) },
      children,
    }],
  });
  fs.writeFileSync(path.join(outDir, '04-Captions-and-hashtags.docx'), await Packer.toBuffer(doc));
  console.log('  04-Captions-and-hashtags.docx');
}
