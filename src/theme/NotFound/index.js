import React from 'react';
import NotFoundContent from '@theme/NotFound/Content';
import DatabaseDocument from '@site/src/components/DatabaseDocument';

export default function Index() {
  // Rather than showing a 404 directly, we assume this is a dynamic URL
  // handled by our DatabaseDocument SPA logic.
  // We pass the actual Docusaurus 404 component to it, so if the DB ALSO
  // confirms the document doesn't exist, it can show the true 404 page.
  return (
    <DatabaseDocument NotFoundComponent={NotFoundContent} />
  );
}
