/**
 * The site's copy, in one place. The project was bilingual and used a
 * translation runtime; it is now a single English product, so the strings are
 * a typed object rather than a locale-keyed catalogue. Editing copy never
 * requires touching a component.
 */
export const copy = {
  meta: {
    title: "Abdelrhman",
    description:
      "Software developer building fast, bilingual interfaces for the web.",
  },

  hero: {
    name: "software developer",
    available: "Available for work",
    location: "Cairo, Egypt",
    scroll: "Scroll",
  },

  nav: {
    open: "Open navigation",
    close: "Close navigation",
    navigation: "Navigation",
    home: "Home",
    work: "Work",
    blog: "Blog",
    about: "About",
    contact: "Contact",
  },

  cta: {
    label: "Contact",
    title: "Let's work together",
    button: "Get in touch",
    emailLabel: "Email",
    phoneLabel: "Phone",
    email: "abdelrhmansamymoh@gmail.com",
    phone: "01016669171",
    phoneHref: "tel:+201016669171",
  },

  footer: {
    navigation: "Navigation",
    socials: "Socials",
    edition: "2026 © Edition",
    localTime: "Local time",
  },

  intro: {
    label: "Introduction",
    statement:
      "I design and build fast, bilingual interfaces that feel inevitable — precise in structure, alive in movement.",
    body: "A software developer working between Cairo and the web. I care about the quiet details: a paragraph that reads well in Arabic and English, a transition that settles instead of bouncing, a page that opens before you notice it.",
  },

  workSection: {
    label: "Selected work",
    more: "See all projects",
  },

  workPage: {
    label: "Archive",
    title: "Work",
    lede: "Six selected projects — each one built around a single idea, executed until it stops needing explanation.",
  },

  project: {
    caseStudy: "Case study",
    role: "Role",
    year: "Year",
    stack: "Stack",
    next: "Next project",
    visit: "Visit site",
  },

  about: {
    label: "About",
    title: "Abdelrhman",
    lede: "Software developer focused on the places where design, code and language meet.",
    portraitAlt: "Portrait placeholder — replace with a real photograph",
    initial: "A",
    paragraphs: [
      "I build interfaces for the web, mostly in Next.js and TypeScript, with a soft spot for the parts most people never notice: how a page behaves on a slow connection, how a sentence reads when it is mirrored into Arabic, how a hover state settles.",
      "My work sits between design and engineering. I like starting from structure — the hierarchy, the reading order, the empty states — and only then deciding what moves.",
      "Away from the screen I read too much about typography and spend too long in bookshops. Both find their way back into the work.",
    ],
    servicesLabel: "What I do",
    services: [
      {
        title: "Web development",
        body: "Next.js, React and TypeScript, built to stay fast as the content grows.",
      },
      {
        title: "Interface design",
        body: "Hierarchy first. Layouts that survive real copy in two languages.",
      },
      {
        title: "Motion",
        body: "CSS-first choreography, with WebGL only where it earns its weight.",
      },
      {
        title: "Bilingual builds",
        body: "Arabic and English from the first commit, RTL treated as a first-class direction.",
      },
    ],
  },

  contact: {
    label: "Contact",
    title: "Let's talk",
    lede: "Tell me what you are building. A short note is enough — I answer every message.",
    detailsLabel: "Direct",
    emailLabel: "Email",
    phoneLabel: "Phone",
    email: "abdelrhmansamymoh@gmail.com",
    phone: "01016669171",
    phoneHref: "tel:+201016669171",
    form: {
      name: "Name",
      email: "Email",
      message: "Message",
      send: "Send message",
      hint: "This opens your mail app with the message ready to send.",
      subjectPrefix: "Project enquiry from",
      requiredName: "Please add your name.",
      requiredEmail: "Please add an email address.",
      invalidEmail: "That email address does not look right.",
      requiredMessage: "Please write a message.",
      sending: "Sending…",
      sent: "Your message is on its way.",
      ready: "Your message is ready. Open your mail app to send it.",
      openMail: "Open mail app",
      failed: "Something went wrong. Your message is still here — try again.",
    },
  },

  blogPage: {
    label: "Writing",
    title: "Blog",
    lede: "Notes on building for the web, in Arabic and English.",
    empty: "The first posts are being written.",
  },

  blogPost: {
    back: "All posts",
  },
} as const;

export type Copy = typeof copy;
