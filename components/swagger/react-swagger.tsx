'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import '@/app/api-doc/swagger-fix.css';

function ReactSwagger() {
  return (
    <div className="swagger-initializer">
      <SwaggerUI
        url="/openapi.json"
        requestInterceptor={(req) => {
          req.credentials = 'include';
          return req;
        }}
      />
    </div>
  );
}

export default ReactSwagger;
