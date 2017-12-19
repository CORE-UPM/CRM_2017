# Proyecto CRM 2017
## Customer Relationship Management

Servidor WEB que implementa un CRM muy simple.

## Instalación

Se ha probado en un mac y con dockers.

Instalar previamente nodejs (8.9) y npm (4.6) (o superiores).

Para almacenar las fotos y y los ficheros usados es necesario crearse una cuenta en Cloudinary.

Variables de entorno de configuración:
* CLOUDINARY_URL - URL con las credenciales para usar la cuenta creada en Cloudinary. Obligatorio.
* CLOUDINARY_SUBFOLDER - Nombre del directorio donde guardar los ficheros. Opcional.
* CRM_TITLE - Título para la cabecera. Opcional.
* CRM_LOGO_URL -  URL a una imagen con el logo de la cabecera. Opcional.
* CRM_HOME_IMG_URL - URL a una imagen para usar en la página home. Opcional.
* DATABASE_URL - URL de acceso a la base de datos. Si se omite se usa un valor por defecto para usar SQLite. Cuidado: no puede haber blanco en el path absoluto hasta el directorio de trabajo. Opcional.
* DATABASE_STORAGE - Nombre de fichero con la base de datos (solo para SQLite). Opcional.

Instalar dependencias

    $ npm install

Aplicar migraciones:

    $ npm run-script migrate_local
    
Ejecutar seeder

    $ npm run-script seed_local
    
Ejecutar el servidor:

    $ npm run-script supervisor
    
URL donde corre el servidor:

    http://localhost:3000
    
    