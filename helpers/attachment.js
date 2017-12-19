var cloudinary = require('cloudinary');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');




/**
 * Crea una promesa para salvar un fichero subido al portal en almacenamiento permanente.
 *
 * Si puede salvar el fichero la promesa se satisface y devuelve un public_id y
 * la url del recurso subido.
 * Si no puede salvar el fichero, la promesa se rechaza.
 *
 * Para decidir donde se salva el fichero:
 *   Si existe la variable de entorno CLOUDINARY_URL, entonces se salva en Cloudinary,
 *   sino se salva en el sistema de ficheros local, en public/uploads.
 *
 * @return Devuelve una Promesa.
 */
exports.uploadResource = function (src, options) {

    return new Promise(function (resolve, reject) {

        if (!!process.env.CLOUDINARY_URL) {

            resolve(uploadResourceToCloudinary(src, options));

        } else {

            resolve(uploadResourceToFileSystem(src, options));

        }
    });
};


/**
 * Crea una promesa para subir un fichero nuevo a Cloudinary.
 *
 * Si puede subir el fichero la promesa se satisface y devuelve el public_id y
 * la url del recurso subido.
 * Si no puede subir el fichero, la promesa se rechaza.
 *
 * @return Devuelve una Promesa.
 */
function uploadResourceToCloudinary(src, options) {

    return new Promise(function (resolve, reject) {

        cloudinary.v2.uploader.upload(
            src,
            options,
            function (error, result) {
                if (!error) {
                    resolve({public_id: result.public_id, url: result.secure_url});
                } else {
                    reject(error);
                }
            }
        );
    })
};


/**
 * Crea una promesa para guardar un fichero en el sistema de ficheros local.
 *
 * Si puede guardar el fichero la promesa se satisface y devuelve el public_id y
 * la url del fichero guardado.
 * Si no puede guardar el fichero, la promesa se rechaza.
 *
 * @return Devuelve una Promesa.
 */
function uploadResourceToFileSystem(src, options) {

    return new Promise(function (resolve, reject) {

        const salt = Math.round((new Date().valueOf() * Math.random())) + '';
        const public_id = crypto.createHmac('sha256', salt).update(src).digest('hex');

        const url = path.join("/uploads", public_id);

        const destination = path.join("public", "uploads", public_id);

        fs.copyFile(src, destination, fs.constants.COPYFILE_EXCL, function (error) {

            if (error) {
                reject(error);
            } else {
                resolve({
                    public_id: public_id,
                    url: url
                });
            }
        });
    });
};

/**
 * Elimina un fichero del almacenamiento permanente.
 *
 * Para decidir de donde hay que borrar el fichero:
 *  1- Si existe la variable de entorno CLOUDINARY_URL, entonces se borra de Cloudinary; fin.
 *  2- Si existe la variable de entorno ATTACHMENT_STORAGE_URL, entonces se borra del sistema de
 *     ficheros; fin.
 *  3- Error.
 */
exports.deleteResource = function (public_id) {

        if (!!process.env.CLOUDINARY_URL) {

            // Borrar el fichero en Cloudinary.
            cloudinary.api.delete_resources(public_id);

        } else {

            const destination = path.join("public", "uploads", public_id);

            // Borrar del sistema de ficheros.
            fs.unlink(destination, function(error) {
                console.log("Error al borrar un adjunto:", error);
            });

        }
};


/**
 * Devuelve la URL de la imagen con el public_id dado.
 * @param public_id Identifica la imagen
 * @param options   Opciones para construir la URL:
 * @returns {string} La URL de la imagen.
 */
exports.image = function (public_id, options) {

    if (!!process.env.CLOUDINARY_URL) {

        return cloudinary.image(public_id, options);

    } else {

        const src = path.join("/uploads", public_id);
        const width = options.width || "";

        return "<img src='" + src + "' width='" + width + "' >"
    }
};


/**
 * Devuelve la URL del video mp4 con el public_id dado.
 * @param public_id Identifica el video
 * @param options   Opciones para construir la URL:
 * @returns {string} La URL del video.
 */exports.video = function (public_id, options) {

    if (!!process.env.CLOUDINARY_URL) {

        return cloudinary.video(public_id, options);

    } else {

        const src = path.join("/uploads", public_id);
        const width = options.width || "";
        const controls = !!options.controls ? "controls" : "";

        return "<video width='" + width + "' " + controls + " >" +
               "   <source src='" + src + "' type='video/mp4' >" +
               "</video>"
    }
};
