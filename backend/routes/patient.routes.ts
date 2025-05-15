import express from 'express';
import { 
  getAllPatients, 
  getPatientById, 
  createPatient, 
  updatePatient, 
  deletePatient 
} from '../controllers/patients.controller';
import { validateAuth } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(validateAuth);

// Obter todos os pacientes do usuário autenticado
router.get('/', getAllPatients);

// Obter um paciente específico por ID
router.get('/:id', getPatientById);

// Criar um novo paciente
router.post('/', createPatient);

// Atualizar um paciente existente
router.put('/:id', updatePatient);

// Excluir um paciente
router.delete('/:id', deletePatient);

export default router;