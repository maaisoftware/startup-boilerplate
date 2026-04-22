import type { JSX } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

function HomepageHeader(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary")}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro"
          >
            Get started →
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Production-grade monorepo boilerplate docs"
    >
      <HomepageHeader />
      <main className="container margin-vert--lg">
        <p>
          Jump into the <Link to="/docs/intro">getting-started guide</Link>, the{" "}
          <Link to="/docs/architecture">architecture overview</Link>, or the{" "}
          <Link to="/docs/deploy">deploy guide</Link>.
        </p>
      </main>
    </Layout>
  );
}
