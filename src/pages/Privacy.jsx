import React from 'react';

// Privacy policy for holmdalerodeo.ca. Linked from the footer and used as the
// Privacy Policy URL on the rodeo's Facebook app (Meta requires one before an
// app can be published). Plain language; PIPEDA is the Canadian privacy law.
const UPDATED = 'November 9, 2026';
const EMAIL = 'info@holmdalerodeo.ca';
const PHONE = '519-881-6575';

const sections = [
  {
    title: '1. Information we collect',
    body: [
      'We only collect what we need to run the rodeo and its events:',
    ],
    list: [
      'Ticket and merchandise orders — your name, email address, phone number and what you bought. Card payments are handled by our payment processor, Moneris. We never see or store your full card number.',
      'Wristbands and on-site purchases — the wristband or ticket number, what was bought at the bar, food booths or counter, and any credit loaded onto a wristband.',
      'Age checks — staff may check ID to serve alcohol, as required by the AGCO. We do not keep a copy of your ID.',
      'Volunteers, staff, sponsors and vendors — contact details, shift and role information, and logos or business details you send us.',
      'Messages and photos you send us — through our contact form, email, phone or photo submissions.',
      'Basic website information — like browser type and pages visited, only to keep the site working well.',
    ],
  },
  {
    title: '2. How we use it',
    list: [
      'To sell and deliver your tickets, and to email your tickets and receipts',
      'To run gates, wristbands, bars and food booths on event days',
      'To answer your questions, process refunds and send event updates you ask for',
      'To schedule volunteers and recognise our sponsors',
      'To meet our legal, tax and liquor-licence obligations',
    ],
  },
  {
    title: '3. Photos and video at our events',
    body: [
      'The rodeo is a public event and we take photos and video for our website and our Facebook page. If you would rather not appear, tell a staff member on the day, or email us afterwards and we will remove a photo of you.',
    ],
  },
  {
    title: '4. Facebook',
    body: [
      'We use an app connected to our own Facebook Page to post event photos, sponsor thank-yous and announcements. That app only manages our Page. It does not collect information from your Facebook account, and we do not use Facebook to track you or show you ads.',
    ],
  },
  {
    title: '5. Who we share it with',
    body: ['We do not sell, rent or trade your personal information. Ever. We only share what is needed with:'],
    list: [
      'Moneris — to process card payments',
      'Our email and hosting providers — to send your tickets and run this website',
      'Our accountant and bookkeeping software — for tax records',
      'Government or police — only if the law requires it',
    ],
  },
  {
    title: '6. How long we keep it',
    body: [
      'Order and payment records are kept for seven years for tax purposes. Other information is kept only as long as we need it for the reasons above, then deleted.',
    ],
  },
  {
    title: '7. Your rights',
    body: [
      'Under Canada\'s privacy law (PIPEDA) you can ask to see the information we hold about you, have it corrected, or have it deleted (except records we must keep by law). You can also unsubscribe from any email we send.',
    ],
  },
  {
    title: '8. Deleting your information',
    body: [
      `To have your information deleted, email ${EMAIL} with your name and the email or phone number you used. We will confirm within 30 days. This includes any information connected to our Facebook Page.`,
    ],
  },
  {
    title: '9. Security and cookies',
    body: [
      'This site uses SSL encryption, and we limit who can see your information. The site uses only the cookies it needs to work — no advertising cookies.',
    ],
  },
  {
    title: '10. Changes',
    body: ['If we change this policy we will update it here and change the date at the top.'],
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-stone-950">
      <section className="pt-32 pb-10 px-6 text-center">
        <span className="inline-block text-green-500 text-sm font-semibold tracking-wider uppercase mb-4">
          Holmdale Pro Rodeo
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-stone-400">Last updated: {UPDATED}</p>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-stone-300 leading-relaxed mb-6">
            This policy explains how Holmdale Pro Rodeo ("we", "us") collects, uses and protects
            your information when you visit holmdalerodeo.ca, buy tickets or merchandise, attend
            our events, or deal with us as a volunteer, sponsor or vendor.
          </p>

          {sections.map((s) => (
            <div key={s.title} className="mt-10">
              <h2 className="text-xl font-semibold text-white pb-2 mb-4 border-b border-stone-800">
                {s.title}
              </h2>
              {(s.body || []).map((p, i) => (
                <p key={i} className="text-stone-300 leading-relaxed mb-4">{p}</p>
              ))}
              {s.list && (
                <ul className="list-disc pl-6 space-y-2 text-stone-300 leading-relaxed">
                  {s.list.map((li, i) => <li key={i}>{li}</li>)}
                </ul>
              )}
            </div>
          ))}

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-white pb-2 mb-4 border-b border-stone-800">
              11. Contact us
            </h2>
            <p className="text-stone-300 leading-relaxed">
              Holmdale Pro Rodeo<br />
              588 Sideroad 10 S., Walkerton, ON<br />
              Email: <a href={`mailto:${EMAIL}`} className="text-green-400 hover:text-green-300">{EMAIL}</a><br />
              Phone: {PHONE}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
