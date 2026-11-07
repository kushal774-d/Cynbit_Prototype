// Single source of truth for Cynbit's service list.
// Used by the server (to validate inquiries) and the client (to render
// the services page and the contact form dropdown).

export const SERVICE_GROUPS = [
  {
    id: 'ai',
    title: 'AI automation',
    services: [
      { slug: 'autonomous-agents', name: 'Autonomous agents', blurb: 'AI assistants that handle leads and coordination.' },
      { slug: 'llm-automation', name: 'LLM automation', blurb: 'Automate data entry and document handling.' },
      { slug: 'ai-voice-agents', name: 'AI voice agents', blurb: 'Voice-driven assistants for calls and support.' },
      { slug: 'ai-stack-integration', name: 'AI stack integration', blurb: 'Add AI features to the tools you already use.' },
    ],
  },
  {
    id: 'software',
    title: 'Software and cloud',
    services: [
      { slug: 'full-stack-dev', name: 'Full-stack development', blurb: 'Web and mobile platforms built to scale.' },
      { slug: 'backend-systems', name: 'Backend systems', blurb: 'Secure APIs and services built for uptime.' },
      { slug: 'cloud-infrastructure', name: 'Cloud infrastructure', blurb: 'AWS and Azure setups with sound security.' },
      { slug: 'legacy-migration', name: 'Legacy migration', blurb: 'Move old monoliths onto modern systems.' },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing and SEO',
    services: [
      { slug: 'performance-ads', name: 'Performance ads', blurb: 'Google and Meta campaigns focused on leads.' },
      { slug: 'technical-seo', name: 'Technical SEO', blurb: 'Fix the site issues that hold back rankings.' },
      { slug: 'crm-automation', name: 'CRM automation', blurb: 'Follow-up flows that nurture leads for you.' },
      { slug: 'funnel-optimization', name: 'Funnel optimization', blurb: 'Landing pages tuned on real user behaviour.' },
    ],
  },
];

export const GENERAL_SERVICE = { slug: 'general', name: 'Not sure yet / general inquiry' };

export const ALL_SERVICES = [
  ...SERVICE_GROUPS.flatMap((g) => g.services),
  GENERAL_SERVICE,
];

export const SERVICE_SLUGS = ALL_SERVICES.map((s) => s.slug);

export const serviceName = (slug) =>
  ALL_SERVICES.find((s) => s.slug === slug)?.name ?? slug;

export const STATUSES = ['new', 'contacted', 'won', 'lost'];
