import {Router} from 'express';
import {authenticateToken, hasAccessLevel, AccessLevel} from '../middlewares/jwt.js';

/* Controllers */
import loansController from '../controllers/loans.js';
import usersController from '../controllers/users.js';
import devicesController from '../controllers/devices.js';
import classroomsController from '../controllers/classrooms.js';
import coursesController from '../controllers/courses.js';
import studentsController from '../controllers/students.js';
import teachersController from '../controllers/teachers.js';

const router = Router();

const middlewares = (accessLevel: AccessLevel[]) => {
  return [
    authenticateToken, 
    hasAccessLevel(accessLevel)
  ];
}

///////////////////////////////////
// Prestamos
///////////////////////////////////
router.post('/loan', middlewares(["admin", "common"]), loansController.uploadLoan);
router.get('/loans', middlewares(["admin", "common"]), loansController.getAllLoans);
router.get('/loans/active', middlewares(["admin", "common"]), loansController.getActiveLoans);
router.patch('/loan/return', middlewares(["admin", "common"]), loansController.returnLoan);
router.patch('/loan/modify', middlewares(["admin", "common"]), loansController.updateLoan);

///////////////////////////////////
// Usuarios
///////////////////////////////////
router.post('/login', usersController.login);

///////////////////////////////////
// Dispositivos
///////////////////////////////////
router.get('/devices', middlewares(["admin", "common"]), devicesController.getAllDevices);

///////////////////////////////////
// Materias
///////////////////////////////////
router.get('/courses', middlewares(["admin", "common"]), coursesController.getCourses);

///////////////////////////////////
// Maestros
///////////////////////////////////
router.get('/teachers', middlewares(["admin", "common"]), teachersController.getTeachers);

///////////////////////////////////
// Aulas
///////////////////////////////////
router.get('/classrooms', middlewares(["admin", "common"]), classroomsController.getClassrooms);

///////////////////////////////////
// Alumnos
///////////////////////////////////
router.get('/students', middlewares(["admin", "common"]), studentsController.getStudents);

export default router;