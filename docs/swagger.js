
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',

        info: {
            title: 'ORION SYSTEM API',
            version: '1.0.0',
            description:
                'Documentación de la API del sistema ORION SYSTEM CORPORATION'
        },

        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor local'
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },

    apis: ['./routes/*.routes.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
