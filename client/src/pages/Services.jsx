import { Link } from 'react-router-dom';
import { SERVICE_GROUPS } from '@shared/services.js';

export default function Services() {
  return (
    <>
      <section className="hero container">
        <h1>Tell us what you need built, and we’ll know exactly where to start.</h1>
        <p className="lede">
          Pick a service to ask about it directly. Your message reaches the team that runs it,
          and you’ll hear back within one working day.
        </p>
      </section>

      <div className="container service-groups">
        {SERVICE_GROUPS.map((group) => (
          <section key={group.id} className="service-group" aria-labelledby={`group-${group.id}`}>
            <h2 id={`group-${group.id}`}>{group.title}</h2>
            <ul>
              {group.services.map((service) => (
                <li key={service.slug} className="service-row">
                  <div>
                    <h3>{service.name}</h3>
                    <p className="muted">{service.blurb}</p>
                  </div>
                  <Link
                    to={`/contact?service=${service.slug}`}
                    className="btn btn-quiet"
                    aria-label={`Ask about ${service.name}`}
                  >
                    Ask about this
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="container cta-strip">
        <p>Not sure which service fits?</p>
        <Link to="/contact" className="btn">Describe your project</Link>
      </section>
    </>
  );
}
