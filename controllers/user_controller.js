var models = require('../models');
var Sequelize = require('sequelize');
var paginate = require('../helpers/paginate').paginate;
var authentication = require('../helpers/authentication');
var cloudinary = require('cloudinary');
var fs = require('fs');

var attachmentHelper = require("../helpers/attachment.js");

var moment = require('moment');

//-----------------------------------------------------------

// Opciones para imagenes subidas a Cloudinary
var cloudinary_image_options = {
    async: true,
    folder: "/crm/" + (process.env.CLOUDINARY_SUBFOLDER || "iweb") + "/users",
    crop: 'limit',
    width: 200,
    height: 200,
    radius: 5,
    border: "3px_solid_blue",
    tags: ['core', 'iweb', 'cdps', 'crm']
};

//-----------------------------------------------------------

// Autoload el user asociado a :userId
exports.load = function (req, res, next, userId) {
    models.User.findById(userId,
        {
            include: [
                {model: models.Attachment, as: 'Photo'}
            ],
            order: [['login']]
        })
    .then(function (user) {
        if (user) {
            req.user = user;
            next();
        } else {
            req.flash('error', 'No existe el usuario con id=' + userId + '.');
            throw new Error('No existe userId=' + userId);
        }
    })
    .catch(function (error) {
        next(error);
    });
};


// GET /users
exports.indexAll = function (req, res, next) {

    index(req, res, next, {}, "Usuarios")
};

// GET /salesmen
exports.indexSalesmen = function (req, res, next) {

    index(req, res, next, {isSalesman: true}, "Vendedores")
};

// GET /managers
exports.indexManagers = function (req, res, next) {

    index(req, res, next, {isManager: true}, "Gestores")
};

// GET /admins
exports.indexAdmins = function (req, res, next) {

    index(req, res, next, {isAdmin: true}, "Administradores")
};

function index(req, res, next, where, title) {
    var countOptions = {};

    var findOptions = {};
    findOptions.where = where;
    findOptions.include = [
        {model: models.Attachment, as: 'Photo'}
    ];
    findOptions.order = [];

    //----------------

    models.User.count(countOptions)
    .then(function (count) {

        // Paginacion:

        var items_per_page = 25;

        // La pagina a mostrar viene en la query
        var pageno = parseInt(req.query.pageno) || 1;

        // Datos para obtener el rango de datos a buscar en la BBDD.
        var pagination = {
            offset: items_per_page * (pageno - 1),
            limit: items_per_page
        };

        // Crear un string con el HTML que pinta la botonera de paginacion.
        // Lo añado como una variable local de res para que lo pinte el layout de la aplicacion.
        res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);

        return pagination;
    })
    .then(function (pagination) {

        findOptions.offset = pagination.offset;
        findOptions.limit = pagination.limit;

        findOptions.order.push(['login']);

        return models.User.findAll(findOptions);
    })
    .then(function (users) {
        res.render('users/index', {
            title: title,
            users: users
        });
    })
    .catch(function (error) {
        next(error);
    });
};


// GET /users/:id
exports.show = function (req, res, next) {
    res.render('users/show', {user: req.user});
};


// GET /users/new
exports.new = function (req, res, next) {

    var user = models.User.build({
        login: "",
        password: "",
        fullname: "",
        isAdmin: false,
        isSalesman: true,
        isManager: true,
        phone1: "",
        phone2: "",
        email1: "",
        email2: "",
        notes: ""
    });

    res.render('users/new', {user: user});
};


// POST /users
exports.create = function (req, res, next) {

    var user = {
        login: req.body.login,
        password: req.body.password,
        fullname: req.body.fullname,
        isAdmin: req.body.isAdmin || false,
        isSalesman: req.body.isSalesman || false,
        isManager: req.body.isManager || false,
        phone1: req.body.phone1.trim(),
        phone2: req.body.phone2.trim(),
        email1: req.body.email1.trim(),
        email2: req.body.email2.trim(),
        notes: req.body.notes.trim()
    };

    // El login debe ser unico:
    models.User.find({where: {login: req.body.login}})
    .then(function (existing_user) {
        if (existing_user) {
            var emsg = "Ya existe un usuario con login \"" + req.body.login + "\"."
            req.flash('error', emsg);
            res.render('users/new', {user: user});
        } else {

            // Crear el valor de Token:
            user.token = authentication.createToken();

            // Guardar en la BBDD
            return models.User.create(user)
            .then(function (user) {
                req.flash('success', 'Usuario creado con éxito.');

                if (!req.file) {
                    req.flash('info', 'Es un Usuario sin fotografía.');
                    return user;
                }

                // Salvar la imagen en Cloudinary o en el sistema de ficheros local
                return attachmentHelper.uploadResource(req.file.path, cloudinary_image_options)
                .catch(function (error) {
                    req.flash('error', 'No se ha podido salvar la fotografía: ' + error.message);
                    throw error;
                })
                .then(function (uploadResult) {
                    // Crear nuevo attachment en la BBDD.
                    return createAttachment(req, uploadResult, user);
                })
                .then(function () {
                    return user;
                });
            })
            .then(function (user) {
                // Renderizar pagina de usuarios
                res.redirect("/users/" + user.id);
            })
            .catch(Sequelize.ValidationError, function (error) {
                req.flash('error', 'Errores en el formulario:');
                for (var i in error.errors) {
                    req.flash('error', error.errors[i].value);
                }

                res.render('users/new', {user: user});
            });
        }
    })
    .catch(function (error) {
        next(error);
    })
    .finally(function() {
        var path = req.file.path;
        fs.unlink(path); // borrar la imagen subida a ./uploads
    });
};


// GET /users/:id/edit
exports.edit = function (req, res, next) {

    var user = {user: req.user}; // req.user: instancia de user cargada con autoload

    res.render('users/edit', user);
};


// PUT /users/:id
exports.update = function (req, res, next) {

    // req.user.login  = req.body.login; // No se permite su edicion
    req.user.fullname = req.body.fullname;
    req.user.isAdmin = req.body.isAdmin || false;
    req.user.isSalesman = req.body.isSalesman || false;
    req.user.isManager = req.body.isManager || false;
    req.user.phone1 = req.body.phone1.trim();
    req.user.phone2 = req.body.phone2.trim();
    req.user.email1 = req.body.email1.trim();
    req.user.email2 = req.body.email2.trim();
    req.user.notes = req.body.notes.trim();

    var fields_to_update = ["fullname", "phone1", "phone2", "email1", "email2", "notes" ];

    if (req.session.user && req.session.user.isAdmin) {
        fields_to_update.push("isAdmin");
        fields_to_update.push("isSalesman");
        fields_to_update.push("isManager");
    }

    // ¿Cambio el password?
    if (req.body.password) {
        console.log('Hay que actualizar el password');
        req.user.password = req.body.password;
        fields_to_update.push('salt');
        fields_to_update.push('password');
    }

    req.user.save({fields: fields_to_update})
    .then(function (user) {
        req.flash('success', 'Usuario actualizado con éxito.');

        // Actualizar la informacion de la session si user es el usuario logueado.
        if (req.session.user && req.session.user.id == user.id) {
            req.session.user.fullname = user.fullname;
            req.session.user.isAdmin = user.isAdmin;
            req.session.user.isSalesman = user.isSalesman;
            req.session.user.isManager = user.isManager;
        }

        if (req.body.keepphoto) {
            return user;
        }

        // Sin imagen: Eliminar attachment e imagen viejos.
        if (!req.file) {
            req.flash('info', 'Tenemos un usuario sin fotografía.');
            if (user.Photo) {
                attachmentHelper.deleteResource(user.Photo.public_id);
                user.Photo.destroy();
            }
            return user;
        }

        // Salvar la foto nueva en Cloudinary o en el sistema de ficheros
        return attachmentHelper.uploadResource(req.file.path, cloudinary_image_options)
        .catch(function (error) {
            req.flash('error', 'No se ha podido salvar la fotografía: ' + error.message);
            throw error;
        })
        .then(function (uploadResult) {
            // Actualizar el attachment en la BBDD.
            return updateAttachment(req, uploadResult, user);
        })
        .then(function () {
            return user;
        });
    })
    .then(function (user) {
        res.redirect('/users/' + user.id);
    })
    .catch(Sequelize.ValidationError, function (error) {
        req.flash('error', 'Errores en el formulario:');
        for (var i in error.errors) {
            req.flash('error', error.errors[i].value);
        }

        res.render('users/edit', {user: req.user});
    })
    .catch(function (error) {
        next(error);
    })
    .finally(function() {
        var path = req.file.path;
        fs.unlink(path); // borrar la imagen subida a ./uploads
    });
};

//-----------------------------------------------------------


// DELETE /users/:id
exports.destroy = function (req, res, next) {
    req.user.destroy()
    .then(function () {

        // Borrando usuario logeado.
        if (req.session.user && req.session.user.id === req.user.id) {
            // borra la sesión
            delete req.session.user;
        }

        req.flash('success', 'Usuario eliminado con éxito.');
        res.redirect('/reload');
    })
    .catch(function (error) {
        next(error);
    });
};


//-----------------------------------------------------------


// PUT /users/:id/token
// Genera y guarda un nuevo token
exports.createToken = function (req, res, next) {

    req.user.token = authentication.createToken();

    req.user.save({fields: ["token"]})
    .then(function (user) {
        req.flash('success', 'Token de Usuario generado con éxito.');
        res.redirect('/reload');
    })
    .catch(function (error) {
        next(error);
    });
};

//-----------------------------------------------------------

// FUNCIONES AUXILIARES - Cloudinary

/**
 * Crea una promesa para crear un attachment en la tabla Attachments.
 */
function createAttachment(req, uploadResult, user) {
    if (!uploadResult) {
        return Promise.resolve();
    }

    return models.Attachment.create({
        public_id: uploadResult.public_id,
        url: uploadResult.url,
        filename: req.file.originalname,
        mime: req.file.mimetype
    })
    .then(function (attachment) {
        return user.setPhoto(attachment);
    })
    .then(function () {
        req.flash('success', 'Fotografía guardada con éxito.');
    })
    .catch(function (error) { // Ignoro errores de validacion en imagenes
        req.flash('error', 'No se ha podido salvar la fotografía: ' + error.message);
        attachmentHelper.deleteResource(uploadResult.public_id);
    });
}


/**
 * Crea una promesa para actualizar un attachment en la tabla Attachments.
 */
function updateAttachment(req, uploadResult, user) {
    if (!uploadResult) {
        return Promise.resolve();
    }

    // Recordar public_id de la foto antigua.
    var old_public_id = user.Photo ? user.Photo.public_id : null;

    return user.getPhoto()
    .then(function (attachment) {
        if (!attachment) {
            attachment = models.Attachment.build({});
        }
        attachment.public_id = uploadResult.public_id;
        attachment.url = uploadResult.url;
        attachment.filename = req.file.originalname;
        attachment.mime = req.file.mimetype;
        return attachment.save();
    })
    .then(function (attachment) {
        return user.setPhoto(attachment);
    })
    .then(function (attachment) {
        req.flash('success', 'Imagen nueva guardada con éxito.');
        if (old_public_id) {
            attachmentHelper.deleteResource(old_public_id);
        }
    })
    .catch(function (error) { // Ignoro errores de validacion en imagenes
        req.flash('error', 'No se ha podido salvar la nueva imagen: ' + error.message);
        attachmentHelper.deleteResource(uploadResult.public_id);
    });
}


//------------------------------------------------

