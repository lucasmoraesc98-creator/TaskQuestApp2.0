// src/config/swagger.config.ts
export const swaggerConfig = {
  customSiteTitle: 'TaskQuest API Documentation',
  customfavIcon: '/favicon.ico',
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { 
      color: #667eea; 
      font-size: 2rem;
      font-weight: bold;
    }
    .swagger-ui .info { 
      margin: 20px 0; 
    }
    .swagger-ui .btn.authorize {
      background-color: #667eea;
      border-color: #667eea;
    }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showRequestHeaders: true,
  },
};
