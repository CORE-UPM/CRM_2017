var express = require('express');
var router = express.Router();

var multer  = require('multer');
var upload = multer({ dest: './uploads/', limits: {fileSize: 20*1024*1024} });

var userController = require('../controllers/user_controller');
var sessionController = require('../controllers/session_controller');

var companyController = require('../controllers/company_controller');
var customerController = require('../controllers/customer_controller');
var targettypeController = require('../controllers/targettype_controller');
var visitController = require('../controllers/visit_controller');
var targetController = require('../controllers/target_controller');
var reportController = require('../controllers/report_controller');
var favouriteController = require('../controllers/favourite_controller');
var trashController = require('../controllers/trash_controller');
var postController = require('../controllers/post_controller');
var commentController = require('../controllers/comment_controller');

var hc = require('../controllers/history_controller');


// autologout
router.all('*',sessionController.deleteExpiredUserSession);

//-----------------------------------------------------------

// Autoload de parametros
router.param('userId', userController.load);
router.param('companyId', companyController.load);  
//router.param('salesmanId', salesmanController.load);
router.param('customerId', customerController.load);    
router.param('targettypeId', targettypeController.load);    
router.param('visitId', visitController.load);    
router.param('targetId', targetController.load);

router.param('postId', postController.load);
router.param('commentId', commentController.load);


//-----------------------------------------------------------

// History

router.get('/goback', hc.goBack);
router.get('/reload', hc.reload);

// Rutas que no acaban en /new, /edit, /import, /session
// Y tampoco es /
router.get(/(?!\/new$|\/edit$|\/import$|\/session$)\/[^\/]+$/, hc.push);

// Rutas que acaban en /new, /edit, /import, /token o /session
router.get(/.*\/(new|edit|import|token|session)$/, hc.skip);

// Ruta Home
router.get('/', hc.reset);

// La saco de la historia porque hace una redireccion a otro sitio.
router.get('/users/:userId(\\d+)/visits', hc.pop);

// Saco de la historia los adjuntos fallidos.
router.get('/uploads/*', hc.pop);


//-----------------------------------------------------------


// GET home page.
router.get('/', function (req, res, next) {
        res.render('index');
    }
);

// Definición de rutas de sesion
router.get('/session',
    sessionController.new);     // formulario login
router.post('/session',
    sessionController.create);  // crear sesión
router.delete('/session',
    sessionController.destroy); // destruir sesión

//-----------------------------------------------------------

// Se necesita estar logeado para hacer cualquier, excepto logearse.
router.all('*', sessionController.loginRequired);

//-----------------------------------------------------------


// Definición de rutas de cuentas/usuarios
router.get('/users',
    sessionController.adminOrManagerRequired,
    userController.indexAll);   // listado de todos los usuarios

router.get('/salesmen',
    sessionController.adminOrManagerRequired,
    userController.indexSalesmen);  // Listado de los usuarios vendedores

router.get('/managers',
    sessionController.adminOrManagerRequired,
    userController.indexManagers);  // Listado de los usuarios gestores

router.get('/admins',
    sessionController.adminOrManagerRequired,
    userController.indexAdmins);  // Listado de los usuarios administradores


router.get('/users/:userId(\\d+)',
    sessionController.adminOrManagerOrMyselfRequired,
    userController.show);    // ver un usuario

router.get('/users/new',
    sessionController.adminRequired,
    userController.new);     // formulario crear usuario
router.post('/users',
    sessionController.adminRequired,
    upload.single('photo'),
    userController.create);     // registrar usuario
router.get('/users/:userId(\\d+)/edit',
    sessionController.adminOrMyselfRequired,
    userController.edit);     // editar información de cuenta
router.put('/users/:userId(\\d+)',
    sessionController.adminOrMyselfRequired,
    upload.single('photo'),
    userController.update);   // actualizar información de cuenta
router.delete('/users/:userId(\\d+)',
    sessionController.adminAndNotMyselfRequired,
    userController.destroy);  // borrar cuenta

router.put('/users/:userId(\\d+)/token',
    sessionController.adminOrMyselfRequired,
    userController.createToken);   // generar un nuevo token


// Definicion de rutas para las fabricas
router.get('/companies',
    sessionController.adminOrManagerOrSalesmanRequired,
    companyController.index);
router.get('/companies/:companyId(\\d+)',
    sessionController.adminOrManagerOrSalesmanRequired,
    companyController.show);
router.get('/companies/new',
    sessionController.adminRequired,
    companyController.new);
router.post('/companies',
    sessionController.adminRequired,
    companyController.create);
router.get('/companies/:companyId(\\d+)/edit',
    sessionController.adminRequired,
    companyController.edit);
router.put('/companies/:companyId(\\d+)',
    sessionController.adminRequired,
    companyController.update);
router.delete('/companies/:companyId(\\d+)',
    sessionController.adminRequired,
    companyController.destroy);

router.get('/companies/:companyId(\\d+)/statistics',
    sessionController.adminOrManagerRequired,
    companyController.statistics);


router.get('/companies/:companyId(\\d+)/visits/new',
    sessionController.adminOrManagerOrSalesmanRequired,
    companyController.visitsNew);
router.post('/companies/:companyId(\\d+)/visits',
    sessionController.adminOrManagerOrSalesmanRequired,
    companyController.visitsCreate);



// Definicion de rutas para los clientes
router.get('/customers',
    sessionController.adminOrManagerOrSalesmanRequired,
    customerController.index);
router.get('/customers/:customerId(\\d+)',
    sessionController.adminOrManagerOrSalesmanRequired,
    customerController.show);
router.get('/customers/new',
    sessionController.adminOrManagerRequired,
    customerController.new);
router.post('/customers',
    sessionController.adminOrManagerRequired,
    customerController.create);
router.get('/customers/:customerId(\\d+)/edit',
    sessionController.adminOrManagerRequired,
    customerController.edit);
router.put('/customers/:customerId(\\d+)',
    sessionController.adminOrManagerRequired,
    customerController.update);
router.delete('/customers/:customerId(\\d+)',
    sessionController.adminRequired,
    customerController.destroy);


router.get('/customers/import',
    sessionController.adminRequired,
    customerController.importForm);
router.post('/customers/import',
    sessionController.adminRequired,
    upload.single('csv'),
    customerController.importPost);


// Definicion de rutas para los tipos de objetivos
router.get('/targettypes',
    sessionController.adminRequired,
    targettypeController.index);
router.get('/targettypes/:targettypeId(\\d+)',
    sessionController.adminRequired,
    targettypeController.show);
router.get('/targettypes/new',
    sessionController.adminRequired,
    targettypeController.new);
router.post('/targettypes',
    sessionController.adminRequired,
    targettypeController.create);
router.get('/targettypes/:targettypeId(\\d+)/edit',
    sessionController.adminRequired,
    targettypeController.edit);
router.put('/targettypes/:targettypeId(\\d+)',
    sessionController.adminRequired,
    targettypeController.update);
router.delete('/targettypes/:targettypeId(\\d+)',
    sessionController.adminRequired,
    targettypeController.destroy);



// Definicion de rutas para los objetivos de las visitas
router.get('/visits/:visitId(\\d+)/targets',
    visitController.admin_Or_Manager_Or_SalesmanIsLoggedUser_Required,
    targetController.index);
router.get('/visits/:visitId(\\d+)/targets/:targetId(\\d+)',
    visitController.admin_Or_Manager_Or_SalesmanIsLoggedUser_Required,
    targetController.show);
router.get('/visits/:visitId(\\d+)/targets/new',
    visitController.admin_Or_Manager_Or_SalesmanIsLoggedUser_Required,
    targetController.new);
router.post('/visits/:visitId(\\d+)/targets',
    visitController.admin_Or_Manager_Or_SalesmanIsLoggedUser_Required,
    targetController.create);
router.get('/visits/:visitId(\\d+)/targets/:targetId(\\d+)/edit',
    visitController.admin_Or_Manager_Or_SalesmanIsLoggedUser_Required,
    targetController.edit);
router.put('/visits/:visitId(\\d+)/targets/:targetId(\\d+)',
    visitController.admin_Or_Manager_Or_SalesmanIsLoggedUser_Required,
    targetController.update);
router.delete('/visits/:visitId(\\d+)/targets/:targetId(\\d+)',
    visitController.admin_Or_Manager_Or_SalesmanIsLoggedUser_Required,
    targetController.destroy);



// Definicion de rutas para las visitas
router.get('/visits',
    sessionController.adminOrManagerRequired,
    visitController.index);
router.get('/visits/:visitId(\\d+)',
    visitController.admin_Or_Manager_Or_SalesmanIsLoggedUser_Required,
    visitController.show);
router.get('/visits/new',
    sessionController.adminOrManagerOrSalesmanRequired,
    visitController.new);
router.post('/visits',
    sessionController.adminOrManagerOrSalesmanRequired,
    visitController.create);
router.get('/visits/:visitId(\\d+)/edit',
    visitController.admin_Or_Manager_Or_SalesmanIsLoggedUser_Required,
    visitController.edit);
router.put('/visits/:visitId(\\d+)',
    visitController.admin_Or_Manager_Or_SalesmanIsLoggedUser_Required,
    visitController.update);
router.delete('/visits/:visitId(\\d+)',
    sessionController.adminRequired,
    visitController.destroy);


router.get('/users/:userId(\\d+)/visits',
    sessionController.adminOrManagerOrMyselfRequired,
    visitController.index);
router.get('/salesmen/:userId(\\d+)/visits',
    sessionController.adminOrManagerOrMyselfRequired,
    visitController.index);

router.get('/customers/:customerId(\\d+)/visits',
    sessionController.adminOrManagerRequired,
    visitController.index);

router.get('/users/:userId(\\d+)/customers/:customerId(\\d+)/visits',
    sessionController.adminOrManagerOrMyselfRequired,
    visitController.index);
router.get('/salesmen/:userId(\\d+)/customers/:customerId(\\d+)/visits',
    sessionController.adminOrManagerOrMyselfRequired,
    visitController.index);


// Definicion de rutas para los informes
router.get('/reports',
    sessionController.adminOrManagerRequired,
    reportController.index);


// Rutas de Favoritos
router.put('/users/:userId([0-9]+)/favourites/:visitId(\\d+)',
    sessionController.adminOrMyselfRequired,
    favouriteController.add);

router.delete('/users/:userId([0-9]+)/favourites/:visitId(\\d+)',
    sessionController.adminOrMyselfRequired,
    favouriteController.del);


//----------------------------------------------------
// Impresion de visitas
//----------------------------------------------------

router.get('/visits/print',
    sessionController.adminOrManagerRequired,
    visitController.printIndex);

router.get('/customers/:customerId(\\d+)/visits/print',
    sessionController.adminOrManagerRequired,
    visitController.printIndex);

router.get('/users/:userId(\\d+)/visits/print',
    sessionController.adminOrManagerOrMyselfRequired,
    visitController.printIndex);
router.get('/salesmen/:userId(\\d+)/visits/print',
    sessionController.adminOrManagerOrMyselfRequired,
    visitController.printIndex);

router.get('/users/:userId(\\d+)/customers/:customerId(\\d+)/visits/print',
    sessionController.adminOrManagerOrMyselfRequired,
    visitController.printIndex);
router.get('/salesmen/:userId(\\d+)/customers/:customerId(\\d+)/visits/print',
    sessionController.adminOrManagerOrMyselfRequired,
    visitController.printIndex);

//----------------------------------------------------
// Blog
//----------------------------------------------------

router.get('/posts/:postId(\\d+)/comments',
    commentController.index);
router.get('/posts/:postId(\\d+)/comments/new',
    commentController.new);
router.get('/posts/:postId(\\d+)/comments/:commentId(\\d+)',
    commentController.show);
router.post('/posts/:postId(\\d+)/comments',
    commentController.create);
router.get('/posts/:postId(\\d+)/comments/:commentId(\\d+)/edit',
    commentController.loggedUserIsAuthorOrAdmin,
    commentController.edit);
router.put('/posts/:postId(\\d+)/comments/:commentId(\\d+)',
    commentController.loggedUserIsAuthorOrAdmin,
    commentController.update);
router.delete('/posts/:postId(\\d+)/comments/:commentId(\\d+)',
    commentController.loggedUserIsAuthorOrAdmin,
    commentController.destroy);

router.get('/posts',
    postController.index);
router.get('/posts/new',
    postController.new);
router.get('/posts/:postId(\\d+)',
    postController.show);
router.post('/posts',
    postController.create);
router.get('/posts/:postId(\\d+)/edit',
    postController.loggedUserIsAuthorOrAdmin,
    postController.edit);
router.put('/posts/:postId(\\d+)',
    postController.loggedUserIsAuthorOrAdmin,
    postController.update);
router.delete('/posts/:postId(\\d+)',
    postController.loggedUserIsAuthorOrAdmin,
    postController.destroy);

router.get('/posts/:postId(\\d+)/attachments/new',
    postController.loggedUserIsAuthor,
    postController.newAttachment);
router.post('/posts/:postId(\\d+)/attachments',
    postController.loggedUserIsAuthor,
    upload.single('attachment'),
    postController.createAttachment);
router.delete('/posts/:postId(\\d+)/attachments/:attachmentId_wal(\\d+)',   // wal = without auto loading
    postController.loggedUserIsAuthor,
    postController.destroyAttachment);

//----------------------------------------------------
//  Papelera de Reciclaje
// ----------------------------------------------------

// Listar contenido de la Papelera de Reciclaje
router.get('/trash',
    sessionController.adminRequired,
    trashController.index);


router.get("/trash/customers",
    sessionController.adminRequired,
    trashController.customers);
router.delete('/trash/customers/:customerId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.customerDestroy);
router.post('/trash/customers/:customerId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.customerRestore);


router.get("/trash/visits",
    sessionController.adminRequired,
    trashController.visits);
router.delete('/trash/visits/:visitId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.visitDestroy);
router.post('/trash/visits/:visitId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.visitRestore);


router.get("/trash/companies",
    sessionController.adminRequired,
    trashController.companies);
router.delete('/trash/companies/:companyId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.companyDestroy);
router.post('/trash/companies/:companyId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.companyRestore);


router.get("/trash/targettypes",
    sessionController.adminRequired,
    trashController.targettypes);
router.delete('/trash/targettypes/:targettypeId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.targettypeDestroy);
router.post('/trash/targettypes/:targettypeId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.targettypeRestore);


router.get("/trash/users",
    sessionController.adminRequired,
    trashController.users);
router.delete('/trash/users/:userId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.userDestroy);
router.post('/trash/users/:userId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.userRestore);


router.get("/trash/posts",
    sessionController.adminRequired,
    trashController.posts);
router.delete('/trash/posts/:postId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.postDestroy);
router.post('/trash/posts/:postId_wal(\\d+)',   // wal = without auto loading
    sessionController.adminRequired,
    trashController.postRestore);

//----------------------------------------------------

module.exports = router;
