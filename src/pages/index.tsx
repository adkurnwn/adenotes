import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import { useEffect, useState } from 'react';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import { useLocation } from '@docusaurus/router';
import DatabaseDocument from '@site/src/components/DatabaseDocument';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const [stats, setStats] = useState({ documents: 0, categories: 0 });
  
  useEffect(() => {
    // Only fetch in browser environment
    if (!ExecutionEnvironment.canUseDOM) return;
    
    // Fetch some basic stats from our API
    fetch('/api/content/manifest')
      .then(res => res.json())
      .then((data: any) => {
        setStats({
          documents: data.documents?.length || 0,
          categories: 0 // Will add category count later
        });
      })
      .catch(err => console.log('Failed to fetch stats:', err));
  }, []);
  
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        {ExecutionEnvironment.canUseDOM && (
          <p className="hero__subtitle text--secondary">
            📊 {stats.documents} notes
          </p>
        )}
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="#/getting-started/intro">
            Open Notes
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const location = useLocation();

  if (ExecutionEnvironment.canUseDOM && location.hash && location.hash.length > 1) {
    return <DatabaseDocument />;
  }

  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Database-driven documentation with real-time editing powered by Docusaurus and Cloudflare">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
