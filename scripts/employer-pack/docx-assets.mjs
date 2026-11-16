// Word (.docx) assets for the Employer Pack: the email template and the newsletter / intranet blurb.
import fs from 'node:fs';
import path from 'node:path';
import {
  Document, Packer, Paragraph, TextRun, ImageRun, ExternalHyperlink, Table, TableRow, TableCell, Header, Footer,
  AlignmentType, BorderStyle, ShadingType, WidthType, HeightRule, VerticalAlign, TableLayoutType,
} from 'docx';

const TEAL = '123D36', MID = '1A5C50', OCHRE = 'A9610A', MUTED = '4A5B57', CREAM = 'F5F1E8';
const FONT = 'Calibri';
const SITE = 'https://www.igvhope.com';

// Text with [bracketed placeholders] highlighted yellow so people spot what to replace.
function runs(text, opts = {}) {
  return text.split(/(\[[^\]]+\])/).filter(Boolean).map((part) => {
    const placeholder = /^\[[^\]]+\]$/.test(part);
    return new TextRun({ text: part, font: FONT, size: opts.size ?? 22, bold: opts.bold, color: opts.color, italics: opts.italics, highlight: placeholder ? 'yellow' : undefined });
  });
}
const para = (text, opts = {}) => new Paragraph({
  children: runs(text, opts),
  spacing: { after: opts.after ?? 160, line: 288 },
  alignment: opts.align,
  keepNext: opts.keepNext,
});
const h1 = (text) => new Paragraph({ children: [new TextRun({ text, font: FONT, size: 40, bold: true, color: TEAL })], spacing: { after: 80 } });
const eyebrow = (text) => new Paragraph({ children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: 18, bold: true, color: OCHRE, characterSpacing: 40 })], spacing: { after: 60 } });
const h2 = (text) => new Paragraph({
  children: [new TextRun({ text, font: FONT, size: 28, bold: true, color: MID })],
  spacing: { before: 360, after: 120 }, keepNext: true,
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: 'E8A24A', space: 4 } },
});
const label = (text) => new Paragraph({ children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: 17, bold: true, color: OCHRE, characterSpacing: 30 })], spacing: { before: 200, after: 60 }, keepNext: true });

function tipBox(title, lines) {
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

// The brand header band is an image rendered from the same HTML as the PDF header, so Montserrat looks identical on every PC (Word would otherwise swap in Calibri). Clicking it opens igvhope.com.
function bandHeader(band) {
  return new Paragraph({
    indent: { left: -1300 },
    spacing: { before: 0, after: 0, line: 240 },
    children: [new ExternalHyperlink({ link: SITE, children: [new ImageRun({ type: 'png', data: band, transformation: { width: 794, height: 81 }, altText: { name: 'IGVhope header', title: 'IGVhope (opens igvhope.com)', description: 'IGVhope logo on a dark green band' } })] })],
  });
}

function makeDoc(title, children, band) {
  return new Document({
    creator: 'IGVhope',
    title,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1750, bottom: 1100, left: 1300, right: 1300, header: 0 } } },
      headers: { default: new Header({ children: [bandHeader(band)] }) },
      footers: { default: new Footer({ children: [new Paragraph({
        children: [
          new ExternalHyperlink({ link: SITE, children: [new TextRun({ text: 'igvhope.com', font: FONT, size: 16, bold: true, color: TEAL })] }),
          new TextRun({ text: '  ·  support@igvhope.com', font: FONT, size: 16, color: MUTED }),
        ],
      })] }) },
      children,
    }],
  });
}

async function save(doc, file) {
  fs.writeFileSync(file, await Packer.toBuffer(doc));
  console.log('  ' + path.basename(file));
}

export async function buildWordDocs(outDir, CONFIG, bands) {
  // ---------- 01 Email to your manager or HR ----------
  const email = makeDoc('Email to your manager or HR', [
    h1('Email to your manager or HR'),
    para('Two versions you can copy into an email and make your own. Both lead with what your employer gains. Anything in a yellow [bracket] is for you to fill in or change. Delete this box before you send.', { color: MUTED, size: 21 }),
    tipBox('Which one should I use?', [
      'Version A is short and personal. It suits a manager you speak with often.',
      'Version B is a little more formal. It suits HR, a People team or a senior leader.',
      'Make it land: add one line about your own workplace, such as roles that are hard to fill, long commutes or people who have left to live elsewhere.',
      'Attach the pack (or at least "How employers can help" and the one-page FAQ) so there is something to read.',
    ]),

    h2('Version A: to your manager'),
    label('Subject'),
    para('A way for [Company] to attract and keep good people', { bold: true }),
    para('Hi [Manager\'s name],'),
    para('Could I ask for 10 minutes in the next week or two? I would like to share another way for [Company] to invest in its people and in the community it depends on.'),
    para('Housing is making it harder for people to build a life where they work. Many of us have steady jobs and pay our bills, but the down payment keeps getting further away, and I think that is when people start looking for work somewhere cheaper.'),
    para('IGVhope is a new homeownership program on Vancouver Island. People move into a brand-new home with no down payment, the purchase price is held for ten years, and in Year 10 they buy the home with their own mortgage. If [Company] shares it with staff, it could help us by:'),
    ...[
      'Giving people a reason to stay and build their future here, instead of leaving to find somewhere they can afford.',
      'Making [Company] a more attractive place to work, because it is a way of backing people beyond their pay.',
      'Helping people plan for the long term, which supports a steadier team.',
      'Building our reputation as an employer that cares about the community it depends on.',
    ].map((t, i, arr) => new Paragraph({ children: runs(t), bullet: { level: 0 }, spacing: { after: i === arr.length - 1 ? 160 : 80, line: 288 } })),
    para('A good first step is small: [one or two simple things, for example: sharing a short note with staff / putting a poster on the noticeboard]. I have a short pack with a one-page summary, an FAQ and ready-to-use pieces, so it will not take long to look at.'),
    para('Would [day and time] or [day and time] suit you?'),
    para('Thank you for considering it.', { after: 80 }),
    para('[Your name]', { after: 0 }),
    para('[Your role / team]', { after: 160 }),

    h2('Version B: to HR or your People team'),
    label('Subject'),
    para('A way to support recruitment and retention', { bold: true }),
    para('Hello [HR contact\'s name],'),
    para('I am writing to suggest another way for [Company] to invest in its people and its community, supporting recruitment and retention, and to ask for a short conversation about it.'),
    para('Across our community, housing is pushing working people further from where they work, and businesses are finding it harder to fill roles and keep good people. IGVhope is a homeownership program on Vancouver Island designed for people with steady incomes who are held back by the down payment. Participants move into a brand-new home with no down payment, the purchase price is set by independent valuation and held for ten years, and in Year 10 they buy the home with their own mortgage.'),
    para('By helping staff find out about it, [Company] could gain:', { keepNext: true }),
    ...[
      'Retention: people who can see a clear process to a home of their own near work have a reason to stay.',
      'Recruitment: something meaningful to point to when competing for good candidates.',
      'A steadier team: staff who can plan for the long term.',
      'Reputation: a visible, community-minded employer that backs its people.',
      'A stronger local community: a local workforce is also your local customer base and neighbours.',
    ].map((t, i, arr) => new Paragraph({ children: runs(t), bullet: { level: 0 }, spacing: { after: i === arr.length - 1 ? 160 : 80, line: 288 } })),
    para('Simple ways to start:', { keepNext: true }),
    ...[
      'Share a short note in the staff newsletter or on the intranet (a ready-made blurb is in the pack).',
      'Put up a poster on the staff noticeboard.',
      'Invite the IGVhope team to give a short information session, if there is interest.',
      'Name a contact who can confirm employment when a colleague asks as part of their application.',
    ].map((t, i, arr) => new Paragraph({ children: runs(t), bullet: { level: 0 }, spacing: { after: i === arr.length - 1 ? 160 : 80, line: 288 } })),
    para('Participation is each person\'s own decision, and it is subject to eligibility and the terms of the agreement. The attached pack explains how it works and answers the questions an employer is most likely to have. More information is at igvhope.com.', { after: 160 }),
    para('Could we find 10 minutes to talk? I am free [days and times].'),
    para('Kind regards,', { after: 80 }),
    para('[Your name]', { after: 0 }),
    para('[Your role / team]', { after: 0 }),
  ], bands.you);
  await save(email, path.join(outDir, '01-Email-to-manager-or-HR.docx'));

  // ---------- 07 Newsletter or intranet blurb ----------
  const bullet = (t) => new Paragraph({ children: runs(t), bullet: { level: 0 }, spacing: { after: 80, line: 288 } });
  const blurb = makeDoc('Newsletter or intranet blurb', [
    h1('Newsletter or intranet blurb'),
    para('Ready-to-use wording for your staff newsletter, intranet or noticeboard. Pick the length that fits. Anything in a yellow [bracket] is for you to fill in.', { color: MUTED, size: 21 }),
    tipBox('Tips for using it', [
      'Add a photo of your team or workplace if you can. It makes the note feel like yours.',
      'Link to igvhope.com, or add the QR poster alongside the blurb.',
      'Keep the last line. It makes clear that taking part is each person\'s own choice.',
    ]),

    h2('Headline ideas'),
    bullet('We believe all of you deserve your own home'),
    bullet('Helping our team put down roots'),
    bullet("Sick of being priced out of housing opportunities? There's a new process"),
    bullet('Steady job, bills paid, down payment out of reach? Read this'),
    bullet('A new process to homeownership on Vancouver Island'),

    h2('Short version (about 50 words)'),
    para('Saving a down payment can take a decade or longer. IGVhope is a new homeownership process on Vancouver Island: move into a brand-new home with no down payment, with your purchase price held for ten years. The eligibility check takes about three minutes. Find out more at igvhope.com. Eligibility and terms apply.'),

    h2('Standard version (about 150 words)'),
    para('[Headline]', { bold: true, keepNext: true }),
    para('Housing is one of the biggest worries for working people in our community. Prices keep rising, and saving a down payment can take a decade or longer, even for people with a steady job who pay their bills.'),
    para('IGVhope is a new homeownership process on Vancouver Island, for people who can afford monthly housing costs but face barriers to a mortgage or down payment. You move into a brand-new home with no down payment. Your purchase price is set by independent valuation and held for ten years, and in Year 10 you buy the home with your own mortgage.'),
    para('The eligibility check takes about three minutes and has no impact on your credit score. [Company] is sharing this information so that anyone who is interested can find out more at igvhope.com.'),
    para('Taking part is each person\'s own decision, and is subject to eligibility and the terms of the agreement.', { italics: true, color: MUTED, size: 20 }),
  ], bands.employers);
  await save(blurb, path.join(outDir, '07-Newsletter-or-intranet-blurb.docx'));
}

