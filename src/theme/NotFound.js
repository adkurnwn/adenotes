import React from 'react';
import DatabaseDocument from '@site/src/components/DatabaseDocument';
import NotFoundContent from '@theme/NotFound/Content';

export default function NotFound() {
    return (
        <DatabaseDocument
            NotFoundComponent={NotFoundContent}
        />
    );
}
